from worker.celery_app import celery_app
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import json
import redis
from datetime import datetime, date

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CHANNEL = "vitagloss:events"

# Cliente Redis síncrono para publicar eventos desde Celery
_redis_client = None

def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL)
    return _redis_client

def publish_event(event_type: str, message: str, data: dict = None):
    """Publica un evento al canal Redis para el dashboard en tiempo real."""
    try:
        payload = {
            "type": event_type,
            "message": message,
            "ts": datetime.utcnow().isoformat(),
            "data": data or {}
        }
        get_redis().publish(CHANNEL, json.dumps(payload))
    except Exception:
        pass  # No interrumpir el worker por fallos del evento

def get_db():
    """Helper para obtener conexión a MongoDB"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client.social_automation

def run_async(coro):
    """Ejecuta coroutine en el event loop de Celery."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


# ─────────────────────────────────────────────────────────────
# GENERACIÓN MASIVA DE CONTENIDO (7 posts/día)
# ─────────────────────────────────────────────────────────────

@celery_app.task
def daily_content_generation():
    """
    Genera los 7 posts del día para todos los workspaces.
    Se ejecuta a las 7:00 AM.
    50 posts/semana: educativo, producto, micro_post, testimonio, reclutamiento, reel
    """
    print("✨ Generando contenido del día (7 posts por workspace)...")
    publish_event("task_start", "✨ Iniciando generación de 7 posts del día...")

    async def generate_daily_posts():
        from api.services.content_strategy import get_daily_content_plan, generate_content_by_type
        from api.services.openai_service import generate_image_dalle, download_image

        db = get_db()
        total_generated = 0
        today = date.today().isoformat()

        async for workspace in db.workspaces.find({}):
            workspace_id = str(workspace["_id"])
            workspace_name = workspace.get("name", "")

            existing_today = await db.posts.count_documents({
                "workspace_id": workspace_id,
                "date": today
            })
            if existing_today >= 7:
                print(f"Ya hay {existing_today} posts para hoy en '{workspace_name}'")
                continue

            plan = get_daily_content_plan()

            for item in plan:
                try:
                    content = await generate_content_by_type(
                        content_type=item["content_type"],
                        topic=item["topic"],
                        workspace_name=workspace_name
                    )

                    image_url = None
                    image_path = None
                    use_dalle = os.getenv("USE_DALLE", "true").lower() == "true"

                    if use_dalle and content.get("image_prompt") and item["content_type"] != "reel":
                        try:
                            image_url = await generate_image_dalle(
                                prompt=content["image_prompt"],
                                topic=item["topic"],
                                content_text=content.get("text", "")
                            )
                            if image_url:
                                os.makedirs("generated_images", exist_ok=True)
                                ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                                image_path = f"generated_images/post_{ts}.png"
                                await download_image(image_url, image_path)
                                content["image_url"] = image_url
                                content["image_local_path"] = image_path
                        except Exception as e:
                            print(f"⚠️ Imagen no generada: {e}")

                    post_doc = {
                        "workspace_id": workspace_id,
                        "topic": item["topic"],
                        "content_type": item["content_type"],
                        "content": content,
                        "status": "auto_approved",
                        "scheduled_hour": item["scheduled_hour"],
                        "date": today,
                        "published": False,
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat(),
                    }

                    await db.posts.insert_one(post_doc)
                    total_generated += 1
                    print(f"✅ [{item['content_type']}] {item['topic']}")
                    publish_event("post_generated", f"✅ Post generado: {item['topic']}", {
                        "content_type": item["content_type"],
                        "topic": item["topic"],
                        "has_image": bool(image_path),
                        "text_preview": content.get("text", "")[:100],
                        "total": total_generated,
                    })

                except Exception as e:
                    print(f"❌ Error: {e}")
                    publish_event("post_error", f"❌ Error generando post: {str(e)[:80]}", {"topic": item["topic"]})

        return total_generated

    total = run_async(generate_daily_posts())
    publish_event("task_complete", f"🎉 Generación completada: {total} posts listos", {"total": total})
    return {"status": "completed", "posts_generated": total}


