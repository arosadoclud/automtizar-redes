# VitaGloss Social Hub 🌿

Panel de automatización de redes sociales para el equipo de ventas de VitaGloss RD.

Genera, revisa y publica contenido en **Facebook** e **Instagram** usando GPT-4o + DALL-E 3.

---

## 🚀 Deploy rápido (equipo / servidor)

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd automatizar-redes-vitaglossrd
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus claves reales
```

### 3. Levantar todos los servicios
```bash
docker-compose up -d --build
```

El panel estará disponible en **http://TU_IP_O_DOMINIO**

### 4. Crear el primer administrador
```bash
# Con Docker corriendo:
docker-compose exec api python scripts/create_admin.py "Tu Nombre" admin@vitagloss.com TuContrasena123

# O localmente:
MONGO_URL=mongodb://localhost:27017 python scripts/create_admin.py "Tu Nombre" admin@vitagloss.com TuContrasena123
```

### 5. Agregar miembros del equipo
El admin agrega usuarios desde el panel:
**Configuracion → Equipo de trabajo → + Nuevo usuario**

---

## 🖥 Desarrollo local

### Backend
```bash
docker-compose up mongo redis -d
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## 🏗 Arquitectura

```
frontend/          → React + Vite (Login + Dashboard)
api/               → FastAPI (REST API con JWT auth)
  routes/auth.py   → Login, usuarios, gestion de equipo
  services/        → OpenAI, Meta Publisher, Auth JWT
worker/            → Celery (tareas programadas)
docker/            → Dockerfiles
```

### Servicios Docker
| Servicio  | Puerto | Descripcion                   |
|-----------|--------|-------------------------------|
| frontend  | **80** | Panel web (Nginx + React)     |
| api       | 8000   | FastAPI (interno)             |
| mongo     | 27017  | Base de datos MongoDB         |
| redis     | 6379   | Cola de tareas Celery         |
| minio     | 9001   | Console de almacenamiento     |

---

## 🔐 Roles de usuario

| Rol     | Permisos                                              |
|---------|-------------------------------------------------------|
| `admin` | Todo: crear/eliminar usuarios, workspaces, publicar  |
| `agent` | Ver cola, aprobar/rechazar/publicar posts            |

---

## ⚙️ Variables de entorno criticas

| Variable                      | Descripcion                       |
|-------------------------------|-----------------------------------|
| `OPENAI_API_KEY`              | GPT-4o + DALL-E 3                |
| `META_PAGE_ACCESS_TOKEN`      | Token de Facebook Page            |
| `META_PAGE_ID`                | ID de pagina de Facebook          |
| `META_INSTAGRAM_ACCOUNT_ID`   | ID de cuenta Instagram Business   |
| `JWT_SECRET_KEY`              | Clave JWT (cambiar en produccion) |
| `CORS_ORIGINS`                | URL del frontend en produccion    |

---

## 🔄 Comandos utiles

```bash
# Ver logs en tiempo real
docker-compose logs -f api

# Reconstruir despues de cambios en codigo
docker-compose up -d --build api worker

# Reconstruir el frontend
docker-compose up -d --build frontend

# Backup de MongoDB
docker-compose exec mongo mongodump --out /data/backup
```
