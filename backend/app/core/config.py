from pydantic_settings import BaseSettings
import os
from typing import Dict, Any


def _positive_int(name: str, default: int) -> int:
    try:
        return max(1, int(os.getenv(name, str(default))))
    except ValueError:
        return default

class Settings:
    PROJECT_NAME: str = "MeghDoot"
    API_V1_STR: str = "/api"
    MODEL_VERSION: str = "nowcast_engine_v1.0"
    
    # Regional Focus Configuration (Default: Bhopal, MP, India)
    DEFAULT_LOCATION_NAME: str = "Bhopal, Madhya Pradesh"
    DEFAULT_LATITUDE: float = 23.2599
    DEFAULT_LONGITUDE: float = 77.4126
    
    RISK_THRESHOLDS: Dict[str, float] = {
        "LOW_MAX": 30.0,
        "MODERATE_MAX": 60.0,
        "HIGH_MAX": 80.0,
        # Severe is > 80.0
    }
    
    RISK_DISCLAIMER: str = ""
    DATA_PROVENANCE_DISCLAIMER: str = ""
    FRESH_THRESHOLD_SECONDS: int = _positive_int("DATA_HEALTH_FRESH_THRESHOLD_SECONDS", 180)
    STALE_THRESHOLD_SECONDS: int = _positive_int("DATA_HEALTH_STALE_THRESHOLD_SECONDS", 900)
    OFFLINE_THRESHOLD_SECONDS: int = _positive_int("DATA_HEALTH_OFFLINE_THRESHOLD_SECONDS", 1800)

    DATA_FEED_METADATA = [
        {
            "source_id": "DS_IMD_RADAR_BPL",
            "source_name": "IMD Bhopal Doppler Weather Radar",
            "kind": "radar",
            "coverage_area": "Bhopal and surrounding region",
            "products": [
                "Reflectivity (simulated)", "Rainfall intensity (simulated)",
                "Velocity not provided", "Precipitation accumulation not provided",
            ],
        },
        {
            "source_id": "DS_MOSDAC_INSAT3D",
            "source_name": "MOSDAC INSAT-3DR",
            "kind": "satellite",
            "coverage_area": "Central India",
            "products": [
                "Cloud imagery (not connected)", "Rainfall (not connected)",
                "Water vapour (not connected)", "Cloud/weather monitoring (not connected)",
            ],
        },
        {
            "source_id": "DS_IMD_AWS_NETWORK",
            "source_name": "IMD Automatic Weather Station (AWS)",
            "kind": "aws",
            "coverage_area": "Bhopal demo stations",
            "products": [
                "Temperature (simulated)", "Relative humidity (simulated)", "Wind (simulated)",
                "Atmospheric pressure (simulated)", "Rainfall (simulated)",
            ],
        },
        {
            "source_id": "DS_IITM_LIGHTNING_NET",
            "source_name": "IITM DAMINI Lightning Data",
            "kind": "lightning",
            "coverage_area": "Bhopal demo stations",
            "products": [
                "Lightning activity (simulated)", "Strike count (simulated)",
                "Strike locations not provided by simulator",
            ],
        },
    ]

settings = Settings()
