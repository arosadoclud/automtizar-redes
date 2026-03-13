"""
Webhook para Facebook Messenger y eventos de página.

Este endpoint recibe:
- Mensajes entrantes de Messenger
- Reacciones y comentarios
- Eventos de la página
"""

import os
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, Query
from api.services.messenger_bot import process_incoming_message

router = APIRouter()

WEBHOOK_VERIFY_TOKEN = os.getenv("WEBHOOK_VERIFY_TOKEN", "vitagloss_webhook_2026")
APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")


def verify_facebook_signature(payload: bytes, signature: str) -> bool:
    """Verifica que el webhook viene realmente de Facebook."""
    if not APP_SECRET or not signature:
        return True  # Skip en desarrollo
    
    expected = "sha256=" + hmac.new(
        APP_SECRET.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)


# ─────────────────────────────────────────────────────────────
# GET: Verificación del webhook (requerido por Meta)
# ─────────────────────────────────────────────────────────────

@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """
    Meta llama a este endpoint para verificar el webhook.
    Debes configurar en Meta Developers:
    - URL del webhook: https://TU_DOMINIO/api/webhook/webhook
    - Verify Token: vitagloss_webhook_2026
    """
    if hub_mode == "subscribe" and hub_token == WEBHOOK_VERIFY_TOKEN:
        print(f"✅ Webhook verificado por Meta")
        return int(hub_challenge)

    raise HTTPException(status_code=403, detail="Token de verificación inválido")


# ─────────────────────────────────────────────────────────────
# POST: Recibir eventos de Facebook
# ─────────────────────────────────────────────────────────────

@router.post("/webhook")
async def receive_webhook(request: Request):
    """
    Recibe todos los eventos de Facebook:
    - messages: mensajes de Messenger
    - messaging_postbacks: clicks en botones
    - feed: comentarios y reacciones
    """
    # Verificar firma
    signature = request.headers.get("X-Hub-Signature-256", "")
    body = await request.body()

    if APP_SECRET and not verify_facebook_signature(body, signature):
        raise HTTPException(status_code=401, detail="Firma inválida")

    data = await request.json()

    if data.get("object") != "page":
        return {"status": "ignored"}

    for entry in data.get("entry", []):
        page_id = entry.get("id")

        # Procesar mensajes de Messenger
        for messaging in entry.get("messaging", []):
            await _handle_messaging_event(messaging, page_id)

        # Procesar eventos del feed (comentarios)
        for change in entry.get("changes", []):
            if change.get("field") == "feed":
                await _handle_feed_event(change.get("value", {}), page_id)

    # Meta requiere respuesta 200 inmediata
    return {"status": "ok"}


async def _handle_messaging_event(messaging: dict, page_id: str):
    """Maneja eventos de Messenger."""
    sender_id = messaging.get("sender", {}).get("id")
    recipient_id = messaging.get("recipient", {}).get("id")

    # Ignorar mensajes enviados por la página misma
    if sender_id == page_id:
        return

    # Mensaje de texto
    if "message" in messaging and not messaging.get("message", {}).get("is_echo"):
        message_obj = messaging["message"]
        text = message_obj.get("text", "")

        if text:
            print(f"📩 Mensaje de {sender_id}: {text[:50]}")
            try:
                result = await process_incoming_message(
                    sender_id=sender_id,
                    message_text=text,
                )
                print(f"✅ Respondido: intent={result.get('intent')}, stage={result.get('new_stage')}")
            except Exception as e:
                print(f"❌ Error procesando mensaje: {e}")

    # Postback (clicks en botones Quick Reply)
    elif "postback" in messaging:
        payload = messaging["postback"].get("payload", "")
        if payload:
            await process_incoming_message(
                sender_id=sender_id,
                message_text=payload,
            )


async def _handle_feed_event(value: dict, page_id: str):
    """Maneja comentarios en el feed de la página."""
    event_type = value.get("item")
    verb = value.get("verb")

    if event_type == "comment" and verb == "add":
        commenter_id = value.get("from", {}).get("id")
        comment_text = value.get("message", "")
        post_id = value.get("post_id", "")

        print(f"💬 Comentario de {commenter_id} en post {post_id}: {comment_text[:50]}")

        # Opcional: responder comentarios que muestren interés
        interest_keywords = ["cómo", "como", "precio", "información", "info", "quiero", "interesa"]
        if any(kw in comment_text.lower() for kw in interest_keywords):
            # Registrar como prospecto potencial
            from motor.motor_asyncio import AsyncIOMotorClient
            from datetime import datetime
            import os

            mongo_client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://mongo:27017"))
            db = mongo_client.social_automation

            await db.prospects.update_one(
                {"sender_id": commenter_id},
                {
                    "$setOnInsert": {
                        "sender_id": commenter_id,
                        "status": "nuevo",
                        "stage": "comentario",
                        "source": "facebook_comment",
                        "created_at": datetime.utcnow(),
                    },
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "last_comment": comment_text,
                    }
                },
                upsert=True
            )
            mongo_client.close()


# ─────────────────────────────────────────────────────────────
# GET: Panel de prospectos
# ─────────────────────────────────────────────────────────────

@router.get("/prospects")
async def get_prospects(
    status: str = None,
    limit: int = 50,
):
    """Retorna la lista de prospectos del embudo."""
    from motor.motor_asyncio import AsyncIOMotorClient
    import os

    mongo_client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://mongo:27017"))
    db = mongo_client.social_automation

    query = {}
    if status:
        query["status"] = status

    prospects = []
    async for p in db.prospects.find(query).sort("updated_at", -1).limit(limit):
        p["_id"] = str(p["_id"])
        # No exponer historial completo en listado
        p.pop("conversation", None)
        prospects.append(p)

    mongo_client.close()
    return {"total": len(prospects), "prospects": prospects}


@router.get("/prospects/stats")
async def get_prospects_stats():
    """Estadísticas del embudo de prospectos."""
    from motor.motor_asyncio import AsyncIOMotorClient
    import os

    mongo_client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://mongo:27017"))
    db = mongo_client.social_automation

    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]

    stats = {}
    async for item in db.prospects.aggregate(pipeline):
        stats[item["_id"]] = item["count"]

    total = await db.prospects.count_documents({})
    mongo_client.close()

    return {
        "total_prospects": total,
        "by_status": stats,
        "funnel": {
            "nuevos": stats.get("nuevo", 0),
            "interesados_productos": stats.get("interesado_productos", 0),
            "interesados_proyecto": stats.get("interesado_proyecto", 0),
            "listos_comprar": stats.get("listo_para_comprar", 0),
        }
    }
