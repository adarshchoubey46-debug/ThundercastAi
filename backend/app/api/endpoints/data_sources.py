from fastapi import APIRouter
from typing import List
from app.schemas.weather import DataSourceStatus
from app.schemas.weather import DataPipelineHealth
from app.data.feed_health import get_data_feed_health, get_demo_feed_sources

router = APIRouter()


@router.get("/data-feed-health", response_model=DataPipelineHealth)
async def get_feed_health():
    return await get_data_feed_health()

@router.get("/data-sources", response_model=List[DataSourceStatus])
def get_data_sources():
    return [
        DataSourceStatus(
            source_id=source.source_id,
            source_name=source.source_name,
            type="; ".join(source.products),
            status=source.status,
            last_updated=source.last_update,
            latency_minutes=round(source.latency_ms / 60_000) if source.latency_ms is not None else None,
            data_freshness=source.confirmation,
            coverage_area=source.coverage_area,
        )
        for source in get_demo_feed_sources()
    ]
