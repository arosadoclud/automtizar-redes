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

# Modelos configurados (actualizables sin rebuild)
_CHAT_MODEL  = os.getenv("OPENAI_CHAT_MODEL",  "gpt-4.1")
_IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1")

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
IMAGEN_PROMPT: [Hyperrealistic lifestyle photograph, Canon EOS R5, 50mm f/1.8, natural light. A real Latin American woman in her 30s standing at a wooden kitchen counter preparing a green smoothie — fresh spinach, banana, and ginger beside a blender, a single supplement capsule in her open palm. She wears a casual linen shirt, hair loosely tied. Morning sunlight through a real kitchen window casts warm shadows across the counter. Chopping board with real cut fruit visible, a glass half-filled with green liquid. Genuine relaxed expression, no posing. Realistic skin, natural kitchen clutter in background (mugs, plants, dish rack). Documentary photography style, Kodak Portra 400, no white studio background, no product arrangement, no text.]
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
IMAGEN_PROMPT: [Hyperrealistic close-up photograph, Sony A7R V, 85mm f/2.0, natural morning light. A single supplement bottle (label slightly out of focus) standing on a real wooden kitchen counter next to a halved avocado, a small bowl of mixed nuts, fresh turmeric root, and a glass of water with lemon. The scene looks like someone just set it down before breakfast — lived-in, not arranged. Warm natural light from a window to the left creates soft shadows and highlights moisture on the glass. Background: blurred kitchen with real items (coffee maker, herbs in pot, cutting board). Photorealistic textures on wood grain, condensation on glass, real food imperfections. Editorial food photography style, no white isolated background, no symmetrical arrangement, no text.]
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
IMAGEN_PROMPT: [Hyperrealistic photograph, Canon EOS R5, 35mm f/1.4, golden hour light. A real Latin American woman, late 20s, sitting cross-legged on a light grey couch near a large window, holding a ceramic mug with both hands, eyes closed peacefully, faint smile. She wears an oversized white t-shirt. Morning sun creates a warm glow across her face and the cream-colored couch. On the small table beside her: a glass of water, a book, and a small amber supplement bottle (not the focus). Background: blurred living room with plants and soft natural textures. Real skin — slight under-eye shadow, natural hair messy from sleep. No posing, candid moment feel. Kodak Portra 400, no white studio background, no product arrangement, no text.]
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
IMAGEN_PROMPT: [Hyperrealistic lifestyle photograph, Canon EOS R5, 50mm f/1.8. A real Latin American woman, 35-40 years old, dark wavy hair naturally framing her face, warm medium-brown skin with visible laugh lines. She is laughing genuinely while blending a green smoothie in a home kitchen — green bits on the blender lid, a banana peel on the counter, a bowl of spinach beside her. She wears casual athleisure clothes. Late morning light from a kitchen window behind her creates a slight rim light. Background: real kitchen with fruits in a bowl, herbs, dishes drying. No perfect posing — caught mid-laugh. Natural skin texture, realistic kitchen environment. Fujifilm Eterna cinema color grade, no AI-plastic skin, no white background, no text.]
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
IMAGEN_PROMPT: [Hyperrealistic photograph, Sony A7R V, 35mm f/1.8. A real Latin American man, 28-34 years, sitting at a lived-in wooden home desk — laptop open with a real browser/spreadsheet visible (not blank), a ceramic coffee mug with a coffee ring stain on the desk, a small supplement bottle sitting casually beside a pen and notebook. He wears a plain grey t-shirt, light stubble, looking at the screen with a natural focused expression — not smiling for camera. Afternoon natural window light. Background: real bookshelf slightly blurred, a plant, a jacket on the chair. Hands visible on keyboard, realistic skin texture, natural hair. Documentary photography style, Kodak Portra 400 color grade, no staged posing, no white background, no text.]
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
IMAGEN_PROMPT: [Hyperrealistic action photograph, Canon EOS R5, 35mm f/2.0, bright natural indoor light. A real Latin American woman, 25-30 years, natural curly dark hair bouncing, warm tan skin, wearing colorful athletic clothes. She is mid-jump or mid-movement in a bright living room — a burst of energy, genuine laugh with eyes crinkled. One hand holds a reusable water bottle, a small supplement jar visible on the couch armrest in the background (not the focus). Midday sun through glass doors creates strong natural shadows on floor and wall. Background: blurred houseplants, white walls, real furniture. Natural skin imperfections, realistic curly hair detail, motion blur on hair. Editorial photography style, Fujifilm Provia color grade, no AI-art look, no white backdrop, no text.]
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
        model=_CHAT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "Eres un experto en marketing digital para negocios de bienestar en Latinoamérica. Generas contenido auténtico y efectivo para Facebook. IMPORTANTE: Nunca uses formato Markdown (sin asteriscos, sin guiones como viñetas, sin #encabezados). El texto debe estar listo para publicar en Facebook directamente, con saltos de línea naturales y emojis solamente."
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


import re as _re

def _clean_text(text: str) -> str:
    """Elimina formato Markdown y limpia el texto para publicación directa."""
    # Quitar negritas/cursivas: **texto**, *texto*, __texto__, _texto_
    text = _re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', text)
    text = _re.sub(r'_{1,2}([^_]+)_{1,2}', r'\1', text)
    # Quitar corchetes de markdown [texto](url) → texto
    text = _re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Normalizar múltiples líneas vacías a máximo 1 línea vacía
    text = _re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


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

    def _flush():
        if current_key and current_key != "hashtags":
            # Preservar saltos de párrafo, limpiar líneas vacías extras
            joined = "\n".join(current_value).strip()
            result[current_key] = joined

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("TEXTO:"):
            _flush()
            current_key = "text"
            current_value = [stripped[6:].strip()]
        elif stripped.startswith("HASHTAGS:"):
            _flush()
            val = stripped[9:].strip()
            result["hashtags"] = [h.strip() for h in val.replace(",", " ").split() if h.startswith("#")]
            current_key = None
            current_value = []
        elif stripped.startswith("CTA:"):
            _flush()
            current_key = "cta"
            current_value = [stripped[4:].strip()]
        elif stripped.startswith("IMAGEN_PROMPT:"):
            _flush()
            current_key = "image_prompt"
            current_value = [stripped[14:].strip()]
        elif stripped.startswith("GUION:"):
            _flush()
            current_key = "guion"
            current_value = [stripped[6:].strip()]
        else:
            if current_key:
                # Línea vacía → salto de párrafo
                current_value.append(stripped if stripped else "")

    _flush()

    # Limpiar markdown del texto
    result["text"] = _clean_text(result["text"])
    result["cta"] = _clean_text(result["cta"])

    # Si no se parseó bien, usar el texto completo
    if not result["text"]:
        result["text"] = _clean_text(raw[:500])

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
