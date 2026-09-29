import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="MeghDoot - Regional Severe Weather Early-Warning Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
def get_health_status():
    return {"status": "ok"}

@app.get("/")
def root():
    return {
        "message": "Welcome to MeghDoot API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "disclaimer": settings.DATA_PROVENANCE_DISCLAIMER
    }
