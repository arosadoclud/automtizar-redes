from worker.celery_app import celery_app
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
from datetime import datetime, date

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")

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
                            image_url = await generate_image_dalle(content["image_prompt"])
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

                except Exception as e:
                    print(f"❌ Error: {e}")

        return total_generated

    total = run_async(generate_daily_posts())
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
            image_path=post["content"].get("image_local_path"),
            hashtags=[]
        )

        await db.posts.update_one(
            {"_id": post["_id"]},
            {"$set": {
                "published": True,
                "published_at": datetime.utcnow().isoformat(),
                "publish_results": result,
                "status": "published"
            }}
        )

        fb_ok = result.get("facebook", {}).get("success", False)
        ig_ok = result.get("instagram", {}).get("success", False)
        print(f"✅ FB:{fb_ok} | IG:{ig_ok} | [{post.get('content_type')}]")
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
