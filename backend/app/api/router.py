from fastapi import APIRouter
from app.api.endpoints import (
    health,
    observations,
    nowcast,
    alerts,
    history,
    model,
    data_sources,
    forecast,
    assistant
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(observations.router, tags=["Observations"])
api_router.include_router(nowcast.router, tags=["Nowcast"])
api_router.include_router(alerts.router, tags=["Alerts"])
api_router.include_router(history.router, tags=["History"])
api_router.include_router(model.router, tags=["Model Metrics"])
api_router.include_router(data_sources.router, tags=["Data Sources"])
api_router.include_router(forecast.router, tags=["Forecast"])
api_router.include_router(assistant.router, tags=["Assistant"])
