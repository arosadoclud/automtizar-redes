"""
Actualizar contraseña de usuario existente
"""
import sys
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from api.services.auth_service import get_password_hash

async def update_password(email: str, new_password: str):
    mongo_url = os.getenv("MONGO_URL", "mongodb://mongo:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.social_automation
    
    # Buscar usuario
    user = await db.users.find_one({"email": email.lower().strip()})
    
    if not user:
        print(f"❌ Usuario '{email}' no encontrado")
        await client.close()
        return False
    
    # Actualizar contraseña
    hashed = get_password_hash(new_password)
    result = await db.users.update_one(
        {"email": email.lower().strip()},
        {"$set": {"hashed_password": hashed}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Contraseña actualizada para '{email}'")
        print(f"   Nueva contraseña: {new_password}")
        await client.close()
        return True
    else:
        print(f"⚠️  No se pudo actualizar la contraseña")
        await client.close()
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python scripts/update_password.py <email> <nueva_contraseña>")
        print("Ejemplo: python scripts/update_password.py andy@vitagloss.com Admin2026!")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    asyncio.run(update_password(email, password))
