"""
Script para publicar un post rápidamente desde línea de comandos
Uso: python scripts/quick_publish.py "Tema del post"
"""
import requests
import sys
import json

API_URL = "http://localhost:8000"
WORKSPACE_ID = "69b0ea6d49fee8a96660eb49"

# Credenciales - cambiar si es necesario
EMAIL = "andy@vitagloss.com"
PASSWORD = "Admin2026!"  # Cambiar por la contraseña real

def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python scripts/quick_publish.py 'Tema del post'")
        print("Ejemplo: python scripts/quick_publish.py 'Beneficios del colágeno para la piel'")
        sys.exit(1)
    
    topic = sys.argv[1]
    
    print(f"🚀 Publicando post sobre: {topic}\n")
    
    # 1. Login
    print("1️⃣ Autenticando...")
    try:
        login_response = requests.post(
            f"{API_URL}/api/auth/login",
            data={"username": EMAIL, "password": PASSWORD},
            timeout=10
        )
        
        if login_response.status_code != 200:
            print(f"❌ Error de login: {login_response.text}")
            print("\n💡 Ejecuta este comando para crear/resetear la contraseña:")
            print(f'   docker-compose exec api python scripts/create_admin.py "Andy" {EMAIL} TuNuevaContraseña')
            sys.exit(1)
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   ✅ Autenticado\n")
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        print("💡 Verifica que Docker esté corriendo: docker-compose ps")
        sys.exit(1)
    
    # 2. Generar post
    print(f"2️⃣ Generando post con IA...")
    try:
        generate_response = requests.post(
            f"{API_URL}/api/content/{WORKSPACE_ID}/generate",
            params={"topic": topic},
            headers=headers,
            timeout=60
        )
        
        if generate_response.status_code != 200:
            print(f"❌ Error generando post: {generate_response.text}")
            sys.exit(1)
        
        post = generate_response.json()
        post_id = post["id"]
        
        print("   ✅ Post generado")
        print(f"\n📝 Contenido:")
        print(f"   {post['content']['text'][:200]}...")
        print(f"\n🔖 Hashtags: {' '.join(post['content'].get('hashtags', []))}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    
    # 3. Publicar
    print("3️⃣ Publicando en Facebook e Instagram...")
    try:
        approve_response = requests.post(
            f"{API_URL}/api/content/{WORKSPACE_ID}/posts/{post_id}/approve",
            params={"publish_now": True},
            headers=headers,
            timeout=60
        )
        
        if approve_response.status_code != 200:
            print(f"❌ Error publicando: {approve_response.text}")
            sys.exit(1)
        
        result = approve_response.json()
        
        if result.get("published"):
            print("   ✅ PUBLICADO CON ÉXITO\n")
            
            publish_results = result.get("publish_results", {})
            
            if "facebook" in publish_results:
                fb = publish_results["facebook"]
                if fb.get("success"):
                    print(f"   📘 Facebook: https://facebook.com/{fb.get('post_id')}")
                else:
                    print(f"   ⚠️  Facebook: {fb.get('error', 'Error desconocido')}")
            
            if "instagram" in publish_results:
                ig = publish_results["instagram"]
                if ig.get("success"):
                    print(f"   📷 Instagram: Publicado (ID: {ig.get('post_id')})")
                else:
                    print(f"   ⚠️  Instagram: {ig.get('error', 'Error desconocido')}")
        else:
            error = result.get("publish_error", "Error desconocido")
            print(f"   ❌ Error: {error}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
