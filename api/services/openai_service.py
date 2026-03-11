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

Tu objetivo es crear posts virales, educativos y con alto engagement."""

    user_prompt = f"""Crea un post de Instagram/Facebook sobre: {topic}

Debe incluir:
1. Un hook inicial impactante
2. Contenido valioso y accionable
3. Datos o estadísticas si es relevante
4. Uso estratégico de emojis
5. NO uses más de 10 hashtags
6. Un CTA (Call To Action) claro

Formato de respuesta:
---
TEXT:
[El texto completo del post]

HASHTAGS:
[Lista de hashtags separados por coma, máximo 10]

CTA:
[Call to action específico]

IMAGE_PROMPT:
[Descripción detallada para generar imagen con DALL-E 3, en inglés, estilo profesional y moderno]
---"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
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
            
        if current_section == "text" and line_stripped:
            result["text"] += line_stripped + "\n"
        elif current_section == "hashtags" and line_stripped:
            # Parsear hashtags separados por coma
            hashtags = [h.strip() for h in line_stripped.split(",")]
            result["hashtags"].extend(hashtags)
        elif current_section == "cta" and line_stripped:
            result["cta"] += line_stripped + " "
        elif current_section == "image_prompt" and line_stripped:
            result["image_prompt"] += line_stripped + " "
    
    # Limpiar
    result["text"] = result["text"].strip()
    result["cta"] = result["cta"].strip()
    result["image_prompt"] = result["image_prompt"].strip()
    result["hashtags"] = [h for h in result["hashtags"] if h][:10]  # Max 10
    
    return result


async def generate_image_dalle(prompt: str, size: str = "1024x1024") -> Optional[str]:
    """
    Genera imagen usando DALL-E 3
    Retorna la URL de la imagen generada
    """
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            n=1,
        )
        
        image_url = response.data[0].url
        return image_url
        
    except Exception as e:
        print(f"Error generating image with DALL-E 3: {e}")
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
