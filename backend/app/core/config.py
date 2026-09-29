from pydantic_settings import BaseSettings
from typing import Dict, Any

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

settings = Settings()
