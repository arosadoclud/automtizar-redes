import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.social_automation
    
    print("\n=== Workspaces disponibles ===")
    workspaces = await db.workspaces.find().to_list(100)
    if workspaces:
        for w in workspaces:
            print(f"ID: {w['_id']}")
            print(f"Nombre: {w['name']}")
            print(f"---")
    else:
        print("No hay workspaces creados")
    
    print("\n=== Posts pendientes ===")
    posts = await db.posts.find({"status": "pending_review"}).to_list(10)
    if posts:
        for p in posts:
            print(f"ID: {p['_id']}")
            print(f"Topic: {p.get('topic', 'N/A')}")
            print(f"Status: {p.get('status', 'N/A')}")
            print(f"---")
    else:
        print("No hay posts pendientes")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(main())