# ─────────────────────────────────────────────────────────────
# PUBLICACIÓN (7 veces al día: 8, 10, 12, 14, 16, 18, 21)
# ─────────────────────────────────────────────────────────────

@celery_app.task
def publish_next_post():
    """Publica el siguiente post para la hora actual."""
    current_hour = datetime.now().hour
    today = date.today().isoformat()
    print(f"📢 Publicando post de las {current_hour}:00...")

    async def do_publish():
        from api.services.meta_publisher import meta_publisher
        db = get_db()

        # Buscar post de esta hora o el siguiente disponible
        post = await db.posts.find_one({
            "status": "auto_approved",
            "published": False,
            "date": today,
            "scheduled_hour": current_hour
        }) or await db.posts.find_one({
            "status": {"$in": ["auto_approved", "approved"]},
            "published": False,
            "date": today,
        })

        if not post:
            print(f"⚠️ Sin posts disponibles para las {current_hour}:00")
            return {"published": 0}

        text = post["content"].get("text", "")
        hashtags = post["content"].get("hashtags", [])
        full_text = text + ("\n\n" + " ".join(hashtags) if hashtags else "")

        result = await meta_publisher.publish_to_both(
            text=full_text,
            image_url=post["content"].get("image_url"),
            image_path=post["content"].get("image_local_path"),
            hashtags=[]
        )

        fb_ok = result.get("facebook", {}).get("success", False)
        ig_ok = result.get("instagram", {}).get("success", False)

        # Log the actual error so it's visible in worker logs
        if not fb_ok:
            fb_err = result.get("facebook", {}).get("error", "unknown")
            print(f"❌ Facebook error: {fb_err}")
        if not ig_ok:
            ig_err = result.get("instagram", {}).get("error", "unknown")
            print(f"❌ Instagram error: {ig_err}")

        # Only mark as published if at least Facebook succeeded
        if fb_ok:
            await db.posts.update_one(
                {"_id": post["_id"]},
                {"$set": {
                    "published": True,
                    "published_at": datetime.utcnow().isoformat(),
                    "publish_results": result,
                    "status": "published"
                }}
            )
        else:
            await db.posts.update_one(
                {"_id": post["_id"]},
                {"$set": {
                    "publish_results": result,
                    "publish_error": result.get("facebook", {}).get("error", "unknown error"),
                    "publish_attempted_at": datetime.utcnow().isoformat(),
                }}
            )

        print(f"{'✅' if fb_ok else '❌'} FB:{fb_ok} | IG:{ig_ok} | [{post.get('content_type')}]")
        publish_event("post_published", f"📢 Publicado: {post.get('topic', '')}", {
            "content_type": post.get("content_type", ""),
            "topic": post.get("topic", ""),
            "facebook": fb_ok,
            "instagram": ig_ok,
            "text_preview": text[:100],
        })
        return {"published": 1, "facebook": fb_ok, "instagram": ig_ok}

    result = run_async(do_publish())
    return {"status": "completed", **result}


@celery_app.task
def publish_scheduled_posts():
    """Alias para compatibilidad."""
    return publish_next_post()


# ─────────────────────────────────────────────────────────────
# MENSAJES PENDIENTES (cada 5 minutos)
# ─────────────────────────────────────────────────────────────

@celery_app.task
def process_pending_messages():
    """Revisa prospectos pendientes de seguimiento."""
    async def check():
        db = get_db()
        return await db.prospects.count_documents({"status": "nuevo"})

    pending = run_async(check())
    if pending > 0:
        print(f"📩 {pending} prospectos pendientes")
    return {"status": "ok", "pending_prospects": pending}


# ─────────────────────────────────────────────────────────────
# MÉTRICAS (cada 6 horas)
# ─────────────────────────────────────────────────────────────

