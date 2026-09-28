from pydantic_settings import BaseSettings
from typing import Dict, Any

class Settings:
    PROJECT_NAME: str = "ThunderCast AI"
    API_V1_STR: str = "/api"
    MODEL_VERSION: str = "xgboost_baseline_v1.0"
    
    # Regional Focus Configuration (Default: Bhopal, MP, India)
    DEFAULT_LOCATION_NAME: str = "Bhopal, Madhya Pradesh"
    DEFAULT_LATITUDE: float = 23.2599
    DEFAULT_LONGITUDE: float = 77.4126
    
    # Risk Thresholds (%) - Prototype visualization thresholds
    # Labeled explicitly as prototype thresholds, not official warnings.
    RISK_THRESHOLDS: Dict[str, float] = {
        "LOW_MAX": 30.0,
        "MODERATE_MAX": 60.0,
        "HIGH_MAX": 80.0,
        # Severe is > 80.0
    }
    
    RISK_DISCLAIMER: str = (
        "Prototype risk thresholds — not official government warnings. "
        "For emergency advisories, consult the India Meteorological Department (IMD)."
    )
    
    DEMO_DATA_DISCLAIMER: str = (
        "DEMO / SYNTHETIC DATA — NOT A REAL-WORLD VALIDATION. "
        "Outputs are for pipeline demonstration and software testing purposes only."
    )

settings = Settings()
