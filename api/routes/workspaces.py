from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.social_automation

class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    niches: List[str]
    mode: str = "human_review"
    review_timeout_hours: int = 4
    daily_post_goal: int = 3

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    niches: List[str]
    mode: str
    review_timeout_hours: int
    daily_post_goal: int
    created_at: str

@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(workspace: WorkspaceCreate):
    """Crear un nuevo workspace"""
    workspace_doc = {
        **workspace.dict(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    result = await db.workspaces.insert_one(workspace_doc)
    workspace_doc["id"] = str(result.inserted_id)
    workspace_doc.pop("_id", None)
    
    return workspace_doc

@router.get("/", response_model=List[WorkspaceResponse])
async def list_workspaces():
    """Listar todos los workspaces"""
    workspaces = []
    async for workspace in db.workspaces.find():
        workspace["id"] = str(workspace.pop("_id"))
        workspaces.append(workspace)
    return workspaces

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: str):
    """Obtener un workspace específico"""
    from bson import ObjectId
    workspace = await db.workspaces.find_one({"_id": ObjectId(workspace_id)})
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    workspace["id"] = str(workspace.pop("_id"))
    return workspace
