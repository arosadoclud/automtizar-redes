from celery import Celery
from celery.schedules import crontab
import os

# Configuración de Celery
celery_app = Celery(
    "social_automation",
    broker=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://redis:6379/0"),
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Santo_Domingo",  # RD timezone
    enable_utc=False,
    beat_schedule={
        # Trend scan diario a las 6:00 AM
        "daily-trend-scan": {
            "task": "worker.tasks.daily_tasks.daily_trend_scan",
            "schedule": crontab(hour=6, minute=0),
        },
        # Generación de contenido diario a las 7:00 AM
        "daily-content-generation": {
            "task": "worker.tasks.daily_tasks.daily_content_generation",
            "schedule": crontab(hour=7, minute=0),
        },
        # Publicación a las 9:00 AM
        "morning-publish": {
            "task": "worker.tasks.daily_tasks.publish_scheduled_posts",
            "schedule": crontab(hour=9, minute=0),
        },
        # Publicación a las 12:00 PM (mediodía)
        "noon-publish": {
            "task": "worker.tasks.daily_tasks.publish_scheduled_posts",
            "schedule": crontab(hour=12, minute=0),
        },
        # Publicación a las 6:00 PM
        "evening-publish": {
            "task": "worker.tasks.daily_tasks.publish_scheduled_posts",
            "schedule": crontab(hour=18, minute=0),
        },
        # Recolección de métricas cada 6 horas
        "metrics-collection": {
            "task": "worker.tasks.daily_tasks.collect_metrics",
            "schedule": crontab(hour="*/6", minute=0),
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["worker.tasks"])
