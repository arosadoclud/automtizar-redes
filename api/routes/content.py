from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from api.services.openai_service import generate_post_content, generate_image_dalle, download_image

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
            image_url = await generate_image_dalle(post_content["image_prompt"])
            
            if image_url:
                # Descargar y guardar localmente
                os.makedirs("generated_images", exist_ok=True)
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                image_filename = f"post_{timestamp}.png"
                image_local_path = f"generated_images/{image_filename}"
                
                await download_image(image_url, image_local_path)
                post_content["image_url"] = image_url
                post_content["image_local_path"] = image_local_path
        except Exception as e:
            print(f"Warning: Could not generate image with DALL-E: {e}")
            # Continuar sin imagen
    
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

@router.post("/{workspace_id}/posts/{post_id}/approve")
async def approve_post(workspace_id: str, post_id: str):
    """Aprobar un post"""
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
    
    return {"status": "approved", "mock_files": {"json": mock_file, "html": html_file}}

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
