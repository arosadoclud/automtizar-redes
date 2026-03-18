"""
Video generation service using RunwayML Gen-4 Turbo (image-to-video).
Converts an existing image into a short 5-10 second video (9:16 portrait for Reels).
API docs: https://docs.runwayml.com/
"""
import os
import asyncio
import httpx
from typing import Optional, Dict

RUNWAY_BASE = "https://api.runwayml.com/v1"


def _runway_headers() -> dict:
    """Build headers at request time so env vars are always fresh."""
    return {
        "Authorization": f"Bearer {os.getenv('RUNWAYML_API_KEY', '')}",
        "X-Runway-Version": "2024-11-06",
        "Content-Type": "application/json",
    }


class VideoService:
    """Generate short videos from images via RunwayML and return a public URL."""

    async def generate_from_image(
        self,
        image_url: Optional[str] = None,
        image_path: Optional[str] = None,
        prompt_text: str = "Gentle zoom in, cinematic motion, warm lighting, professional wellness brand",
        duration: int = 5,          # 5 or 10 seconds
        ratio: str = "9:16",        # 9:16 for Reels/TikTok, 16:9 for landscape
    ) -> Dict:
        """
        Submit an image-to-video task to RunwayML and wait for the result.

        Returns:
            {"success": True,  "video_url": "https://..."}
            {"success": False, "error": "..."}
        """
        api_key = os.getenv("RUNWAYML_API_KEY", "")
        model   = os.getenv("RUNWAY_MODEL", "gen4_turbo")

        if not api_key:
            return {"success": False, "error": "RUNWAYML_API_KEY not configured in .env"}

        # Build the prompt image value (URL or base64)
        prompt_image = None
        if image_url:
            prompt_image = image_url
        elif image_path and os.path.exists(image_path):
            import base64
            with open(image_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
            ext = os.path.splitext(image_path)[1].lower().lstrip(".")
            mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
            prompt_image = f"data:{mime};base64,{b64}"
        else:
            return {"success": False, "error": "No image_url or valid image_path provided"}

        payload = {
            "model": model,
            "promptImage": prompt_image,
            "promptText": prompt_text,
            "duration": duration,
            "ratio": ratio,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Submit task
            resp = await client.post(
                f"{RUNWAY_BASE}/image_to_video",
                json=payload,
                headers=_runway_headers(),
            )
            if resp.status_code not in (200, 201):
                return {"success": False, "error": f"RunwayML submit error {resp.status_code}: {resp.text}"}

            task_id = resp.json().get("id")
            if not task_id:
                return {"success": False, "error": "No task ID returned by RunwayML"}

            print(f"🎬 RunwayML task submitted: {task_id}  model={model}")

            # 2. Poll until SUCCEEDED (up to ~10 min)
            for attempt in range(120):
                await asyncio.sleep(5)
                poll = await client.get(
                    f"{RUNWAY_BASE}/tasks/{task_id}",
                    headers=_runway_headers(),
                )
                if poll.status_code != 200:
                    continue
                data = poll.json()
                status = data.get("status")
                progress = data.get("progress", "")
                print(f"  ⏳ RunwayML [{attempt+1}/120] status={status} {progress}")

                if status == "SUCCEEDED":
                    output = data.get("output", [])
                    video_url = output[0] if output else None
                    if video_url:
                        print(f"✅ RunwayML video ready: {video_url[:80]}")
                        return {"success": True, "video_url": video_url, "task_id": task_id, "model": model}
                    return {"success": False, "error": "SUCCEEDED but no output URL"}

                if status in ("FAILED", "CANCELLED"):
                    return {"success": False, "error": f"RunwayML task {status}: {data.get('failure', '')}"}

            return {"success": False, "error": "RunwayML timeout — task did not finish in 10 minutes"}


video_service = VideoService()
