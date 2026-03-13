"""
Bot de mensajes automáticos para Facebook Messenger.

Flujo:
1. Usuario manda mensaje → Respuesta inicial automática
2. Usuario responde "productos" o "proyecto" → Clasificación con IA
3. IA envía información relevante + registra prospecto en MongoDB
"""

import os
import httpx
from openai import AsyncOpenAI
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")

FACEBOOK_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
GRAPH_API = "https://graph.facebook.com/v18.0"

# ─────────────────────────────────────────────────────────────
# Mensajes del bot
# ─────────────────────────────────────────────────────────────

MENSAJE_BIENVENIDA = """Hola 👋 ¡Gracias por escribir!

Estoy compartiendo información sobre productos de bienestar y también sobre cómo funciona este proyecto.

Antes de contarte todo, dime algo:

👉 ¿Te interesa más conocer los *productos de bienestar* o aprender *cómo funciona el proyecto*?

Responde con una de estas opciones:
✅ *Productos*
✅ *Proyecto*"""

MENSAJE_PRODUCTOS = """¡Perfecto! 🌿

Trabajamos con suplementos naturales de alta calidad que ayudan a:

✅ Aumentar la energía de forma natural
✅ Mejorar el sistema inmune
✅ Dormir mejor
✅ Mantener un peso saludable
✅ Cuidar la piel desde adentro

Son productos que yo uso personalmente y que muchas personas en mi comunidad han incorporado a su rutina diaria.

¿Te gustaría que te cuente sobre algún producto específico? 💬

O si prefieres, puedo enviarte información completa sobre cómo empezar. 

*¿Cuál es tu principal objetivo de salud ahora mismo?*"""

MENSAJE_PROYECTO = """¡Qué bueno que preguntas! 🙌

Este proyecto consiste en recomendar productos de bienestar que muchas personas ya utilizan en su rutina diaria.

Hay personas que:
📦 Solo usan los productos para su propio bienestar
💼 También aprenden a compartirlos y construyen algo propio

No se trata de vender de puerta en puerta ni nada de eso. Es simplemente compartir algo que funciona con personas que lo necesitan.

Si quieres, puedo enviarte un video corto donde explican exactamente cómo funciona en menos de 5 minutos.

*¿Te gustaría verlo?* 👀"""

MENSAJE_VIDEO = """Aquí te mando el enlace con toda la información: 

🎥 *[VIDEO DE PRESENTACIÓN]*

Después de verlo, si tienes preguntas o quieres dar el siguiente paso, escríbeme aquí mismo y con gusto te ayudo 🤝

¡Espero que te guste lo que ves! 🌟"""

MENSAJE_DEFAULT = """¡Gracias por tu mensaje! 😊

Estoy revisando todo lo que me escriben. En un momento te respondo personalmente.

Mientras tanto, cuéntame:
👉 ¿Estás buscando productos para mejorar tu bienestar o conocer más sobre este proyecto?"""


# ─────────────────────────────────────────────────────────────
# Clasificación de intención con IA
# ─────────────────────────────────────────────────────────────

async def classify_intent(message: str) -> str:
    """
    Clasifica la intención del mensaje del usuario.
    
    Returns:
        'productos' | 'proyecto' | 'video' | 'compra' | 'unknown'
    """
    prompt = f"""Analiza este mensaje de un usuario en Facebook y clasifica su intención.

Mensaje: "{message}"

Categorías posibles:
- "productos": quiere saber sobre productos, suplementos, beneficios, precios
- "proyecto": quiere saber sobre el negocio, emprendimiento, cómo unirse, cómo funciona
- "video": quiere ver el video o más información del proyecto
- "compra": está listo para comprar o interesado en adquirir algo
- "unknown": no está claro o es otro tipo de mensaje

Responde SOLO con una de estas palabras: productos, proyecto, video, compra, unknown"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_tokens=20,
    )

    intent = response.choices[0].message.content.strip().lower()
    valid_intents = ["productos", "proyecto", "video", "compra", "unknown"]
    return intent if intent in valid_intents else "unknown"


async def get_smart_response(message: str, conversation_history: list) -> str:
    """
    Genera una respuesta inteligente personalizada usando el historial.
    Solo se usa cuando se necesita una respuesta más personalizada.
    """
    history_text = "\n".join([
        f"{'Usuario' if m['role'] == 'user' else 'Bot'}: {m['content']}"
        for m in conversation_history[-6:]  # últimos 6 mensajes
    ])

    prompt = f"""Eres el asistente de un emprendedor que vende productos de bienestar en Facebook.

Historial de conversación:
{history_text}

