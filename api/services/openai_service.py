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
[Write a gpt-image-1 prompt in English for a HYPERREALISTIC photograph indistinguishable from a real photo. STRICT RULES: (1) NO flat-lay on white/marble backgrounds. (2) NO perfectly arranged products. (3) Show the topic '{topic}' through a REAL LIFESTYLE MOMENT: a person actually eating healthy food, preparing a smoothie, exercising, or a supplement bottle casually placed in a real kitchen or living room environment. (4) Specify camera: 'Canon EOS R5, 50mm f/1.8'. (5) Describe real imperfect environment: real kitchen clutter, natural morning light from a window, lived-in home. (6) If a person appears: Latin American, specific age, real skin texture with pores, natural hair, genuine expression — not posing. (7) End with: 'Documentary photography style, Kodak Portra 400 color grade, no white studio background, no product arrangement, no AI-art look, no text in image'.]
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


async def generate_image_dalle(prompt: str, size: str = "1024x1024") -> Optional[str]:
    """
    Genera imagen usando gpt-image-1 (máxima calidad, hiperrealista).
    Devuelve base64 → lo guardamos como archivo local y retornamos la URL servida.
    Fallback automático a dall-e-3 si gpt-image-1 no está disponible.
    """
    import hashlib, time, base64, os, uuid, random
    from pathlib import Path

    # ── variación de persona para evitar repetición entre imágenes ────────
    _ages = [
        "early 20s", "mid 20s", "late 20s",
        "early 30s", "mid 30s", "late 30s",
        "early 40s", "mid 40s",
    ]
    _ethnicities = [
        "Dominican", "Colombian", "Mexican", "Venezuelan",
        "Cuban", "Puerto Rican", "Peruvian", "Ecuadorian",
    ]
    _hair = [
        "short natural curls", "long straight dark hair", "medium wavy chestnut hair",
        "tight afro curls", "shoulder-length box braids", "pixie cut",
        "long loose curls", "straight bob haircut", "high bun with loose strands",
    ]
    _build = ["slim", "athletic", "average", "curvy", "petite"]
    _gender = random.choices(["woman", "man"], weights=[70, 30])[0]

    person_variation = (
        f"IMPORTANT — use a completely UNIQUE person: {random.choice(_ethnicities)} {_gender}, "
        f"{random.choice(_ages)}, {random.choice(_build)} build, {random.choice(_hair)}. "
        f"Different from any previously generated image. "
    )

    unique_seed = hashlib.sha1(f"{prompt}{time.time()}".encode()).hexdigest()[:8]
    unique_prompt = f"{person_variation}{prompt.strip()} [uid:{unique_seed}]"

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
