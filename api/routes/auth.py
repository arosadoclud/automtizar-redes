from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from api.services.auth_service import (
    verify_password,
    create_access_token,
    decode_token,
    get_password_hash,
)

router = APIRouter()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
_client = AsyncIOMotorClient(MONGO_URL)
db = _client.social_automation

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Dependency ─────────────────────────────────────────────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = await db.users.find_one({"email": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


async def require_admin(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return current_user


# ── Schemas ────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "agent"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.users.find_one({"email": form_data.username.lower().strip()})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user["email"], "role": user.get("role", "agent")})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "agent"),
        },
    }


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user.get("role", "agent"),
    }


@router.post("/register")
async def register_user(user_data: UserCreate, _admin=Depends(require_admin)):
    """Create a new team member (admin only)."""
    email = user_data.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    doc = {
        "name": user_data.name,
        "email": email,
        "hashed_password": get_password_hash(user_data.password),
        "role": user_data.role if user_data.role in ("admin", "agent") else "agent",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.users.insert_one(doc)
    return {"message": "Usuario creado exitosamente", "id": str(result.inserted_id), "email": email}


@router.get("/users", response_model=List[UserResponse])
async def list_users(_admin=Depends(require_admin)):
    """List all team users (admin only)."""
    users = []
    async for u in db.users.find({}, {"hashed_password": 0}):
        users.append({
            "id": str(u.pop("_id")),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "role": u.get("role", "agent"),
            "created_at": u.get("created_at", ""),
        })
    return users


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_admin=Depends(require_admin)):
    """Delete a team user (admin only, cannot delete self)."""
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")

    target = await db.users.find_one({"_id": oid})
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target["email"] == current_admin["email"]:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

    await db.users.delete_one({"_id": oid})
    return {"message": "Usuario eliminado"}
