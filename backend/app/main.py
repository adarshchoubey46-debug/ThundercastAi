from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="ThunderCast AI - Advanced Thunderstorm & Lightning Nowcasting Platform"
)

# Enable CORS for local Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://thundercast-ai.vercel.app",  # apna actual Vercel URL
],  # For hackathon/demo local environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to ThunderCast AI API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "disclaimer": settings.DEMO_DATA_DISCLAIMER
    }
