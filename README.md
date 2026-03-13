# 🚀 Sistema de Automatización para Redes Sociales

Sistema completo de automatización de contenido para Instagram y Facebook con IA (GPT-4o + DALL-E 3), gestión de contenido, y flujo de aprobación.

## ✨ Características

- 🤖 **Generación automática con GPT-4o**: Crea contenido profesional, educativo y viral
- 🎨 **Imágenes con DALL-E 3**: Genera imágenes únicas para cada post
- � **Publicación directa**: Integración con Facebook e Instagram Graph API
- 📅 **Scheduler automático**: Publica posts en horarios óptimos (9AM, 12PM, 6PM)
- ✅ **Sistema de aprobación**: Review gate para control de calidad
- 📊 **Dashboard React**: Interfaz visual para gestionar contenido
- 📈 **Recolección de métricas**: Automática cada 6 horas (likes, comments, reach)
- 🗄️ **MongoDB + Redis**: Almacenamiento y cache de alta performance
- 🔄 **Celery Beat**: Automatización de tareas programadas
- 🐳 **Docker**: Deploy fácil con docker-compose

## 🏗️ Arquitectura

```
┌─────────────────┐
│  Dashboard      │  React (localhost:3000)
│  (React)        │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Backend API    │  FastAPI (localhost:8000)
│  (FastAPI)      │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    v         v            v
┌────────┐ ┌─────────┐ ┌──────────┐
│MongoDB │ │ Redis   │ │ Celery   │
│        │ │         │ │ Workers  │
└────────┘ └─────────┘ └──────────┘
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker Desktop instalado
- Node.js v16+ (para el dashboard)
- OpenAI API Key

### 1. Configurar Variables de Entorno

Crea un archivo `.env` (copia desde `.env.example`):

```env
# OpenAI API
OPENAI_API_KEY=tu_api_key_aqui
USE_DALLE=true

# Social Media (opcional - para publicación real)
FACEBOOK_PAGE_ID=tu_facebook_page_id
FACEBOOK_ACCESS_TOKEN=tu_facebook_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=tu_instagram_id
INSTAGRAM_ACCESS_TOKEN=tu_instagram_token

# Database
MONGO_URL=mongodb://mongo:27017
REDIS_URL=redis://redis:6379/0
```

**📱 Para configurar Facebook/Instagram**, sigue la guía: [SETUP_META.md](SETUP_META.md)

### 2. Levantar Backend con Docker

```bash
docker-compose up -d
```

Servicios disponibles:
- API: http://localhost:8000
- MongoDB: localhost:27017
- Redis: localhost:6379
- MinIO: http://localhost:9001

### 3. Levantar Dashboard React

```bash
cd ../social-dashboard
npm install
npm start
```

Dashboard: http://localhost:3000

## 📋 Uso

### Crear un Workspace

```bash
curl -X POST http://localhost:8000/api/workspaces/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Marca de Salud",
    "slug": "mi-marca-salud",
    "niches": ["salud_natural", "suplementos", "bienestar"],
    "mode": "human_review",
    "daily_post_goal": 3
  }'
```

### Generar un Post

```bash
curl -X POST "http://localhost:8000/api/content/WORKSPACE_ID/generate?topic=beneficios+del+magnesio"
```

### Ver Cola de Posts

```bash
curl http://localhost:8000/api/content/WORKSPACE_ID/queue
```

### Aprobar un Post

```bash
# Aprobar sin publicar
curl -X POST http://localhost:8000/api/content/WORKSPACE_ID/posts/POST_ID/approve

# Aprobar y publicar inmediatamente en FB e IG
curl -X POST "http://localhost:8000/api/content/WORKSPACE_ID/posts/POST_ID/approve?publish_now=true"
```

## 📅 Automatización Programada

El sistema ejecuta automáticamente:

- **06:00 AM**: Escaneo de tendencias
- **07:00 AM**: Generación de contenido del día
- **09:00 AM**: Publicación matutina en FB e IG
- **12:00 PM**: Publicación mediodía en FB e IG
- **06:00 PM**: Publicación vespertina en FB e IG
- **Cada 6h**: Recolección de métricas (likes, comments, shares, reach)

Los posts aprobados se publican automáticamente en los horarios configurados.

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI**: Framework web moderno y rápido
- **MongoDB**: Base de datos NoSQL
- **Redis**: Cache y message broker
- **Celery**: Task queue para tareas asíncronas
- **OpenAI API**: GPT-4o + DALL-E 3

### Frontend
- **React**: Librería UI
- **Recharts**: Gráficos y visualizaciones

### DevOps
- **Docker**: Containerización
- **Docker Compose**: Orquestación de servicios

## 📁 Estructura del Proyecto

```
.
├── api/
│   ├── main.py              # Entry point de FastAPI
│   ├── routes/              # Endpoints de la API
│   │   ├── workspaces.py    # CRUD workspaces
│   │   └── content.py       # Generación y gestión de contenido
│   └── services/
│       ├── openai_service.py    # Integración GPT-4o + DALL-E
│       └── meta_publisher.py    # Publicación FB/IG + métricas
├── worker/
│   ├── celery_app.py        # Configuración Celery + schedules
│   └── tasks/
│       └── daily_tasks.py   # Tareas automatizadas
├── scripts/
│   └── get_meta_tokens.py   # Script para obtener tokens de Meta
├── docker/
│   ├── Dockerfile.api       # Dockerfile para API
│   └── Dockerfile.worker    # Dockerfile para workers
├── docker-compose.yml       # Orquestación de servicios
├── requirements.txt         # Dependencias Python
├── README.md               # Este archivo
└── SETUP_META.md           # Guía de configuración FB/IG
```

## 💰 Costos de API

- **GPT-4o**: ~$0.01-0.03 por post
- **DALL-E 3**: ~$0.04 por imagen (1024x1024)

**Nota**: Puedes desactivar DALL-E con `USE_DALLE=false` para testing sin consumir créditos.

## ⚠️ Requisitos para DALL-E 3

Para usar DALL-E 3 necesitas:
1. Verificar tu organización en OpenAI: https://platform.openai.com/settings/organization/general
2. Esperar ~15 minutos para que se propague el acceso

## 🔐 Seguridad

- ✅ El archivo `.env` está en `.gitignore`
- ✅ Las API keys NO están en el código
- ✅ MongoDB sin autenticación (solo para desarrollo local)

**Para producción**: Habilita autenticación en MongoDB y Redis.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [x] Integración con Facebook/Instagram Graph API ✅
- [x] Recolección automática de métricas ✅
- [ ] Telegram Bot para notificaciones de review gate
- [ ] Dashboard analytics avanzado con gráficos en tiempo real
- [ ] Multi-idioma support (ES/EN/PT)
- [ ] A/B testing de contenido
- [ ] Detección automática de hashtags trending
- [ ] Análisis de competidores
- [ ] A/B testing de contenido

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👤 Autor

**Andy Rosado**
- GitHub: [@arosadoclud](https://github.com/arosadoclud)

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
