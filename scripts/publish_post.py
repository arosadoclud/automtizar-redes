import requests
import sys
import json
import time

# Configuración
API_URL = "http://localhost:8000"
WORKSPACE_ID = "69b0ea6d49fee8a96660eb49"

# Paso 1: Login (necesitarás la contraseña real)
print("=== Login ===")
print("Por favor ingresa la contraseña del usuario andy@vitagloss.com")
password = input("Contraseña: ").strip()

try:
    login_response = requests.post(
        f"{API_URL}/api/auth/login",
        data={"username": "andy@vitagloss.com", "password": password}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Error de login: {login_response.text}")
        sys.exit(1)
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login exitoso\n")
    
    # Paso 2: Generar post
    print("=== Generando post ===")
    topic = input("Ingresa el tema del post (ej: 'Beneficios del colágeno'): ").strip()
    if not topic:
        topic = "Beneficios del colágeno para la piel"
    
    generate_response = requests.post(
        f"{API_URL}/api/content/{WORKSPACE_ID}/generate",
        params={"topic": topic},
        headers=headers
    )
    
    if generate_response.status_code != 200:
        print(f"❌ Error generando post: {generate_response.text}")
        sys.exit(1)
    
    post = generate_response.json()
    post_id = post["id"]
    
    print(f"✅ Post generado con ID: {post_id}")
    print(f"Contenido: {post['content']['text'][:100]}...")
    print()
    
    # Paso 3: Aprobar y publicar
    print("=== Publicando post ===")
    confirm = input("¿Publicar este post? (s/n): ").strip().lower()
    
    if confirm == 's':
        approve_response = requests.post(
            f"{API_URL}/api/content/{WORKSPACE_ID}/posts/{post_id}/approve",
            params={"publish_now": True},
            headers=headers
        )
        
        if approve_response.status_code != 200:
            print(f"❌ Error publicando: {approve_response.text}")
            sys.exit(1)
        
        result = approve_response.json()
        print("\n✅ POST PUBLICADO CON ÉXITO")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("❌ Publicación cancelada")
        
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
