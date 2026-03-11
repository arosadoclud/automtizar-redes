from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import workspaces, content

app = FastAPI(title="Social Automation API", version="1.0.0")

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

@app.get("/")
async def root():
    return {"status": "ok", "message": "Social Automation API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