@celery_app.task
def collect_metrics():
    """Recolecta métricas de posts publicados."""
    print("📊 Recolectando métricas...")

    async def fetch():
        from api.services.meta_publisher import meta_publisher
        db = get_db()
        updated = 0

        async for post in db.posts.find({"published": True, "status": "published"}):
            try:
                results = post.get("publish_results", {})
                if results.get("facebook", {}).get("success"):
                    metrics = await meta_publisher.get_post_metrics(
                        results["facebook"]["post_id"], "facebook"
                    )
                    await db.posts.update_one(
                        {"_id": post["_id"]},
                        {"$set": {"metrics.facebook": metrics,
                                  "metrics.updated_at": datetime.utcnow().isoformat()}}
                    )
                if results.get("instagram", {}).get("success"):
                    metrics = await meta_publisher.get_post_metrics(
                        results["instagram"]["post_id"], "instagram"
                    )
                    await db.posts.update_one(
                        {"_id": post["_id"]},
                        {"$set": {"metrics.instagram": metrics}}
                    )
                updated += 1
            except Exception as e:
                print(f"❌ {e}")

        return updated

    n = run_async(fetch())
    return {"status": "completed", "metrics_collected": n}


@celery_app.task
def daily_trend_scan():
    """Alias legacy."""
    return {"status": "completed", "message": "Trend scan integrado en content_strategy"}


# ─────────────────────────────────────────────────────────────
# TOKEN AUTO-REFRESH (cada lunes 6:30 AM)
# ─────────────────────────────────────────────────────────────

@celery_app.task
def verify_and_refresh_token():
    """
    Verifica el Page Token guardado en MongoDB.
    Si es inválido, intenta re-obtenerlo usando el user token en .env.
    Publica un evento de alerta si el user token también ha expirado.
    """
    import httpx as _httpx
    print("🔑 Verificando estado del token de Meta...")
    publish_event("task_start", "🔑 Verificando token de Facebook/Instagram...")

    async def do_check():
        from api.services.meta_publisher import meta_publisher

        # Verificar el page token actual
        current_token = meta_publisher._page_token
        if not current_token:
            # Intentar cargar desde MongoDB
            current_token = await meta_publisher._load_cached_token_mongo()

        if current_token:
            try:
                async with _httpx.AsyncClient(timeout=10) as client:
                    r = await client.get(
                        "https://graph.facebook.com/v18.0/me",
                        params={"access_token": current_token, "fields": "id,name"}
                    )
                    data = r.json()
                    if "error" not in data:
                        print(f"✅ Token válido para: {data.get('name', 'página')}")
                        publish_event("token_ok", f"✅ Token de Meta válido: {data.get('name', '')}")
                        return {"valid": True}
                    else:
                        print(f"⚠️ Token inválido: {data['error']['message']}")
            except Exception as e:
                print(f"⚠️ Error verificando token: {e}")

        # Token inválido — intentar re-obtener desde user token en .env
        print("🔄 Intentando renovar Page Token desde user token...")
        meta_publisher.invalidate_token_cache()
        try:
            async with _httpx.AsyncClient(timeout=20) as client:
                new_token = await meta_publisher._ensure_page_token(client)
                if new_token and new_token != meta_publisher.user_token:
                    publish_event("token_refreshed", "✅ Page Token renovado automáticamente 🎉")
                    print("✅ Page Token renovado automáticamente")
                    return {"valid": True, "refreshed": True}
        except Exception as e:
            print(f"❌ No se pudo renovar: {e}")

        # Ambos fallaron — el user token también expiró
        publish_event(
            "token_expired",
            "❌ Token de Meta EXPIRADO — ve a Configuración → Conexiones y pega un token nuevo",
            {"action_required": True}
        )
        print("❌ Token expirado. Se requiere acción manual.")
        return {"valid": False, "action_required": True}

    result = run_async(do_check())
    return {"status": "completed", **result}
