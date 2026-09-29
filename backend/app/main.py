from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="MeghDoot - Regional Severe Weather Early-Warning Platform"
)

# Enable CORS for local Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://thundercast-ai.vercel.app",  # apna actual Vercel URL
],  # Local development and deployed frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to MeghDoot API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "disclaimer": settings.DATA_PROVENANCE_DISCLAIMER
    }
