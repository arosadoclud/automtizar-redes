import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routes import workspaces, content, webhook, stream
from api.routes.auth import router as auth_router, get_current_user

app = FastAPI(title="VitaGloss Social Hub API", version="2.0.0")

# CORS — restrict to frontend origin in production via env var
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:80,http://localhost"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated images statically (no auth needed for image URLs)
os.makedirs("generated_images", exist_ok=True)
app.mount("/images", StaticFiles(directory="generated_images"), name="images")

# Public routes
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(webhook.router, prefix="/api", tags=["webhook", "messenger"])

# Protected routes (require JWT Bearer token)
_auth = [Depends(get_current_user)]
app.include_router(workspaces.router, prefix="/api/workspaces", tags=["workspaces"], dependencies=_auth)
app.include_router(content.router,    prefix="/api/content",    tags=["content"],    dependencies=_auth)
app.include_router(stream.router,     prefix="/api",            tags=["stream"],     dependencies=_auth)


@app.get("/")
async def root():
    return {"status": "ok", "message": "VitaGloss Social Hub API v2.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

