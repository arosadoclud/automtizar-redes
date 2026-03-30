import os
from openai import OpenAI
from typing import Dict, List, Optional

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_post_content(
    topic: str,
    niches: List[str],
    workspace_name: str,
    tone: str = "professional_friendly"
) -> Dict[str, any]:
    """
    Genera contenido de post usando GPT-4o
    """
    
    # Crear el prompt contextual
    niches_text = ", ".join(niches)
    
    system_prompt = f"""Eres un experto en marketing de contenidos y copywriting para redes sociales.
Especializaciones del workspace: {niches_text}
Tono: {tone}
Marca: {workspace_name}

Tu objetivo es crear posts virales, educativos y con alto engagement.

REGLAS DE ORTOGRAFÍA Y FORMATO OBLIGATORIAS:
- Usa siempre los signos de apertura españoles: ¿ y ¡ (nunca omitirlos)
- Coloca tildes correctamente en todas las palabras que las requieren
- Separa cada párrafo o sección con una línea en blanco
- Los puntos de lista deben ir en líneas separadas
- Usa comas, puntos y signos correctamente según la RAE
- Nunca juntes dos párrafos distintos en una sola línea"""

    user_prompt = f"""Crea un post de Instagram/Facebook sobre: {topic}

Debe incluir:
1. Un hook inicial impactante (primera línea con emoji)
2. Una línea en blanco después del hook
3. Contenido valioso y accionable (2-3 párrafos separados por líneas en blanco)
4. Datos o estadísticas si es relevante
5. Uso estratégico de emojis (máximo 2 por párrafo)
6. Lista de puntos con guión, cada uno en su propia línea
7. NO uses más de 10 hashtags
8. Un CTA (Call To Action) claro al final

FORMATO DEL TEXTO:
- Cada párrafo separado por una línea en blanco
- Nunca dos párrafos en la misma línea
- Los signos ¿ y ¡ siempre presentes al inicio de preguntas/exclamaciones
- Tildes en todas las palabras que las requieren

Formato de respuesta:
---
TEXT:
[El texto completo del post]

HASHTAGS:
[Lista de hashtags separados por coma, máximo 10]

CTA:
[Call to action específico]

IMAGE_PROMPT:
[Write a short description in English of what the image should show related to '{topic}'. Focus on the main subject/activity only (e.g., 'person preparing healthy smoothie', 'woman taking supplements', 'man doing yoga'). The system will add professional photography details. Keep it under 20 words.]
---"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content
        
        # Parsear la respuesta
        parsed = parse_gpt_response(content)
        return parsed
        
    except Exception as e:
        print(f"Error calling GPT-4o: {e}")
        # Fallback a contenido simulado
        return {
            "text": f"Post sobre {topic}. [Error: {str(e)}]",
            "hashtags": ["#error"],
            "cta": "Error al generar contenido",
            "image_prompt": f"Professional image about {topic}"
        }


def parse_gpt_response(content: str) -> Dict[str, any]:
    """
    Parsea la respuesta estructurada de GPT-4
    """
    result = {
        "text": "",
        "hashtags": [],
        "cta": "",
        "image_prompt": ""
    }
    
    lines = content.split("\n")
    current_section = None
    
    for line in lines:
        line_stripped = line.strip()
        
        if line_stripped.startswith("TEXT:"):
            current_section = "text"
            continue
        elif line_stripped.startswith("HASHTAGS:"):
            current_section = "hashtags"
            continue
        elif line_stripped.startswith("CTA:"):
            current_section = "cta"
            continue
        elif line_stripped.startswith("IMAGE_PROMPT:"):
            current_section = "image_prompt"
            continue
        elif line_stripped == "---":
            continue
            
        if current_section == "text":
            if line_stripped:
                result["text"] += line_stripped + "\n"
            else:
                # Preservar líneas en blanco como separadores de párrafo
                result["text"] += "\n"
        elif current_section == "hashtags" and line_stripped:
            # Parsear hashtags separados por coma
            hashtags = [h.strip() for h in line_stripped.split(",")]
            result["hashtags"].extend(hashtags)
        elif current_section == "cta" and line_stripped:
            result["cta"] += line_stripped + " "
        elif current_section == "image_prompt" and line_stripped:
            result["image_prompt"] += line_stripped + " "
    
    import re
    def _strip_md(t):
        t = re.sub(r'\*{1,2}([^*]+)\*{1,2}', r'\1', t)
        t = re.sub(r'_{1,2}([^_]+)_{1,2}', r'\1', t)
        return re.sub(r'\n{3,}', '\n\n', t).strip()

    result["text"] = _strip_md(result["text"]).strip()
    result["cta"] = _strip_md(result["cta"]).strip()
    result["image_prompt"] = result["image_prompt"].strip()
    result["hashtags"] = [h for h in result["hashtags"] if h][:10]  # Max 10
    
    return result


def create_dynamic_image_prompt(topic: str, content_text: str = "") -> str:
    """
    Crea un prompt de imagen hiperrealista ÚNICO y variado basado en el tema específico.
    Evita repetición usando diferentes escenarios, ángulos, momentos y actividades.
    """
    import random
    
    # VARIACIONES DE PERSONAS
    _ages = ["early 20s", "mid 20s", "late 20s", "early 30s", "mid 30s", "late 30s", "early 40s", "mid 40s"]
    _ethnicities = ["Dominican", "Colombian", "Mexican", "Venezuelan", "Cuban", "Puerto Rican", "Peruvian", "Ecuadorian"]
    _hair = [
        "short natural curls", "long straight dark hair", "medium wavy chestnut hair",
        "tight afro curls", "shoulder-length box braids", "pixie cut", "long loose curls", 
        "straight bob haircut", "high bun with loose strands", "messy low ponytail", 
        "half-up half-down style", "short tousled hair"
    ]
    _build = ["slim", "athletic", "average", "curvy", "petite", "muscular"]
    _gender = random.choice(["woman", "man", "woman", "woman"])  # 75% mujeres
    
    # VARIACIONES DE CÁMARAS (hiperrealistas profesionales)
    _cameras = [
        "Canon EOS R5, 50mm f/1.8",
        "Sony A7R V, 85mm f/2.0",
        "Nikon Z9, 35mm f/1.4",
        "Fujifilm X-T5, 56mm f/1.2",
        "Canon EOS 5D Mark IV, 24-70mm f/2.8 at 50mm",
        "Leica Q2, 28mm f/1.7"
    ]
    
    # VARIACIONES DE LUZ Y MOMENTO DEL DÍA
    _lighting = [
        "early morning golden light through large window",
        "soft diffused afternoon light, slightly overcast",
        "warm sunset glow from window behind",
        "bright midday natural light from glass door",
        "gentle morning sunbeam across face and scene",
        "late afternoon warm amber light",
        "cool morning blue hour light",
        "dappled sunlight through plants near window"
    ]
    
    # VARIACIONES DE LOCACIÓN
    _locations = [
        "modern minimalist kitchen with marble counters",
        "cozy wooden home kitchen with plants",
        "bright living room with white walls and natural textures",
        "home office with wooden desk and bookshelf",
        "sunlit bedroom corner near window",
        "open-plan living space with plants and warm tones",
        "rustic kitchen with colorful tiles",
        "contemporary apartment with large windows"
    ]
    
    # VARIACIONES DE ACTIVIDADES/ESCENAS SEGÚN TEMA
    topic_lower = topic.lower()
    
    # Detectar categoría del tema
    if any(word in topic_lower for word in ["colágeno", "piel", "belleza", "juventud", "rostro", "arrugas"]):
        _activities = [
            "applying facial serum near a bathroom mirror with natural light",
            "holding a collagen supplement bottle while looking satisfied in front of a mirror",
            "touching her glowing cheek with fingertips, collagen bottle on vanity",
            "examining skin in mirror with supplement bottle visible on counter",
            "applying moisturizer from a jar, collagen capsules beside sink"
        ]
    elif any(word in topic_lower for word in ["energía", "energy", "vitamina", "magnesio", "zinc", "hierro"]):
        _activities = [
            "stretching arms overhead energetically in living room, supplement bottle on coffee table",
            "tying running shoes with supplement bottle beside yoga mat",
            "preparing energizing smoothie with greens, banana, supplement visible",
            "standing at kitchen counter organizing morning vitamins with water glass",
            "doing light stretches near window, supplement bottles on windowsill"
        ]
    elif any(word in topic_lower for word in ["sueño", "sleep", "melatonina", "descanso", "dormir"]):
        _activities = [
            "sitting on bed edge in pajamas holding supplement bottle, nightstand lamp on",
            "reading a book in bed with tea and supplement on nightstand",
            "relaxed on couch with eyes closed, holding mug, supplements nearby",
            "preparing evening tea in kitchen, melatonin bottle on counter",
            "doing gentle bedtime yoga stretches, supplements visible in background"
        ]
    elif any(word in topic_lower for word in ["omega", "corazón", "cardiovascular", "circulación"]):
        _activities = [
            "preparing salmon with avocado and nuts, omega supplement nearby",
            "pouring omega capsules from bottle into hand at breakfast table",
            "meal prep scene with fish, nuts, olive oil, supplement bottle visible",
            "eating healthy lunch bowl with supplement bottle on table",
            "standing at stove cooking healthy meal, supplements on counter"
        ]
    elif any(word in topic_lower for word in ["ejercicio", "fitness", "músculo", "proteína", "deporte"]):
        _activities = [
            "wiping sweat with towel after workout, protein shaker and supplements visible",
            "preparing post-workout protein shake in kitchen, athletic clothes",
            "doing bodyweight exercises at home, supplement bottles on floor nearby",
            "measuring protein powder into shaker, gym bag in background",
            "stretching on yoga mat with resistance bands, supplements visible"
        ]
    elif any(word in topic_lower for word in ["peso", "adelgazar", "quemar", "dieta", "metabolismo"]):
        _activities = [
            "preparing healthy meal with vegetables and lean protein, supplement nearby",
            "measuring portions in kitchen with food scale, supplements visible",
            "eating colorful salad bowl with supplement bottle on table",
            "preparing green juice with fresh vegetables, supplement in frame",
            "organizing meal prep containers, supplements lined up on counter"
        ]
    elif any(word in topic_lower for word in ["estrés", "ansiedad", "relax", "calma", "ashwagandha"]):
        _activities = [
            "meditating cross-legged on couch with eyes closed, supplement on side table",
            "journaling at desk with tea and supplement bottle",
            "doing deep breathing exercise near window, supplement visible",
            "sitting peacefully with herbal tea, ashwagandha bottle on table",
            "gentle yoga pose on mat at home, supplement bottles nearby"
        ]
    elif any(word in topic_lower for word in ["digestión", "probiótico", "intestino", "estómago"]):
        _activities = [
            "preparing yogurt bowl with fruits and nuts, probiotic supplement nearby",
            "drinking kombucha or kefir with probiotic capsules on counter",
            "eating fiber-rich meal with vegetables, supplement bottle visible",
            "preparing fermented foods in kitchen, probiotics on counter",
            "drinking green juice, digestive supplement bottle in frame"
        ]
    elif any(word in topic_lower for word in ["inmune", "defensas", "vitamina c", "resfriado"]):
        _activities = [
            "squeezing fresh oranges for juice, vitamin C supplement nearby",
            "preparing immune-boosting smoothie with citrus and ginger",
            "taking vitamin supplement with glass of water, fruits in background",
            "cutting fresh vegetables for salad, immune supplements visible",
            "drinking hot tea with lemon, vitamin bottles on table"
        ]
    else:
        # Actividades generales de bienestar
        _activities = [
            "preparing healthy smoothie with fresh ingredients, supplement bottle visible",
            "sitting at breakfast table with healthy meal and supplements",
            "organizing daily vitamins on kitchen counter with water glass",
            "reading wellness book with tea, supplement bottle nearby",
            "preparing nutritious lunch, supplement visible on counter",
            "hydrating with infused water, supplement bottle in scene",
            "meal prepping healthy foods, supplements lined up",
            "enjoying morning coffee ritual, vitamins on table"
        ]
    
    # VARIACIONES DE ESTILO FOTOGRÁFICO
    _styles = [
        "Documentary lifestyle photography, Kodak Portra 400 color grade",
        "Editorial wellness photography, Fujifilm Eterna cinema color",
        "Natural lifestyle photography, Kodak Gold 200 warm tones",
        "Authentic documentary style, Fujifilm Provia vibrant colors",
        "Candid lifestyle photography, Kodak Ektar 100 vivid naturals",
        "Real moment photography, Cinestill 800T color science"
    ]
    
    # CONSTRUIR PROMPT ÚNICO
    person = f"{random.choice(_ethnicities)} {_gender}, {random.choice(_ages)}, {random.choice(_build)} build, {random.choice(_hair)}"
    camera = random.choice(_cameras)
    lighting = random.choice(_lighting)
    location = random.choice(_locations)
    activity = random.choice(_activities)
    style = random.choice(_styles)
    
    prompt = f"""HYPERREALISTIC PHOTOGRAPH — {camera}. 
{person}. Real skin texture with visible pores, natural imperfections, genuine expression. 
SCENE: {activity} in a {location}. {lighting}. 
ENVIRONMENT: Real lived-in space with natural clutter — dishes, plants, books, everyday items visible in background. 
Authentic moment, NOT posed for camera. Realistic depth of field, natural bokeh. 
{style}. 
CRITICAL: NO white studio background, NO symmetrical product arrangement, NO AI-generated plastic skin, 
NO perfect lighting setup, NO text overlays. Must look like a real candid photograph taken in someone's home."""
    
    return prompt.strip()


