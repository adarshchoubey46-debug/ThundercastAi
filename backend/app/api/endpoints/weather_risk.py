from fastapi import APIRouter, Query

from app.core.config import settings
from app.data.weather_risk import get_weather_risk

router = APIRouter()


@router.get("/weather-risk")
async def get_hourly_weather_risk(
    latitude: float = Query(settings.DEFAULT_LATITUDE, ge=-90, le=90),
    longitude: float = Query(settings.DEFAULT_LONGITUDE, ge=-180, le=180),
):
    return await get_weather_risk(latitude, longitude)