Nuevo mensaje del usuario: "{message}"

Responde de forma natural y amigable. Máximo 150 palabras.
NO hagas promesas de dinero.
Guía hacia conocer los productos o el proyecto.
Termina siempre con una pregunta para mantener la conversación."""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=200,
    )

    return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────────────────────
# Envío de mensajes por Facebook Messenger API
# ─────────────────────────────────────────────────────────────

async def send_facebook_message(recipient_id: str, message_text: str) -> bool:
    """Envía un mensaje de texto por Facebook Messenger."""
    if not FACEBOOK_TOKEN:
        print("⚠️  FACEBOOK_ACCESS_TOKEN no configurado")
        return False

    url = f"{GRAPH_API}/me/messages"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message_text},
        "messaging_type": "RESPONSE",
        "access_token": FACEBOOK_TOKEN,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as http:
            response = await http.post(url, json=payload)
            response.raise_for_status()
            return True
    except Exception as e:
        print(f"❌ Error enviando mensaje: {e}")
        return False


# ─────────────────────────────────────────────────────────────
# Procesador principal de mensajes entrantes
# ─────────────────────────────────────────────────────────────

async def process_incoming_message(
    sender_id: str,
    message_text: str,
    sender_name: str = ""
) -> dict:
    """
    Procesa un mensaje entrante de Facebook Messenger.
    
    1. Busca/crea el prospecto en MongoDB
    2. Clasifica la intención
    3. Envía respuesta apropiada
    4. Actualiza el estado del prospecto
    
    Returns:
        Dict con status y respuesta enviada
    """
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client.social_automation

    # Buscar o crear prospecto
    prospect = await db.prospects.find_one({"sender_id": sender_id})

    if not prospect:
        # Nuevo prospecto → enviar mensaje de bienvenida
        prospect = {
            "sender_id": sender_id,
            "name": sender_name,
            "status": "nuevo",           # nuevo → interesado_productos → interesado_proyecto → cliente → socio
            "stage": "bienvenida",
            "conversation": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "source": "facebook_messenger",
        }
        await db.prospects.insert_one(prospect)

        # Enviar bienvenida
        await send_facebook_message(sender_id, MENSAJE_BIENVENIDA)

        # Registrar mensaje
        await db.prospects.update_one(
            {"sender_id": sender_id},
            {
                "$push": {
                    "conversation": {
                        "role": "user",
                        "content": message_text,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$push": {
                    "conversation": {
                        "role": "bot",
                        "content": MENSAJE_BIENVENIDA,
                        "timestamp": datetime.utcnow()
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        return {
            "status": "new_prospect",
            "response_sent": MENSAJE_BIENVENIDA,
            "prospect_id": str(prospect.get("_id", ""))
        }

    # Prospecto existente → clasificar intención
    intent = await classify_intent(message_text)

    # Determinar respuesta según intención y etapa actual
    stage = prospect.get("stage", "bienvenida")
    response_text = ""
    new_stage = stage
    new_status = prospect.get("status", "nuevo")

    if intent == "productos":
        response_text = MENSAJE_PRODUCTOS
        new_stage = "info_productos"
        new_status = "interesado_productos"

    elif intent == "proyecto":
        response_text = MENSAJE_PROYECTO
        new_stage = "info_proyecto"
        new_status = "interesado_proyecto"

    elif intent == "video" or (stage == "info_proyecto" and intent == "unknown"):
        response_text = MENSAJE_VIDEO
        new_stage = "video_enviado"

    elif intent == "compra":
        new_status = "listo_para_comprar"
        response_text = await get_smart_response(message_text, prospect.get("conversation", []))

    else:
        # Respuesta inteligente para mensajes no clasificados
        if len(prospect.get("conversation", [])) > 2:
            response_text = await get_smart_response(
                message_text, 
                prospect.get("conversation", [])
            )
        else:
            response_text = MENSAJE_DEFAULT

    # Enviar respuesta
    if response_text:
        await send_facebook_message(sender_id, response_text)

    # Actualizar prospecto
    await db.prospects.update_one(
        {"sender_id": sender_id},
        {
            "$push": {
                "conversation": {
                    "role": "user",
                    "content": message_text,
                    "timestamp": datetime.utcnow()
                }
            },
            "$set": {
                "stage": new_stage,
                "status": new_status,
                "updated_at": datetime.utcnow(),
                "last_intent": intent,
            }
        }
    )

    mongo_client.close()

    return {
        "status": "processed",
        "intent": intent,
        "new_stage": new_stage,
        "response_sent": response_text[:100] + "..." if len(response_text) > 100 else response_text,
    }
