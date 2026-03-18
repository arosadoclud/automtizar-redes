#!/usr/bin/env python3
"""
Crea el primer usuario administrador en MongoDB.

Uso:
  python scripts/create_admin.py "Nombre Completo" admin@vitagloss.com MiContraseña123

Requiere que MongoDB esté corriendo (docker-compose up mongo -d)
y que MONGO_URL esté en el entorno o sea la URL por defecto.
"""

import asyncio
import sys
import os

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from api.services.auth_service import get_password_hash
from datetime import datetime


async def create_admin(name: str, email: str, password: str) -> None:
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.social_automation

    email = email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"❌  El usuario '{email}' ya existe.")
        client.close()
        return

    doc = {
        "name": name,
        "email": email,
        "hashed_password": get_password_hash(password),
        "role": "admin",
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.users.insert_one(doc)
    print(f"✅  Admin creado exitosamente")
    print(f"    Nombre : {name}")
    print(f"    Email  : {email}")
    print(f"    Rol    : admin")
    client.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    asyncio.run(create_admin(sys.argv[1], sys.argv[2], sys.argv[3]))
