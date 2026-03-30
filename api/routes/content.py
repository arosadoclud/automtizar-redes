from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from api.services.openai_service import generate_post_content, generate_image_dalle, download_image
from api.services.meta_publisher import meta_publisher
from api.services.video_service import video_service

router = APIRouter()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.social_automation

class PostResponse(BaseModel):
    id: str
    workspace_id: str
    topic: str
    content: Dict[str, Any]
    status: str
    created_at: str

@router.post("/{workspace_id}/generate")
async def generate_post(workspace_id: str, topic: str = Query(..., description="Tema del post")):
    """Generar un nuevo post usando GPT-4"""
    # Verificar que el workspace existe
    try:
        workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid workspace ID")
    
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # ✨ Generar contenido con GPT-4o
    try:
        post_content = await generate_post_content(
            topic=topic,
            niches=workspace.get("niches", []),
            workspace_name=workspace.get("name", ""),
            tone="professional_friendly"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating content: {str(e)}")
    
    # 🎨 Generar imagen con DALL-E 3 (si está habilitado)
    image_url = None
    image_local_path = None
    
    use_dalle = os.getenv("USE_DALLE", "true").lower() == "true"
    if use_dalle and post_content.get("image_prompt"):
        try:
            result_path = await generate_image_dalle(
                prompt=post_content["image_prompt"],
                topic=topic,
                content_text=post_content.get("text", "")
            )

            if result_path:
                if result_path.startswith("/") or result_path.startswith("generated_images"):
                    # gpt-image-1: ya está guardado en disco como archivo local
                    image_local_path = result_path
                    image_url = None
                    post_content["image_local_path"] = image_local_path
                    post_content["image_url"] = None
                    post_content["image_tier_used"] = "gpt-image-1"
                else:
                    # dall-e-3 fallback: devuelve URL, descargamos
                    image_url = result_path
                    os.makedirs("generated_images", exist_ok=True)
                    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                    image_filename = f"post_{timestamp}.png"
                    image_local_path = f"generated_images/{image_filename}"
                    await download_image(image_url, image_local_path)
                    post_content["image_url"] = image_url
                    post_content["image_local_path"] = image_local_path
                    post_content["image_tier_used"] = "dalle"
        except Exception as e:
            print(f"Warning: Could not generate image: {e}")
    
    # Guardar en la base de datos
    post_doc = {
        "workspace_id": workspace_id,
        "topic": topic,
        "content": post_content,
        "status": "pending_review",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    result = await db.posts.insert_one(post_doc)
    post_doc["id"] = str(result.inserted_id)
    post_doc.pop("_id", None)
    
    return post_doc

@router.get("/{workspace_id}/queue", response_model=List[PostResponse])
async def get_post_queue(workspace_id: str):
    """Obtener la cola de posts pendientes"""
    posts = []
    async for post in db.posts.find({"workspace_id": workspace_id}).sort("created_at", -1):
        post["id"] = str(post.pop("_id"))
        posts.append(post)
    return posts

class ManualPostCreate(BaseModel):
    topic: Optional[str] = "Post manual"
    text: str
    cta: Optional[str] = ""
    hashtags: Optional[List[str]] = []
    platforms: Optional[List[str]] = ["facebook", "instagram"]
    scheduled_at: Optional[str] = None

@router.post("/{workspace_id}/posts/manual")
async def create_manual_post(workspace_id: str, data: ManualPostCreate):
    """Crear un post manualmente sin usar IA"""
    try:
        workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid workspace ID")
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    post_doc = {
        "workspace_id": workspace_id,
        "topic": data.topic or "Post manual",
        "content": {
            "text": data.text,
            "hashtags": data.hashtags,
            "cta": data.cta,
            "image_url": None,
            "image_local_path": None,
            "image_tier_used": "manual",
        },
        "status": "pending_review",
        "platforms": data.platforms,
        "scheduled_at": data.scheduled_at,
        "source": "manual",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    result = await db.posts.insert_one(post_doc)
    post_doc["id"] = str(result.inserted_id)
    post_doc.pop("_id", None)
    return post_doc

@router.post("/{workspace_id}/posts/{post_id}/approve")
async def approve_post(workspace_id: str, post_id: str, publish_now: bool = Query(False, description="Publicar inmediatamente")):
    """Aprobar un post y opcionalmente publicarlo"""
    try:
        result = await db.posts.update_one(
            {"_id": ObjectId(post_id), "workspace_id": workspace_id},
            {"$set": {"status": "approved", "approved_at": datetime.utcnow().isoformat()}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Guardar mock post
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    mock_dir = "mock_posts"
    os.makedirs(mock_dir, exist_ok=True)
    
    # Guardar JSON
    mock_file = f"{mock_dir}/post_{post_id}.json"
    with open(mock_file, "w", encoding="utf-8") as f:
        json.dump(post["content"], f, indent=2, ensure_ascii=False)
    
    # Guardar HTML preview
    html_file = f"{mock_dir}/post_{post_id}.html"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Post Preview - {post['topic']}</title>
        <style>
            body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }}
            .post {{ border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: white; }}
            .topic {{ color: #666; font-size: 14px; margin-bottom: 10px; }}
            .content {{ font-size: 16px; line-height: 1.6; margin: 20px 0; }}
            .hashtags {{ color: #1DA1F2; margin: 15px 0; }}
            .cta {{ background: #1DA1F2; color: white; padding: 12px 24px; border-radius: 20px; 
                    display: inline-block; margin-top: 15px; text-decoration: none; }}
            .image-prompt {{ background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="post">
            <div class="topic"><strong>Tema:</strong> {post['topic']}</div>
            <div class="content">{post['content']['text']}</div>
            <div class="hashtags">{' '.join(post['content']['hashtags'])}</div>
            <div class="image-prompt">
                <strong>🎨 Prompt de imagen:</strong><br>
                {post['content']['image_prompt']}
            </div>
            <a href="#" class="cta">{post['content']['cta']}</a>
        </div>
    </body>
    </html>
    """
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    response_data = {
        "status": "approved", 
        "mock_files": {"json": mock_file, "html": html_file}
    }
    
    # 📱 Publicar en redes sociales si se solicita
    if publish_now:
        try:
            text = post["content"]["text"]
            hashtags = post["content"].get("hashtags", [])
            image_path = post["content"].get("image_local_path")
            
            image_url = post["content"].get("image_url")

            # Publicar en Facebook e Instagram
            publish_result = await meta_publisher.publish_to_both(
                text=text,
                image_url=image_url,
                image_path=image_path,
                hashtags=hashtags
            )
            
            # Actualizar post con resultados de publicación
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {
                    "$set": {
                        "published": True,
                        "published_at": datetime.utcnow().isoformat(),
                        "publish_results": publish_result
                    }
                }
            )
            
            response_data["published"] = True
            response_data["publish_results"] = publish_result
            
        except Exception as e:
            response_data["publish_error"] = str(e)
            response_data["published"] = False
    
    return response_data

@router.post("/{workspace_id}/posts/{post_id}/reject")
async def reject_post(workspace_id: str, post_id: str):
    """Rechazar un post"""
    try:
        result = await db.posts.update_one(
            {"_id": ObjectId(post_id), "workspace_id": workspace_id},
            {"$set": {"status": "rejected", "rejected_at": datetime.utcnow().isoformat()}}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"status": "rejected"}


class UpdatePostBody(BaseModel):
    topic: Optional[str] = None
    text: Optional[str] = None
    hashtags: Optional[List[str]] = None
    cta: Optional[str] = None


@router.put("/{workspace_id}/posts/{post_id}")
async def update_post(workspace_id: str, post_id: str, body: UpdatePostBody):
    """Editar el contenido de un post existente"""
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id), "workspace_id": workspace_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    set_fields: Dict[str, Any] = {"updated_at": datetime.utcnow().isoformat()}

    if body.topic is not None:
        set_fields["topic"] = body.topic

    # Merge inside the content sub-document
    content_updates: Dict[str, Any] = {}
    if body.text is not None:
        content_updates["content.text"] = body.text
    if body.hashtags is not None:
        content_updates["content.hashtags"] = body.hashtags
    if body.cta is not None:
        content_updates["content.cta"] = body.cta

    set_fields.update(content_updates)

    await db.posts.update_one({"_id": ObjectId(post_id)}, {"$set": set_fields})

    updated = await db.posts.find_one({"_id": ObjectId(post_id)})
    updated["id"] = str(updated.pop("_id"))
    return updated


@router.delete("/{workspace_id}/posts/{post_id}")
async def delete_post(workspace_id: str, post_id: str):
    """Eliminar un post permanentemente"""
    try:
        result = await db.posts.delete_one({"_id": ObjectId(post_id), "workspace_id": workspace_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")

    return {"deleted": True}


@router.post("/{workspace_id}/posts/{post_id}/generate-video")
async def generate_video_for_post(
    workspace_id: str,
    post_id: str,
    publish: bool = Query(False, description="Publicar como Reel tras generar"),
    duration: int = Query(5, description="Duración del video en segundos (5 o 10)"),
):
    """
    Genera un video corto (Reel) a partir de la imagen del post usando RunwayML,
    y opcionalmente lo publica en Facebook e Instagram como Reel.
    """
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id), "workspace_id": workspace_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    image_path = post.get("content", {}).get("image_local_path")
    image_url  = post.get("content", {}).get("image_url")
    topic      = post.get("topic", "wellness")
    text       = post.get("content", {}).get("text", "")
    hashtags   = post.get("content", {}).get("hashtags", [])

    # Generar video con RunwayML
    video_result = await video_service.generate_from_image(
        image_url=image_url,
        image_path=image_path,
        prompt_text=f"Gentle cinematic zoom in, warm soft lighting, premium wellness product feel for {topic}",
        duration=duration,
    )

    if not video_result.get("success"):
        raise HTTPException(status_code=502, detail=f"Video generation failed: {video_result.get('error')}")

    video_url = video_result["video_url"]

    # Guardar URL del video en el post
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {"content.video_url": video_url, "video_generated_at": datetime.utcnow().isoformat()}}
    )

    response = {"video_url": video_url, "published": False, "publish_results": None}

    if publish:
        reel_result = await meta_publisher.publish_reel_to_both(
            video_url=video_url,
            caption=text,
            hashtags=hashtags,
        )
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": {"reel_publish_results": reel_result, "reel_published_at": datetime.utcnow().isoformat()}}
        )
        response["published"] = True
        response["publish_results"] = reel_result

    return response
