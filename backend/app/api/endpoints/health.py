from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "model_version": settings.MODEL_VERSION,
        "default_region": settings.DEFAULT_LOCATION_NAME,
        "disclaimer": settings.DATA_PROVENANCE_DISCLAIMER
    }
