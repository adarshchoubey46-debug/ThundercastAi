from fastapi import APIRouter
from typing import List
from datetime import datetime
from app.schemas.weather import Alert, RiskLevel, SourceType
from app.core.config import settings

router = APIRouter()

@router.get("/alerts", response_model=List[Alert])
def get_alerts():
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    return [
        Alert(
            id="ALT-BPL-2026-001",
            risk_level=RiskLevel.SEVERE,
            title="Severe Thunderstorm & High-Frequency Lightning Warning",
            hazard_type="Severe Thunderstorm & Lightning",
            affected_area="Bhopal Urban, MP Nagar & Upper Lake District",
            issue_time=now_str,
            expected_window="Next 15 to 45 minutes",
            explanation="Convective radar reflectivity exceeds 52 dBZ with high lightning frequency.",
            trigger_factors=[
                "Radar Reflectivity > 50 dBZ",
                "Lightning Frequency > 30 strikes/15 min",
                "Surface Moisture Convergence (Dew point depression < 3°C)"
            ],
            is_demo=True,
            source_type=SourceType.MODEL_PREDICTION
        ),
        Alert(
            id="ALT-BPL-2026-002",
            risk_level=RiskLevel.HIGH,
            title="Heavy Rainfall Hazard Warning",
            hazard_type="Heavy Rainfall / Urban Inundation",
            affected_area="Kolar Road & Mandideep Industrial Area",
            issue_time=now_str,
            expected_window="Next 30 to 60 minutes",
            explanation="Precipitation rate estimated above 45 mm/hr over low-lying catchment zones.",
            trigger_factors=[
                "Precipitation Rate > 40 mm/hr",
                "Monsoon Wind Convergence"
            ],
            is_demo=True,
            source_type=SourceType.MODEL_PREDICTION
        )
    ]
