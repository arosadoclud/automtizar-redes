# 📱 Guía de Integración Facebook/Instagram

## ✅ Paso 1: Configurar Productos en Meta Developers

Tu app **"VitaGloss RD Bot"** ya está creada. Ahora configura los productos:

### A. Agregar Productos:
1. Ve a tu app: https://developers.facebook.com/apps
2. Panel lateral → **"Agregar productos"**
3. Agrega estos:
   - ✅ **Facebook Login** → Configuración básica
   - ✅ **Instagram Graph API**

### B. Configurar Facebook Login:
1. Productos → Facebook Login → Configuración
2. **URIs de redirección OAuth válidos**: 
   ```
   http://localhost:8000/auth/callback
   ```
3. Guardar cambios

---

## 🔑 Paso 2: Obtener Tokens de Acceso

### Método 1: Graph API Explorer (Recomendado)

1. **Ve al Explorer**: https://developers.facebook.com/tools/explorer/

2. **Selecciona tu app**:
   - Dropdown superior derecho → "VitaGloss RD Bot"

3. **Genera User Access Token**:
   - Click en "Generate Access Token"
   - Solicita estos permisos (⚠️ IMPORTANTE):
     ```
     pages_show_list
     pages_read_engagement
     pages_manage_posts
     instagram_basic
     instagram_content_publish
     pages_read_user_content
     business_management
     ```

4. **Confirma** y copia el token generado

5. **Ejecuta el script** para convertirlo a token de larga duración:
   ```powershell
   python scripts/get_meta_tokens.py
   ```
   
   El script te pedirá:
   - App ID (lo ves en Configuración → Básica)
   - App Secret (lo ves en Configuración → Básica)
   - Token de corta duración (el que copiaste del Explorer)

---

## 📄 Paso 3: Conectar tu Página de Facebook

1. **Verifica que tienes una Página de Facebook**:
   - Tu página debe estar en modo "Negocio" o "Creador"
   - Asegúrate de ser administrador

2. **El script automático te mostrará**:
   - Tus páginas disponibles
   - Te pedirá seleccionar cuál usar
   - Obtendrá el Page Access Token automáticamente

---

## 📸 Paso 4: Conectar Instagram Business

### Requisitos:
- ✅ Cuenta de Instagram **Business** o **Creator** (no Personal)
- ✅ Conectada a tu Página de Facebook

### Conectar Instagram a Facebook:
1. Ve a tu **Página de Facebook**
2. **Configuración** → **Instagram**
3. **Conectar cuenta**
4. Inicia sesión con tu cuenta de Instagram

El script detectará automáticamente tu Instagram Business Account ID.

---

## ⚙️ Paso 5: Configurar Variables de Entorno

Una vez tengas los tokens del script, edita tu archivo `.env`:

```bash
# Credenciales de Meta
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAAx...tu_token_aqui
INSTAGRAM_BUSINESS_ACCOUNT_ID=987654321098765
INSTAGRAM_ACCESS_TOKEN=EAAx...tu_token_aqui
```

⚠️ **IMPORTANTE**: El Page Access Token puede usarse para ambos (FB e IG)

---

## 🚀 Paso 6: Probar la Integración

### Reconstruir containers:
```powershell
docker-compose up -d --build
```

### Generar y publicar un post de prueba:
```powershell
# Generar post
$body = @{topic="test publicación"} | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "http://localhost:8000/api/content/69b0ea6d49fee8a96660eb49/generate?topic=test+publicación" | ConvertFrom-Json

# Aprobar y publicar (agrega ?publish_now=true)
Invoke-WebRequest -Method POST -Uri "http://localhost:8000/api/content/69b0ea6d49fee8a96660eb49/posts/POST_ID/approve?publish_now=true"
```

Reemplaza `POST_ID` con el ID del post generado.

---

## 🔍 Verificar Publicación

1. **Revisa tu Página de Facebook**: El post debe aparecer con imagen
2. **Revisa tu Instagram**: El post debe aparecer con caption + hashtags
3. **Revisa los logs**:
   ```powershell
   docker-compose logs -f worker
   ```

---

## ⏰ Publicación Automática con Celery

Los posts aprobados se publican automáticamente en estos horarios:
- ✅ **9:00 AM** - Publicación matutina
- ✅ **12:00 PM** - Publicación mediodía  
- ✅ **6:00 PM** - Publicación vespertina

Para forzar publicación inmediata de posts aprobados:
```powershell
# Ejecutar tarea manual
docker-compose exec worker celery -A worker.celery_app call worker.tasks.daily_tasks.publish_scheduled_posts
```

---

## 📊 Recolección de Métricas

Automáticamente cada 6 horas se recolectan:
- 👍 Likes
- 💬 Comentarios
- 🔄 Shares (Facebook)
- 👁️ Reach e Impressions (Instagram)

Ver métricas en el dashboard: http://localhost:3000

---

## 🐛 Troubleshooting

### Error: "Application request limit reached"
- **Solución**: Tu app está en modo desarrollo. Solicita revisión en Meta Developers

### Error: "This endpoint requires the 'pages_manage_posts' permission"
- **Solución**: Vuelve a generar el token con todos los permisos listados arriba

### Error: "Instagram account is not a business account"
- **Solución**: Convierte tu cuenta a Business en Instagram → Configuración → Cuenta → Cambiar a cuenta profesional

### Error: "The Instagram user must be linked to a Facebook Page"
- **Solución**: Conecta Instagram a tu página en: Página FB → Configuración → Instagram

### Posts no se publican automáticamente
- **Verifica**:
  ```powershell
  docker-compose logs -f beat
  docker-compose logs -f worker
  ```
- **Reinicia servicios**:
  ```powershell
  docker-compose restart beat worker
  ```

---

## 📝 Checklist Final

Antes de producción:
- [ ] App en modo producción en Meta Developers
- [ ] Permisos aprobados por Meta
- [ ] Page Access Token de larga duración obtenido
- [ ] Instagram Business conectado a Facebook Page
- [ ] Variables `.env` configuradas correctamente
- [ ] Publicación de prueba exitosa
- [ ] Métricas recolectándose correctamente
- [ ] Celery Beat ejecutando tareas programadas

---

## 🎯 Próximos Pasos

¿Qué quieres hacer ahora?
1. **Solicitar revisión de la app** en Meta (para permisos avanzados)
2. **Configurar Telegram Bot** para notificaciones
3. **Implementar A/B testing** de contenido
4. **Dashboard de métricas en tiempo real**
5. **Multi-lenguaje** para mercados internacionales
