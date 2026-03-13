import os
import httpx
from typing import Dict, Optional, List
from datetime import datetime

class MetaPublisher:
    """
    Servicio para publicar contenido en Facebook e Instagram
    usando la Meta Graph API
    """
    
    def __init__(self):
        self.facebook_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
        self.instagram_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        self.facebook_page_id = os.getenv("FACEBOOK_PAGE_ID")
        self.instagram_account_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
        self.graph_api_version = "v18.0"
        self.base_url = f"https://graph.facebook.com/{self.graph_api_version}"
    
    async def publish_to_facebook(
        self, 
        text: str, 
        image_url: Optional[str] = None,
        image_path: Optional[str] = None
    ) -> Dict:
        """
        Publica un post en Facebook
        
        Args:
            text: Texto del post
            image_url: URL de la imagen (opcional)
            image_path: Ruta local de la imagen (opcional)
            
        Returns:
            Dict con post_id y status
        """
        if not self.facebook_token or not self.facebook_page_id:
            return {
                "success": False,
                "error": "Facebook credentials not configured"
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Si hay imagen, primero subir la foto
                if image_url or image_path:
                    photo_id = await self._upload_facebook_photo(
                        client, image_url, image_path, published=False
                    )
                    
                    # Publicar con la foto
                    url = f"{self.base_url}/{self.facebook_page_id}/feed"
                    data = {
                        "message": text,
                        "attached_media": [{"media_fbid": photo_id}],
                        "access_token": self.facebook_token
                    }
                else:
                    # Publicar solo texto
                    url = f"{self.base_url}/{self.facebook_page_id}/feed"
                    data = {
                        "message": text,
                        "access_token": self.facebook_token
                    }
                
                response = await client.post(url, data=data)
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "platform": "facebook",
                    "post_id": result.get("id"),
                    "published_at": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            return {
                "success": False,
                "platform": "facebook",
                "error": str(e)
            }
    
    async def _upload_facebook_photo(
        self, 
        client: httpx.AsyncClient, 
        image_url: Optional[str] = None,
        image_path: Optional[str] = None,
        published: bool = False
    ) -> str:
        """
        Sube una foto a Facebook y retorna el photo_id
        """
        url = f"{self.base_url}/{self.facebook_page_id}/photos"
        
        data = {
            "access_token": self.facebook_token,
            "published": "false" if not published else "true"
        }
        
        if image_url:
            data["url"] = image_url
            response = await client.post(url, data=data)
        elif image_path:
            with open(image_path, "rb") as f:
                files = {"source": f}
                response = await client.post(url, data=data, files=files)
        else:
            raise ValueError("Either image_url or image_path must be provided")
        
        response.raise_for_status()
        result = response.json()
        return result.get("id")
    
    async def publish_to_instagram(
        self,
        caption: str,
        image_url: str
    ) -> Dict:
        """
        Publica un post en Instagram (requiere imagen)
        
        Args:
            caption: Texto del post + hashtags
            image_url: URL pública de la imagen
            
        Returns:
            Dict con post_id y status
        """
        if not self.instagram_token or not self.instagram_account_id:
            return {
                "success": False,
                "error": "Instagram credentials not configured"
            }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Paso 1: Crear container de media
                create_url = f"{self.base_url}/{self.instagram_account_id}/media"
                create_data = {
                    "image_url": image_url,
                    "caption": caption,
                    "access_token": self.instagram_token
                }
                
                create_response = await client.post(create_url, data=create_data)
                create_response.raise_for_status()
                creation_result = create_response.json()
                container_id = creation_result.get("id")
                
                # Paso 2: Publicar el container
                publish_url = f"{self.base_url}/{self.instagram_account_id}/media_publish"
                publish_data = {
                    "creation_id": container_id,
                    "access_token": self.instagram_token
                }
                
                publish_response = await client.post(publish_url, data=publish_data)
                publish_response.raise_for_status()
                publish_result = publish_response.json()
                
                return {
                    "success": True,
                    "platform": "instagram",
                    "post_id": publish_result.get("id"),
                    "published_at": datetime.utcnow().isoformat()
                }
                
        except httpx.HTTPStatusError as e:
            error_detail = e.response.json() if e.response else str(e)
            return {
                "success": False,
                "platform": "instagram",
                "error": error_detail
            }
        except Exception as e:
            return {
                "success": False,
                "platform": "instagram",
                "error": str(e)
            }
    
    async def publish_to_both(
        self,
        text: str,
        image_url: Optional[str] = None,
        image_path: Optional[str] = None,
        hashtags: Optional[List[str]] = None
    ) -> Dict:
        """
        Publica en Facebook e Instagram simultáneamente
        
        Returns:
            Dict con resultados de ambas plataformas
        """
        results = {
            "facebook": None,
            "instagram": None
        }
        
        # Publicar en Facebook
        fb_result = await self.publish_to_facebook(text, image_url, image_path)
        results["facebook"] = fb_result
        
        # Publicar en Instagram (requiere imagen)
        if image_url:
            # Instagram requiere caption con hashtags
            caption = text
            if hashtags:
                caption += "\n\n" + " ".join(hashtags)
            
            ig_result = await self.publish_to_instagram(caption, image_url)
            results["instagram"] = ig_result
        else:
            results["instagram"] = {
                "success": False,
                "error": "Instagram requires an image"
            }
        
        return results
    
    async def get_post_metrics(self, post_id: str, platform: str = "facebook") -> Dict:
        """
        Obtiene métricas de un post publicado
        
        Args:
            post_id: ID del post
            platform: 'facebook' o 'instagram'
            
        Returns:
            Dict con métricas (likes, comments, shares, reach)
        """
        if platform == "facebook":
            return await self._get_facebook_metrics(post_id)
        elif platform == "instagram":
            return await self._get_instagram_metrics(post_id)
        else:
            return {"error": "Invalid platform"}
    
    async def _get_facebook_metrics(self, post_id: str) -> Dict:
        """Obtiene métricas de un post de Facebook"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/{post_id}"
                params = {
                    "fields": "likes.summary(true),comments.summary(true),shares",
                    "access_token": self.facebook_token
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "likes": data.get("likes", {}).get("summary", {}).get("total_count", 0),
                    "comments": data.get("comments", {}).get("summary", {}).get("total_count", 0),
                    "shares": data.get("shares", {}).get("count", 0)
                }
        except Exception as e:
            return {"error": str(e)}
    
    async def _get_instagram_metrics(self, post_id: str) -> Dict:
        """Obtiene métricas de un post de Instagram"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/{post_id}"
                params = {
                    "fields": "like_count,comments_count,engagement,reach,impressions",
                    "access_token": self.instagram_token
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "likes": data.get("like_count", 0),
                    "comments": data.get("comments_count", 0),
                    "engagement": data.get("engagement", 0),
                    "reach": data.get("reach", 0),
                    "impressions": data.get("impressions", 0)
                }
        except Exception as e:
            return {"error": str(e)}


# Singleton instance
meta_publisher = MetaPublisher()
