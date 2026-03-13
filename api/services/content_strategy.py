"""
Estrategia de contenido para alto volumen:
50 publicaciones por semana / 7 por día

Tipos de contenido:
1. educativo      → 10/semana (bienestar, salud, hábitos)
2. producto       → 10/semana (beneficios, suplementos)
3. micro_post     → 10/semana (frases cortas, inspiración)
4. testimonio     → 5/semana  (casos de éxito, experiencias)
5. reclutamiento  → 5/semana  (curiosidad sobre emprendimiento)
6. reel           → 10/semana (ideas de video)
"""

from openai import AsyncOpenAI
import os

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ─────────────────────────────────────────────────────────────
# Distribución diaria: 7 posts de lunes a domingo
# ─────────────────────────────────────────────────────────────
DAILY_CONTENT_MIX = [
    "educativo",
    "producto",
    "micro_post",
    "educativo",
    "producto",
    "testimonio",
    "reclutamiento",
]

# Horarios de publicación (7 por día)
DAILY_SCHEDULE_HOURS = [8, 10, 12, 14, 16, 18, 21]

# ─────────────────────────────────────────────────────────────
# Prompts por tipo de contenido
# ─────────────────────────────────────────────────────────────
CONTENT_PROMPTS = {
    "educativo": """
Actúa como experto en marketing de bienestar para una marca latinoamericana.

Genera UNA publicación educativa para Facebook sobre el siguiente tema: {topic}

Reglas estrictas:
- Máximo 80 palabras
- Tono natural, como si lo escribiera una persona real
- Incluye un dato curioso o beneficio
- Termina con una pregunta que invite a comentar
- Usa 1 o 2 emojis relevantes
- NO uses frases genéricas como "en el mundo acelerado de hoy"
- Escribe en español dominicano/latinoamericano natural

Formato de respuesta:
TEXTO: [el post]
HASHTAGS: [5-8 hashtags relevantes]
CTA: [llamado a la acción corto]
IMAGEN_PROMPT: [descripción en inglés para generar imagen con DALL-E]
""",

    "producto": """
Actúa como experto en marketing de productos naturales y bienestar.

Genera UNA publicación de producto para Facebook sobre: {topic}

Reglas estrictas:
- Máximo 80 palabras
- Destaca beneficios (no características técnicas)
- Tono natural y conversacional
- Termina con invitación a enviar mensaje directo
- Usa 2-3 emojis
- NO hagas promesas exageradas
- NO menciones precios
- Escribe en español natural

Formato de respuesta:
TEXTO: [el post]
HASHTAGS: [5-8 hashtags relevantes]
CTA: [llamado a la acción corto]
IMAGEN_PROMPT: [descripción en inglés para imagen con DALL-E, estilo producto bienestar]
""",

    "micro_post": """
Genera UNA frase corta inspiracional para Facebook relacionada con: {topic}

Reglas estrictas:
- Máximo 20 palabras
- Tono motivador e inspirador
- Relacionada con salud, bienestar o estilo de vida saludable
- Puede ser una cita adaptada o frase original
- 1 emoji al inicio o final

Formato de respuesta:
TEXTO: [la frase]
HASHTAGS: [3-5 hashtags]
CTA: [opcional, muy corto]
IMAGEN_PROMPT: [descripción en inglés para imagen inspiracional minimalista]
""",

    "testimonio": """
Actúa como copywriter especializado en testimonios para redes sociales.

Genera UN testimonio ficcionado (pero realista) para Facebook sobre: {topic}

Reglas estrictas:
- Máximo 100 palabras
- Escrito en primera persona como si fuera un cliente real
- Menciona un beneficio específico (más energía, mejor sueño, etc.)
- Tono auténtico, no exagerado
- Termina con invitación a preguntar
- Usa 1-2 emojis

IMPORTANTE: Aclarar al final del post: "Cada persona es diferente 🌿"

Formato de respuesta:
TEXTO: [el testimonio]
HASHTAGS: [5-7 hashtags]
CTA: [llamado a la acción]
IMAGEN_PROMPT: [descripción en inglés para imagen de persona satisfecha y saludable]
""",

    "reclutamiento": """
Actúa como estratega de marketing de emprendimiento en redes sociales.

Genera UNA publicación que despierte curiosidad sobre emprendimiento relacionado con: {topic}

Reglas estrictas:
- Máximo 80 palabras
- NUNCA mencionar dinero, ingresos o ganancias específicas
- Tono de curiosidad suave, no agresivo
- Hablar de estilo de vida, libertad, propósito
- Invitar a preguntar "¿cómo funciona?"
- 2-3 emojis

Formato de respuesta:
TEXTO: [el post]
HASHTAGS: [5-7 hashtags sobre emprendimiento y bienestar]
CTA: [invitación suave a preguntar]
IMAGEN_PROMPT: [descripción en inglés para imagen de emprendedor joven exitoso]
""",

    "reel": """
Actúa como creador de contenido viral de bienestar para Instagram Reels y Facebook.

Genera UN guion corto para reel/video sobre: {topic}

Reglas estrictas:
- Duración sugerida: 30-60 segundos
- Estructura: Hook (3 seg) → Contenido (25 seg) → CTA (5 seg)
- Tono dinámico y energético
- Incluye indicaciones visuales [entre corchetes]
- Máximo 150 palabras en total

Formato de respuesta:
TEXTO: [descripción del reel para publicar como caption]
GUION: [texto completo del guion con indicaciones visuales]
HASHTAGS: [8-10 hashtags virales]
CTA: [llamado a la acción]
IMAGEN_PROMPT: [descripción en inglés para thumbnail/cover del reel]
""",
}

