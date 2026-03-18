import asyncio
import json
import os
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis

router = APIRouter()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

CHANNEL = "vitagloss:events"


async def event_generator():
    """Suscribe a Redis pub/sub y emite eventos SSE al cliente."""
    r = aioredis.from_url(REDIS_URL)
    pubsub = r.pubsub()
    await pubsub.subscribe(CHANNEL)

    # Enviar ping inicial
    yield f"data: {json.dumps({'type': 'connected', 'message': 'Sistema conectado', 'ts': datetime.utcnow().isoformat()})}\n\n"

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "message":
                yield f"data: {message['data'].decode()}\n\n"
            else:
                # Heartbeat cada segundo para mantener la conexión viva
                yield f": heartbeat\n\n"
            await asyncio.sleep(0.5)
    except asyncio.CancelledError:
        pass
    finally:
        await pubsub.unsubscribe(CHANNEL)
        await r.aclose()


@router.get("/stream/events")
async def stream_events():
    """Endpoint SSE — emite eventos del sistema en tiempo real."""
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/stream/posts/recent")
async def recent_posts():
    """Últimos 20 posts generados."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.social_automation
    posts = []
    async for post in db.posts.find({}).sort("created_at", -1).limit(20):
        posts.append({
            "id": str(post["_id"]),
            "topic": post.get("topic", ""),
            "content_type": post.get("content_type", "general"),
            "status": post.get("status", "pending"),
            "published": post.get("published", False),
            "scheduled_hour": post.get("scheduled_hour"),
            "date": post.get("date", ""),
            "created_at": post.get("created_at", ""),
            "text_preview": post.get("content", {}).get("text", "")[:120] + "..." if post.get("content", {}).get("text") else "",
            "has_image": bool(post.get("content", {}).get("image_local_path")),
        })
    client.close()
    return posts


@router.get("/stream/stats")
async def system_stats():
    """Estadísticas generales del sistema."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.social_automation
    today = datetime.utcnow().strftime("%Y-%m-%d")

    total_posts = await db.posts.count_documents({})
    today_posts = await db.posts.count_documents({"date": today})
    published_posts = await db.posts.count_documents({"published": True})
    pending_posts = await db.posts.count_documents({"published": False, "status": "auto_approved"})
    total_prospects = await db.prospects.count_documents({})
    new_prospects = await db.prospects.count_documents({"status": "nuevo"})

    client.close()
    return {
        "total_posts": total_posts,
        "today_posts": today_posts,
        "published_posts": published_posts,
        "pending_posts": pending_posts,
        "total_prospects": total_prospects,
        "new_prospects": new_prospects,
    }


@router.post("/stream/trigger/generate")
async def trigger_generate():
    """Dispara la generación de contenido manual desde el dashboard."""
    from worker.tasks.daily_tasks import daily_content_generation
    task = daily_content_generation.delay()
    return {"task_id": task.id, "status": "queued"}


@router.get("/stream/check-tokens")
async def check_tokens():
    """Verifica si los tokens de Facebook/Instagram son válidos."""
    import httpx
    fb_token = os.getenv("FACEBOOK_ACCESS_TOKEN", "")
    page_id  = os.getenv("FACEBOOK_PAGE_ID", "")
    result   = {"facebook": None, "page": None, "page_id": page_id, "has_app_credentials": bool(os.getenv("FACEBOOK_APP_ID"))}

    # Check stored Page Token in MongoDB
    try:
        client_db = AsyncIOMotorClient(MONGO_URL)
        db = client_db.social_automation
        doc = await db.config.find_one({"_id": "meta_credentials"})
        if doc:
            result["stored_page_token"] = {
                "exists": True,
                "saved_at": doc.get("saved_at", ""),
                "token_prefix": (doc.get("page_token", "") or "")[:12] + "...",
            }
            # Use the stored page token for the live check (it never expires)
            fb_token = doc.get("page_token", fb_token) or fb_token
        else:
            result["stored_page_token"] = {"exists": False}
        client_db.close()
    except Exception:
        result["stored_page_token"] = {"exists": False}

    if not fb_token:
        result["facebook"] = {"valid": False, "error": "Token no configurado"}
        return result

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(
                "https://graph.facebook.com/v18.0/me",
                params={"access_token": fb_token, "fields": "id,name"}
            )
            data = r.json()
            if "error" in data:
                result["facebook"] = {"valid": False, "error": data["error"]["message"], "code": data["error"].get("code")}
            else:
                result["facebook"] = {"valid": True, "name": data.get("name"), "id": data.get("id")}
        except Exception as e:
            result["facebook"] = {"valid": False, "error": str(e)}

    if result["facebook"].get("valid") and page_id:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                r = await client.get(
                    f"https://graph.facebook.com/v18.0/{page_id}",
                    params={"access_token": fb_token, "fields": "id,name"}
                )
                data = r.json()
                if "error" in data:
                    result["page"] = {"valid": False, "error": data["error"]["message"]}
                else:
                    result["page"] = {"valid": True, "name": data.get("name")}
            except Exception as e:
                result["page"] = {"valid": False, "error": str(e)}

    return result


class RefreshTokenRequest(BaseModel):
    user_token: str


@router.post("/stream/refresh-token")
async def refresh_token(req: RefreshTokenRequest):
    """
    Recibe un User Token del Graph API Explorer, lo intercambia por un
    Page Token permanente y lo guarda en MongoDB.
    Después de esto, no necesitas volver a pegar tokens manualmente.
    """
    from api.services.meta_publisher import meta_publisher
    result = await meta_publisher.exchange_and_store(req.user_token.strip())
    return result


@router.post("/stream/trigger/publish")
async def trigger_publish():
    """Dispara publicación del siguiente post pendiente."""
    from worker.tasks.daily_tasks import publish_next_post
    task = publish_next_post.delay()
    return {"task_id": task.id, "status": "queued"}
