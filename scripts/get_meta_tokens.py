"""
Script para obtener tokens de acceso de Meta (Facebook/Instagram)

INSTRUCCIONES:
1. Ve a: https://developers.facebook.com/tools/explorer/
2. Selecciona tu app "VitaGloss RD Bot"
3. Solicita estos permisos:
   - pages_show_list
   - pages_read_engagement
   - pages_manage_posts
   - instagram_basic
   - instagram_content_publish
   - pages_read_user_content

4. Genera el token
5. Ejecuta este script con el token generado
"""

import httpx
import sys

def get_long_lived_token(short_token, app_id, app_secret):
    """Convierte token de corta duración a larga duración (60 días)"""
    url = "https://graph.facebook.com/v18.0/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token
    }
    
    with httpx.Client() as client:
        response = client.get(url, params=params)
        data = response.json()
    
    if "access_token" in data:
        return data["access_token"]
    else:
        print(f"❌ Error: {data}")
        return None

def get_pages(token):
    """Obtiene las páginas administradas por el usuario"""
    url = "https://graph.facebook.com/v18.0/me/accounts"
    params = {"access_token": token}
    
    with httpx.Client() as client:
        response = client.get(url, params=params)
        data = response.json()
    
    if "data" in data:
        return data["data"]
    else:
        print(f"❌ Error: {data}")
        return []

def get_instagram_account(page_id, page_token):
    """Obtiene la cuenta de Instagram conectada a la página"""
    url = f"https://graph.facebook.com/v18.0/{page_id}"
    params = {
        "fields": "instagram_business_account",
        "access_token": page_token
    }
    
    with httpx.Client() as client:
        response = client.get(url, params=params)
        data = response.json()
    
    return data.get("instagram_business_account", {}).get("id")

def main():
    print("🔐 META TOKENS CONFIGURATOR")
    print("=" * 60)
    
    # Solicitar datos
    app_id = input("\n📱 App ID de VitaGloss RD Bot: ").strip()
    app_secret = input("🔑 App Secret: ").strip()
    short_token = input("⏱️  Token de corta duración (del Graph API Explorer): ").strip()
    
    print("\n⚙️  Procesando...\n")
    
    # Paso 1: Convertir a token de larga duración
    print("1️⃣  Convirtiendo a token de larga duración...")
    long_token = get_long_lived_token(short_token, app_id, app_secret)
    
    if not long_token:
        print("❌ No se pudo obtener el token de larga duración")
        return
    
    print("✅ Token de larga duración obtenido")
    
    # Paso 2: Obtener páginas
    print("\n2️⃣  Obteniendo tus páginas de Facebook...")
    pages = get_pages(long_token)
    
    if not pages:
        print("❌ No se encontraron páginas")
        return
    
    print(f"✅ Se encontraron {len(pages)} página(s):\n")
    for i, page in enumerate(pages, 1):
        print(f"   {i}. {page['name']} (ID: {page['id']})")
    
    # Seleccionar página
    if len(pages) == 1:
        selected_page = pages[0]
        print(f"\n✅ Usando: {selected_page['name']}")
    else:
        selection = int(input("\n📄 Selecciona el número de página: ")) - 1
        selected_page = pages[selection]
    
    page_id = selected_page["id"]
    page_token = selected_page["access_token"]
    
    # Paso 3: Obtener Instagram Business Account
    print("\n3️⃣  Obteniendo cuenta de Instagram...")
    ig_account_id = get_instagram_account(page_id, page_token)
    
    if ig_account_id:
        print(f"✅ Instagram Business Account ID: {ig_account_id}")
    else:
        print("⚠️  No se encontró cuenta de Instagram conectada")
        print("   Conecta tu cuenta en: Configuración de Página → Instagram")
    
    # Mostrar resumen
    print("\n" + "=" * 60)
    print("📋 CONFIGURACIÓN COMPLETA")
    print("=" * 60)
    print("\nAgrega estas variables a tu archivo .env:\n")
    print(f"FACEBOOK_PAGE_ID={page_id}")
    print(f"FACEBOOK_ACCESS_TOKEN={page_token}")
    if ig_account_id:
        print(f"INSTAGRAM_BUSINESS_ACCOUNT_ID={ig_account_id}")
        print(f"INSTAGRAM_ACCESS_TOKEN={page_token}")
    print("\n⚠️  IMPORTANTE: El Page Access Token nunca expira si la app")
    print("   está en modo producción y tiene permisos aprobados.")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelado por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
