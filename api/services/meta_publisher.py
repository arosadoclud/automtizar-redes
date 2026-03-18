import os
import json
import asyncio
import httpx
from typing import Dict, Optional, List
from datetime import datetime
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

# Archivo de caché local (fallback si MongoDB no está disponible)
_TOKEN_CACHE_FILE = Path("/tmp/meta_token_cache.json")

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")

def _get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client.social_automation


class MetaPublisher:
    """
    Servicio para publicar contenido en Facebook e Instagram
    usando la Meta Graph API.

    Auto-renovación de tokens:
      1. FACEBOOK_APP_ID + FACEBOOK_APP_SECRET configurados:
         - Intercambia el user token por uno largo (~60 días)
         - Obtiene el Page Access Token → NUNCA EXPIRA
         - Guarda el Page Token en MongoDB (persiste entre reinicios)
      2. Sin App ID/Secret: usa el user token directamente.

    Para renovar manualmente: llamar a exchange_and_store(new_user_token).
    """

    def __init__(self):
        self.user_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
        self.facebook_token = self.user_token
        self.instagram_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        self.facebook_page_id = os.getenv("FACEBOOK_PAGE_ID")
        self.instagram_account_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")
        self.app_id = os.getenv("FACEBOOK_APP_ID", "")
        self.app_secret = os.getenv("FACEBOOK_APP_SECRET", "")
        self.graph_api_version = "v18.0"
        self.base_url = f"https://graph.facebook.com/{self.graph_api_version}"
        self._page_token: Optional[str] = None
        # Intentar cargar token guardado en disco al iniciar (sync fallback)
        self._load_cached_token_file()

    # ──────────────────────────────────────────────────────────────────
    # Token cache — MongoDB (primary) + file (fallback)
    # ──────────────────────────────────────────────────────────────────

    def _load_cached_token_file(self):
        """Carga desde /tmp (sync, usado solo en __init__)."""
        try:
            if _TOKEN_CACHE_FILE.exists():
                data = json.loads(_TOKEN_CACHE_FILE.read_text())
                if data.get("page_token"):
                    self._page_token = data["page_token"]
                    self.facebook_token = self._page_token
                    self.instagram_token = self._page_token
                    print("✅ Page Token cargado desde caché local")
        except Exception as e:
            print(f"⚠️ No se pudo cargar token local: {e}")

    async def _load_cached_token_mongo(self) -> Optional[str]:
        """Carga el Page Token desde MongoDB."""
        try:
            db = _get_db()
            doc = await db.config.find_one({"_id": "meta_credentials"})
            if doc and doc.get("page_token"):
                print("✅ Page Token cargado desde MongoDB (no expira)")
                return doc["page_token"]
        except Exception as e:
            print(f"⚠️ No se pudo cargar token de MongoDB: {e}")
        return None

    async def _save_token_mongo(self, page_token: str, user_token: str = None):
        """Persiste el Page Token y user token en MongoDB."""
        try:
            db = _get_db()
            await db.config.update_one(
                {"_id": "meta_credentials"},
                {"$set": {
                    "page_token": page_token,
                    "user_token": user_token or self.user_token,
                    "user_token_prefix": (user_token or self.user_token or "")[:20],
                    "page_id": self.facebook_page_id,
                    "saved_at": datetime.utcnow().isoformat(),
                }},
                upsert=True,
            )
            print("💾 Page Token guardado en MongoDB")
        except Exception as e:
            print(f"⚠️ No se pudo guardar token en MongoDB: {e}")

    def _save_token_file(self, page_token: str):
        """Guarda el Page Token en /tmp (fallback)."""
        try:
            _TOKEN_CACHE_FILE.write_text(json.dumps({
                "page_token": page_token,
                "saved_at": datetime.utcnow().isoformat(),
            }))
        except Exception:
            pass

    def invalidate_token_cache(self):
        """Borra el caché en memoria (fuerza re-exchange en _ensure_page_token)."""
        self._page_token = None
        try:
            if _TOKEN_CACHE_FILE.exists():
                _TOKEN_CACHE_FILE.unlink()
        except Exception:
            pass

    # ──────────────────────────────────────────────────────────────────
    # Public: exchange a new user token and persist the page token
    # ──────────────────────────────────────────────────────────────────

    async def exchange_and_store(self, user_token: str) -> Dict:
        """
        Recibe un user token (cualquier duración), obtiene el Page Token
        permanente y lo guarda en MongoDB + memoria.

        Llamar desde el dashboard cuando el usuario pega un nuevo token.
        """
        self.user_token = user_token
        self.invalidate_token_cache()
        # Borrar también el token en MongoDB para forzar un exchange real
        try:
            db = _get_db()
            await db.config.delete_one({"_id": "meta_credentials"})
        except Exception:
            pass
        async with httpx.AsyncClient(timeout=20.0) as client:
            page_token = await self._ensure_page_token(client)
        if page_token and page_token != user_token:
            return {"success": True, "message": "Page Token permanente obtenido y guardado ✅"}
        return {"success": False, "message": "No se pudo obtener el Page Token. Verifica que el token tenga permisos de página."}

    # ──────────────────────────────────────────────────────────────────
    # Token exchange: short-lived → long-lived → page (permanent)
    # ──────────────────────────────────────────────────────────────────

    async def _exchange_for_long_lived_token(self, client: httpx.AsyncClient, token: str) -> Optional[str]:
        """
        Intercambia cualquier User Token por uno de larga duración (~60 días).
        Requiere FACEBOOK_APP_ID y FACEBOOK_APP_SECRET.
        """
        if not self.app_id or not self.app_secret:
            return None
        try:
            resp = await client.get(
                f"https://graph.facebook.com/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": self.app_id,
                    "client_secret": self.app_secret,
                    "fb_exchange_token": token,
                },
            )
            resp.raise_for_status()
            long_token = resp.json().get("access_token")
            if long_token:
                print("✅ Token de larga duración obtenido (~60 días)")
            return long_token
        except Exception as e:
            print(f"⚠️ No se pudo obtener token largo: {e}")
            return None

    async def _ensure_page_token(self, client: httpx.AsyncClient) -> str:
        """
        Devuelve un Page Access Token válido, usando la cadena:
          user token → long-lived token (si hay App ID/Secret) → Page Token (permanente)

        Prioridad de carga: memoria → MongoDB → exchange fresh
        """
        # 1. Memoria
        if self._page_token:
            return self._page_token

        # 2. MongoDB
        mongo_token = await self._load_cached_token_mongo()
        if mongo_token:
            self._page_token = mongo_token
            self.facebook_token = mongo_token
            self.instagram_token = mongo_token
            return self._page_token

        # 3. Exchange: user token → long-lived → page token
        base_token = self.user_token
        if self.app_id and self.app_secret:
            long_token = await self._exchange_for_long_lived_token(client, base_token)
            if long_token:
                base_token = long_token

        try:
            resp = await client.get(
                f"{self.base_url}/{self.facebook_page_id}",
                params={"fields": "access_token", "access_token": base_token},
            )
            resp.raise_for_status()
            page_token = resp.json().get("access_token")
            if page_token:
                self._page_token = page_token
                self.facebook_token = page_token
                self.instagram_token = page_token
                # Persist in MongoDB + file so it survives restarts
                await self._save_token_mongo(page_token)
                self._save_token_file(page_token)
                print(f"✅ Page Token {'permanente' if self.app_id else 'temporal'} obtenido y guardado")
                return page_token
        except Exception as e:
            print(f"⚠️ No se pudo obtener Page Token: {e}")

        # Fallback
        self._page_token = base_token
        return base_token
    
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
        if not self.user_token or not self.facebook_page_id:
            return {
                "success": False,
                "error": "Facebook credentials not configured"
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Obtener Page Access Token (intercambio automático)
                await self._ensure_page_token(client)
                
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

    async def _upload_photo_and_get_cdn_url(
        self,
        client: httpx.AsyncClient,
        image_url: Optional[str] = None,
        image_path: Optional[str] = None
    ) -> tuple:
        """
        Sube una foto a Facebook (sin publicar) y retorna (photo_id, cdn_url).
        La cdn_url es una URL pública del CDN de Facebook, válida para Instagram.
        """
        photo_id = await self._upload_facebook_photo(client, image_url, image_path, published=False)

        # Obtener la URL pública del CDN de Facebook
        cdn_url = None
        try:
            resp = await client.get(
                f"{self.base_url}/{photo_id}",
                params={"fields": "images", "access_token": self.facebook_token}
            )
            resp.raise_for_status()
            images = resp.json().get("images", [])
            if images:
                cdn_url = sorted(images, key=lambda x: x.get("width", 0), reverse=True)[0].get("source")
        except Exception as e:
            print(f"⚠️ No se pudo obtener CDN URL del photo {photo_id}: {e}")

        return photo_id, cdn_url
    
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
        if not self.user_token or not self.instagram_account_id:
            return {
                "success": False,
                "error": "Instagram credentials not configured"
            }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Obtener Page Access Token (intercambio automático)
                await self._ensure_page_token(client)
                
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

                # Esperar hasta que el container esté listo (máx 30s)
                for _ in range(10):
                    await asyncio.sleep(3)
                    status_resp = await client.get(
                        f"{self.base_url}/{container_id}",
                        params={"fields": "status_code", "access_token": self.instagram_token}
                    )
                    if status_resp.status_code == 200:
                        status_code = status_resp.json().get("status_code", "")
                        print(f"  📸 Instagram container status: {status_code}")
                        if status_code == "FINISHED":
                            break
                        if status_code == "ERROR":
                            return {"success": False, "platform": "instagram", "error": "Container processing failed"}

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
        Publica en Facebook e Instagram simultáneamente.
        Si hay imagen: sube a FB con published=true (un solo paso) y reutiliza
        la CDN URL resultante para Instagram.

        Nota: image_path (archivo local) tiene prioridad sobre image_url
        porque las URLs de DALL-E expiran tras 1 hora.
        """
        results = {"facebook": None, "instagram": None}

        # Preferir siempre el archivo local sobre la URL (que puede estar expirada)
        use_path = image_path if image_path and os.path.exists(image_path) else None
        use_url  = image_url if not use_path else None

        if use_path or use_url:
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    # Obtener Page Access Token (intercambio automático)
                    page_token = await self._ensure_page_token(client)

                    # Publicar foto directamente en Facebook (published=true + message)
                    photos_url = f"{self.base_url}/{self.facebook_page_id}/photos"
                    data = {
                        "message": text,
                        "access_token": page_token,
                        "published": "true"
                    }

                    if use_url:
                        data["url"] = use_url
                        resp = await client.post(photos_url, data=data)
                    else:
                        with open(use_path, "rb") as f:
                            resp = await client.post(photos_url, data=data, files={"source": f})

                    resp.raise_for_status()
                    photo_result = resp.json()
                    photo_id = photo_result.get("id")

                    results["facebook"] = {
                        "success": True,
                        "platform": "facebook",
                        "post_id": photo_result.get("post_id") or photo_id,
                        "published_at": datetime.utcnow().isoformat()
                    }
                    print(f"✅ Facebook publicado con imagen (photo_id={photo_id})")

                    # Obtener CDN URL pública para Instagram
                    cdn_url = None
                    if photo_id:
                        cdn_resp = await client.get(
                            f"{self.base_url}/{photo_id}",
                            params={"fields": "images", "access_token": page_token}
                        )
                        if cdn_resp.status_code == 200:
                            images = cdn_resp.json().get("images", [])
                            if images:
                                cdn_url = sorted(images, key=lambda x: x.get("width", 0), reverse=True)[0].get("source")
                                print(f"✅ CDN URL para Instagram: {cdn_url[:60]}")

                    # Publicar en Instagram
                    if cdn_url:
                        caption = text
                        if hashtags:
                            caption += "\n\n" + " ".join(hashtags)
                        results["instagram"] = await self.publish_to_instagram(caption, cdn_url)
                    else:
                        results["instagram"] = {
                            "success": False,
                            "error": "No se pudo obtener CDN URL para Instagram"
                        }

            except Exception as e:
                results["facebook"] = {"success": False, "platform": "facebook", "error": str(e)}
                results["instagram"] = {"success": False, "error": f"Falló subida de imagen: {e}"}
        else:
            # Sin imagen: solo texto en Facebook, Instagram requiere imagen
            results["facebook"] = await self.publish_to_facebook(text)
            results["instagram"] = {"success": False, "error": "Instagram requires an image"}

        return results

    async def publish_reel_to_both(
        self,
        video_url: str,
        caption: str,
        hashtags: Optional[List[str]] = None,
    ) -> Dict:
        """
        Publica un Reel en Facebook e Instagram usando una URL de video (RunwayML, etc).
        """
        results = {"facebook": None, "instagram": None}
        full_caption = caption
        if hashtags:
            full_caption += "\n\n" + " ".join(hashtags)

        async with httpx.AsyncClient(timeout=120.0) as client:
            page_token = await self._ensure_page_token(client)

            # ── Facebook Reel ──────────────────────────────────────────────
            try:
                # Paso 1: inicializar upload
                init_resp = await client.post(
                    f"{self.base_url}/{self.facebook_page_id}/video_reels",
                    data={"upload_phase": "start", "access_token": page_token},
                )
                init_resp.raise_for_status()
                init_data = init_resp.json()
                video_id = init_data.get("video_id")
                upload_url = init_data.get("upload_url")

                # Paso 2: subir el video desde URL
                upload_resp = await client.post(
                    upload_url,
                    headers={
                        "Authorization": f"OAuth {page_token}",
                        "file_url": video_url,
                    },
                )
                upload_resp.raise_for_status()

                # Paso 3: publicar
                finish_resp = await client.post(
                    f"{self.base_url}/{self.facebook_page_id}/video_reels",
                    data={
                        "upload_phase": "finish",
                        "video_id": video_id,
                        "description": full_caption,
                        "video_state": "PUBLISHED",
                        "access_token": page_token,
                    },
                )
                finish_resp.raise_for_status()
                results["facebook"] = {
                    "success": True,
                    "platform": "facebook",
                    "post_id": video_id,
                    "published_at": datetime.utcnow().isoformat(),
                }
                print(f"✅ Facebook Reel publicado (video_id={video_id})")

            except Exception as e:
                results["facebook"] = {"success": False, "platform": "facebook", "error": str(e)}

            # ── Instagram Reel ─────────────────────────────────────────────
            try:
                # Paso 1: crear container
                create_resp = await client.post(
                    f"{self.base_url}/{self.instagram_account_id}/media",
                    data={
                        "media_type": "REELS",
                        "video_url": video_url,
                        "caption": full_caption,
                        "access_token": page_token,
                    },
                )
                create_resp.raise_for_status()
                container_id = create_resp.json().get("id")

                # Paso 2: esperar procesamiento (máx 5 min)
                for _ in range(60):
                    await asyncio.sleep(5)
                    poll = await client.get(
                        f"{self.base_url}/{container_id}",
                        params={"fields": "status_code", "access_token": page_token},
                    )
                    status_code = poll.json().get("status_code", "")
                    print(f"  📸 IG Reel container status: {status_code}")
                    if status_code == "FINISHED":
                        break
                    if status_code == "ERROR":
                        raise Exception("Instagram container processing failed")

                # Paso 3: publicar
                pub_resp = await client.post(
                    f"{self.base_url}/{self.instagram_account_id}/media_publish",
                    data={"creation_id": container_id, "access_token": page_token},
                )
                pub_resp.raise_for_status()
                results["instagram"] = {
                    "success": True,
                    "platform": "instagram",
                    "post_id": pub_resp.json().get("id"),
                    "published_at": datetime.utcnow().isoformat(),
                }
                print(f"✅ Instagram Reel publicado")

            except Exception as e:
                results["instagram"] = {"success": False, "platform": "instagram", "error": str(e)}

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