# Temas por tipo de contenido (rotación automática)
CONTENT_TOPICS = {
    "educativo": [
        "beneficios del magnesio para el sueño",
        "cómo mejorar la energía naturalmente",
        "hábitos matutinos para aumentar productividad",
        "importancia de la vitamina D",
        "alimentos que reducen la inflamación",
        "beneficios del colágeno para la piel",
        "cómo mejorar el sistema inmune",
        "omega 3 y salud cardiovascular",
        "bienestar mental y físico",
        "hidratación y rendimiento diario",
        "zinc y sistema inmunológico",
        "antioxidantes naturales",
        "ashwagandha para el estrés",
        "espirulina y nutrición celular",
        "melatonina y calidad del sueño",
    ],
    "producto": [
        "suplementos de origen vegetal",
        "proteínas naturales para el deporte",
        "probióticos y salud digestiva",
        "multivitamínico diario",
        "colágeno hidrolizado",
        "quemadores de grasa naturales",
        "energizantes sin cafeína",
        "control de peso saludable",
        "suplementos para articulaciones",
        "omegas y cerebro",
    ],
    "micro_post": [
        "salud", "bienestar", "energía",
        "motivación", "hábitos saludables",
        "emprendimiento", "vida sana",
        "superación personal", "éxito", "wellness",
    ],
    "testimonio": [
        "más energía durante el día",
        "mejorar el sueño",
        "pérdida de peso saludable",
        "mejor rendimiento deportivo",
        "salud digestiva mejorada",
    ],
    "reclutamiento": [
        "emprendimiento desde casa",
        "negocios de bienestar",
        "ingresos adicionales",
        "libertad de tiempo",
        "compartir lo que usas",
    ],
    "reel": [
        "rutina matutina saludable",
        "3 hábitos que cambiaron mi vida",
        "antes y después bienestar",
        "cómo empezar a vivir saludable",
        "mis suplementos diarios",
        "día en mi vida saludable",
        "tips de bienestar en 30 segundos",
        "mitos sobre suplementos",
        "receta saludable rápida",
        "ejercicio en casa 10 minutos",
    ],
}


async def generate_content_by_type(
    content_type: str,
    topic: str = None,
    workspace_name: str = ""
) -> dict:
    """
    Genera contenido según el tipo especificado.
    
    Args:
        content_type: Tipo de contenido (educativo, producto, micro_post, etc.)
        topic: Tema específico (si None, se elige automáticamente)
        workspace_name: Nombre del workspace para personalización
    
    Returns:
        Dict con text, hashtags, cta, image_prompt, content_type
    """
    import random

    if content_type not in CONTENT_PROMPTS:
        content_type = "educativo"

    # Seleccionar tema automáticamente si no se proporciona
    if not topic:
        available_topics = CONTENT_TOPICS.get(content_type, ["bienestar general"])
        topic = random.choice(available_topics)

    prompt = CONTENT_PROMPTS[content_type].format(
        topic=topic,
        workspace_name=workspace_name
    )

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "Eres un experto en marketing digital para negocios de bienestar en Latinoamérica. Generas contenido auténtico y efectivo para Facebook."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.85,
        max_tokens=600,
    )

    raw = response.choices[0].message.content
    parsed = _parse_response(raw, content_type)
    parsed["content_type"] = content_type
    parsed["topic"] = topic

    return parsed


def _parse_response(raw: str, content_type: str) -> dict:
    """Parsea la respuesta de GPT en campos estructurados."""
    result = {
        "text": "",
        "hashtags": [],
        "cta": "",
        "image_prompt": "",
        "guion": "",
    }

    lines = raw.strip().split("\n")
    current_key = None
    current_value = []

    for line in lines:
        line = line.strip()
        if not line:
            if current_key and current_value:
                current_value.append("")
            continue

        if line.startswith("TEXTO:"):
            if current_key:
                result[current_key] = " ".join(current_value).strip()
            current_key = "text"
            current_value = [line[6:].strip()]
        elif line.startswith("HASHTAGS:"):
            if current_key:
                result[current_key] = " ".join(current_value).strip()
            current_key = "hashtags"
            val = line[9:].strip()
            result["hashtags"] = [h.strip() for h in val.replace(",", " ").split() if h.startswith("#")]
            current_key = None
            current_value = []
        elif line.startswith("CTA:"):
            if current_key:
                result[current_key] = " ".join(current_value).strip()
            current_key = "cta"
            current_value = [line[4:].strip()]
        elif line.startswith("IMAGEN_PROMPT:"):
            if current_key:
                result[current_key] = " ".join(current_value).strip()
            current_key = "image_prompt"
            current_value = [line[14:].strip()]
        elif line.startswith("GUION:"):
            if current_key:
                result[current_key] = " ".join(current_value).strip()
            current_key = "guion"
            current_value = [line[6:].strip()]
        else:
            if current_key:
                current_value.append(line)

    if current_key and current_value:
        result[current_key] = " ".join(current_value).strip()

    # Si no se parseó bien, usar el texto completo
    if not result["text"]:
        result["text"] = raw[:300]

    return result


def get_daily_content_plan() -> list:
    """
    Retorna el plan de contenido para el día.
    7 posts con tipos variados.
    """
    import random

    plan = []
    mix = DAILY_CONTENT_MIX.copy()
    random.shuffle(mix[:4])  # Barajar primeros 4 para variedad

    for i, content_type in enumerate(mix):
        topics = CONTENT_TOPICS.get(content_type, ["bienestar"])
        topic = random.choice(topics)
        plan.append({
            "content_type": content_type,
            "topic": topic,
            "scheduled_hour": DAILY_SCHEDULE_HOURS[i],
        })

    return plan
