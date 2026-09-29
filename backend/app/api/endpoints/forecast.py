import httpx
import logging
from fastapi import APIRouter, HTTPException, Query

from app.schemas.weather import OpenMeteoForecast

router = APIRouter()
logger = logging.getLogger(__name__)
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
HOURLY_VARIABLES = (
    "temperature_2m,dew_point_2m,precipitation,wind_speed_10m,"
    "wind_direction_10m,cape,lifted_index,cloud_cover,weather_code"
)


@router.get("/forecast", response_model=OpenMeteoForecast)
async def get_forecast(
    lat: float = Query(23.2599, ge=-90, le=90),
    lon: float = Query(77.4126, ge=-180, le=180),
    hours: int = Query(6, ge=1, le=24),
) -> OpenMeteoForecast:
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": HOURLY_VARIABLES,
        "forecast_hours": hours,
        "timezone": "UTC",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(OPEN_METEO_FORECAST_URL, params=params)
            response.raise_for_status()
            return OpenMeteoForecast.model_validate(response.json())
    except httpx.HTTPError as error:
        print(f"Open-Meteo forecast request failed: {error}", flush=True)
        raise HTTPException(
            status_code=502,
            detail="Open-Meteo forecast request failed. Please retry shortly.",
        ) from error
    except Exception as error:
        logger.exception("Open-Meteo returned an invalid forecast response")
        raise HTTPException(
            status_code=502,
            detail="Open-Meteo returned an invalid forecast response. Please retry shortly.",
        ) from error