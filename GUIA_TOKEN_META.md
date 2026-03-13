# 🔑 Guía Visual: Generar Token de Meta con Permisos Correctos

## Paso 1: Abrir Graph API Explorer

1. Ve a: **https://developers.facebook.com/tools/explorer/**
2. Verás una interfaz como esta:

```
┌─────────────────────────────────────────────────┐
│  Meta for Developers                            │
│  ┌───────────────────────────────┐              │
│  │ Graph API Explorer            │              │
│  └───────────────────────────────┘              │
│                                                  │
│  ┌──────────────┐  ┌─────────────────┐         │
│  │ Meta App ▼   │  │ User Token ▼    │         │
│  └──────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────┘
```

---

## Paso 2: Seleccionar tu App

1. **Click en el dropdown "Meta App"** (arriba a la izquierda)
2. **Busca y selecciona**: `VitaGloss RD Bot`

```
┌──────────────────────────┐
│ Meta App            [▼]  │
├──────────────────────────┤
│ □ My First App           │
│ ✓ VitaGloss RD Bot  ← SELECCIONAR
│ □ Test App               │
└──────────────────────────┘
```

---

## Paso 3: Seleccionar User Token

1. **Click en el dropdown "User Token"** (al lado derecho del anterior)
2. **Debe decir**: `User Token` o `Get User Access Token`

```
┌──────────────────────────┐
│ User Token          [▼]  │
├──────────────────────────┤
│ ○ App Token              │
│ ● User Token        ← SELECCIONAR
│ ○ Page Token             │
└──────────────────────────┘
```

---

## Paso 4: Generate Access Token

1. **Click en el botón azul**: `Generate Access Token`

```
┌────────────────────────────────┐
│                                │
│   [Generate Access Token]  ← CLICK AQUÍ
│                                │
└────────────────────────────────┘
```

---

## Paso 5: Marcar Permisos (CRÍTICO)

Se abrirá un popup con lista de permisos. **Busca y marca estos 6 permisos**:

### 📋 Permisos de Facebook Pages:
```
☑ pages_show_list            ← Marcar checkbox
☑ pages_read_engagement      ← Marcar checkbox  
☑ pages_manage_posts         ← Marcar checkbox
☑ pages_read_user_content    ← Marcar checkbox
```

### 📸 Permisos de Instagram:
```
☑ instagram_basic            ← Marcar checkbox
☑ instagram_content_publish  ← Marcar checkbox
```

**💡 TIP**: Usa el buscador del popup para encontrar cada permiso rápido:
```
┌─────────────────────────────────┐
│ 🔍 Search permissions...        │
│ ┌─────────────────────────────┐ │
│ │ pages_                      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ☑ pages_show_list              │ ← Marcar
│ ☑ pages_read_engagement        │
│ ☑ pages_manage_posts           │
│ ☐ pages_manage_metadata        │
│ ...                             │
└─────────────────────────────────┘
```

---

## Paso 6: Confirmar y Generar

1. Después de marcar los 6 permisos, **click en botón azul inferior**:
   - Puede decir: `Generate Access Token`
   - O: `Continue as Andy`

2. **Aparecerá popup de Facebook pidiendo confirmación**:
   - Click en **"Continuar como Andy Robinson"**
   - Puede pedir que selecciones qué páginas dar acceso → **Selecciona tu página**

---

## Paso 7: Copiar el Token

1. El token generado aparecerá en un campo de texto:

```
┌──────────────────────────────────────────────┐
│ Access Token                                 │
│ ┌──────────────────────────────────────────┐│
│ │ EAAxxxxxxxxxxxxxxxxxxxxx...  [📋 Copy]  ││ ← COPIAR
│ └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

2. **Click en el botón de copiar** o **selecciona todo el texto y Ctrl+C**

---

## Paso 8: Verificar Permisos

1. **Haz scroll hacia abajo** en la misma página
2. Busca el campo que dice: **GET** con una URL
3. **Cambia la URL a**: `me/permissions`
4. **Click en "Submit"**

Deberías ver una respuesta JSON con tus permisos:
```json
{
  "data": [
    {"permission": "pages_show_list", "status": "granted"},
    {"permission": "instagram_basic", "status": "granted"},
    ...
  ]
}
```

Si ves "granted" en los 6 permisos, **¡estás listo!** ✅

---

## Paso 9: Enviarme el Token

**Copia el token completo y envíamelo aquí en el chat.**

Ejemplo de cómo se ve:
```
EAAXBO8f7POYBQzXczXv5OZAGzTp9QBz...  (muy largo, ~200 caracteres)
```

Yo automáticamente:
1. ✅ Obtendré tu Page ID de Facebook
2. ✅ Obtendré tu Instagram Business Account ID
3. ✅ Actualizaré tu archivo `.env`
4. ✅ Reconstruiré los containers Docker
5. ✅ Lo probaré con una publicación de test

---

## ⚠️ Problemas Comunes

### "No veo algunos permisos en la lista"
- **Solución**: Tu app necesita agregar productos:
  1. Ve a https://developers.facebook.com/apps/
  2. Selecciona "VitaGloss RD Bot"
  3. Panel izquierdo → "Agregar productos"
  4. Agrega: **"Facebook Login"** y **"Instagram"**

### "Me dice que mi app no tiene acceso a IG"
- **Solución**: Conecta tu Instagram Business a tu Página de Facebook:
  1. Ve a tu Página de Facebook
  2. Configuración → Instagram
  3. Conectar cuenta

### "El token expira muy rápido"
- **Es normal**: Los tokens cortos duran ~1 hora
- **Solución**: Mi script los convierte automáticamente a tokens de 60 días

---

## 🎯 Resumen Rápido

1. Graph API Explorer → https://developers.facebook.com/tools/explorer/
2. Selecciona "VitaGloss RD Bot"
3. Generate Access Token
4. Marca 6 permisos (pages_show_list, pages_read_engagement, pages_manage_posts, pages_read_user_content, instagram_basic, instagram_content_publish)
5. Copiar token
6. Enviármelo aquí

**¡Una vez lo tengas, solo pégalo en el chat y yo hago el resto!** 🚀
