from celery import Celery
from celery.schedules import crontab
import os

# Configuración de Celery
celery_app = Celery(
    "social_automation",
    broker=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    include=["worker.tasks.daily_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Santo_Domingo",  # RD timezone
    enable_utc=False,
    beat_schedule={
        # ─── Generación masiva de contenido a las 7:00 AM ───────────
        # Genera los 7 posts del día de una sola vez
        "daily-content-generation": {
            "task": "worker.tasks.daily_tasks.daily_content_generation",
            "schedule": crontab(hour=7, minute=0),
        },

        # ─── 7 publicaciones diarias ─────────────────────────────────
        "publish-8am": {
            "task": "worker.tasks.daily_tasks.publish_next_post",
            "schedule": crontab(hour=8, minute=0),
        },
        "publish-10am": {
            "task": "worker.tasks.daily_tasks.publish_next_post",
            "schedule": crontab(hour=10, minute=0),
        },
        "publish-12pm": {
            "task": "worker.tasks.daily_tasks.publish_next_post",
            "schedule": crontab(hour=12, minute=0),
        },
        "publish-2pm": {
            "task": "worker.tasks.daily_tasks.publish_next_post",
            "schedule": crontab(hour=14, minute=0),
        },
        "publish-4pm": {
            "task": "worker.tasks.daily_tasks.publish_next_post",
            "schedule": crontab(hour=16, minute=0),
        },
        "publish-6pm": {
            "task": "worker.tasks.daily_tasks.publish_next_post",
            "schedule": crontab(hour=18, minute=0),
        },
        "publish-9pm": {
            "task": "worker.tasks.daily_tasks.publish_next_post",
            "schedule": crontab(hour=21, minute=0),
        },

        # ─── Recolección de métricas cada 6 horas ───────────────────
        "metrics-collection": {
            "task": "worker.tasks.daily_tasks.collect_metrics",
            "schedule": crontab(hour="*/6", minute=0),
        },

        # ─── Responder mensajes pendientes cada 5 minutos ───────────
        "process-messages": {
            "task": "worker.tasks.daily_tasks.process_pending_messages",
            "schedule": crontab(minute="*/5"),
        },

        # ─── Verificar y auto-renovar Page Token cada lunes 6:30 AM ─
        "weekly-token-check": {
            "task": "worker.tasks.daily_tasks.verify_and_refresh_token",
            "schedule": crontab(hour=6, minute=30, day_of_week=1),
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["worker.tasks"])
