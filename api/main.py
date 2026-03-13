from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import workspaces, content, webhook

app = FastAPI(title="Social Automation API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workspaces.router, prefix="/api/workspaces", tags=["workspaces"])
app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(webhook.router, prefix="/api", tags=["webhook", "messenger"])

@app.get("/")
async def root():
    return {"status": "ok", "message": "Social Automation API v2.0 - VitaGloss RD"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
