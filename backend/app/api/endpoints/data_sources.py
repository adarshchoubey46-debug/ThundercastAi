from fastapi import APIRouter
from typing import List
from datetime import datetime
from app.schemas.weather import DataSourceStatus
from app.core.config import settings

router = APIRouter()

@router.get("/data-sources", response_model=List[DataSourceStatus])
def get_data_sources():
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    return [
        DataSourceStatus(
            source_id="DS_IMD_RADAR_BPL",
            source_name="IMD Bhopal Doppler Weather Radar (S-Band)",
            type="Doppler Weather Radar (Reflectivity & Velocity)",
            status="DEMO_MODE",
            last_updated=now_str,
            latency_minutes=3,
            data_freshness="Operational (Synthetic Stream)",
            coverage_area="150 km Radius centered on Bhopal (23.2599°N, 77.4126°E)",
            is_demo=True
        ),
        DataSourceStatus(
            source_id="DS_MOSDAC_INSAT3D",
            source_name="MOSDAC INSAT-3DR Rapid-Scan Satellite",
            type="Thermal Infrared & Water Vapor Channels",
            status="DEMO_MODE",
            last_updated=now_str,
            latency_minutes=12,
            data_freshness="Operational (Synthetic Stream)",
            coverage_area="Central India Region",
            is_demo=True
        ),
        DataSourceStatus(
            source_id="DS_IMD_AWS_NETWORK",
            source_name="IMD Automatic Weather Station (AWS) Network",
            type="Ground Telemetry (Temp, Pressure, Humidity, Rain Gauge)",
            status="OPERATIONAL",
            last_updated=now_str,
            latency_minutes=5,
            data_freshness="Operational (Live Simulator)",
            coverage_area="6 Ground Stations across Bhopal District",
            is_demo=True
        ),
        DataSourceStatus(
            source_id="DS_IITM_LIGHTNING_NET",
            source_name="IITM Damini Lightning Detection Network",
            type="VLF/LF Lightning Stroke Sensors",
            status="OPERATIONAL",
            last_updated=now_str,
            latency_minutes=1,
            data_freshness="Real-Time Feed",
            coverage_area="Madhya Pradesh Corridor",
            is_demo=True
        )
    ]