async def generate_image_dalle(prompt: str, size: str = "1024x1024", topic: str = "", content_text: str = "") -> Optional[str]:
    """
    Genera imagen usando gpt-image-1 (máxima calidad, hiperrealista).
    Si prompt es genérico, genera uno dinámico basado en el tema.
    """
    import hashlib, time, base64, os, uuid, random
    from pathlib import Path
    
    # Si el prompt es muy corto o genérico, crear uno dinámico
    if len(prompt) < 100 or "professional image" in prompt.lower():
        prompt = create_dynamic_image_prompt(topic, content_text)
        print(f"✨ Prompt dinámico generado: {prompt[:100]}...")
    
    # Añadir semilla única para evitar caché
    unique_seed = hashlib.sha1(f"{prompt}{time.time()}".encode()).hexdigest()[:8]
    unique_prompt = f"{prompt.strip()} [uid:{unique_seed}]"

    # ── intento 1: gpt-image-1 (mejor calidad, sin style param) ──────────
    try:
        response = client.images.generate(
            model="gpt-image-1",
            prompt=unique_prompt,
            size=size,
            quality="high",
            n=1,
        )
        # gpt-image-1 responde en base64
        b64_data = response.data[0].b64_json
        if b64_data:
            img_bytes = base64.b64decode(b64_data)
            save_dir = Path("/app/generated_images")
            save_dir.mkdir(parents=True, exist_ok=True)
            filename = f"gptimg1_{uuid.uuid4().hex[:12]}.png"
            filepath = save_dir / filename
            filepath.write_bytes(img_bytes)
            print(f"✅ gpt-image-1: imagen guardada en {filepath}")
            return str(filepath)   # content.py descargará/usará este path

        # si por algún motivo devuelve URL
        url = response.data[0].url
        if url:
            return url

    except Exception as e:
        print(f"⚠️ gpt-image-1 no disponible ({e}), usando dall-e-3 como fallback")

    # ── fallback: dall-e-3 ────────────────────────────────────────────────
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=unique_prompt,
            size=size,
            quality="hd",
            style="vivid",
            n=1,
        )
        print("✅ dall-e-3 fallback OK")
        return response.data[0].url

    except Exception as e:
        print(f"Error generating image: {e}")
        return None


async def download_image(url: str, save_path: str) -> bool:
    """
    Descarga una imagen desde URL y la guarda localmente
    """
    import httpx
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            
            with open(save_path, "wb") as f:
                f.write(response.content)
            
            return True
    except Exception as e:
        print(f"Error downloading image: {e}")
        return False
