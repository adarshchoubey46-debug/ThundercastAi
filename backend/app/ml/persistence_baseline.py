from typing import List
from app.schemas.weather import (
    AtmosphericObservation,
    HorizonPrediction,
    RiskLevel
)
from app.core.config import settings

class PersistenceBaselineNowcaster:
    """
    Persistence Baseline Model (P_{t+dt} = P_t).
    Assumes current weather state persists with temporal decay uncertainty.
    Used as the mandatory benchmark to evaluate ML model improvement.
    """
    
    @staticmethod
    def _classify_risk(prob: float) -> RiskLevel:
        thresholds = settings.RISK_THRESHOLDS
        if prob < thresholds["LOW_MAX"]:
            return RiskLevel.LOW
        elif prob < thresholds["MODERATE_MAX"]:
            return RiskLevel.MODERATE
        elif prob < thresholds["HIGH_MAX"]:
            return RiskLevel.HIGH
        else:
            return RiskLevel.SEVERE

    def predict(self, obs: AtmosphericObservation) -> List[HorizonPrediction]:
        # Estimate current base probabilities from observation reflectivity & rainfall
        dbz = obs.radar_reflectivity_dbz or 0.0
        rain = obs.rainfall_mm_hr or 0.0
        lightning = obs.lightning_flashes_count or 0
        
        # Base probability calculation at t=0
        base_thunder = min(100.0, (dbz / 55.0 * 60.0) + (rain / 50.0 * 40.0))
        base_lightning = min(100.0, (lightning * 15.0) + (dbz / 60.0 * 50.0))
        base_rain = min(100.0, (rain / 40.0 * 80.0) + (dbz / 50.0 * 20.0))
        
        predictions = []
        for horizon in [15, 30, 45, 60]:
            # Persistence decays over longer lead times
            decay_factor = 1.0 - ((horizon - 15) * 0.012)
            
            p_thunder = round(max(0.0, min(100.0, base_thunder * decay_factor)), 1)
            p_lightning = round(max(0.0, min(100.0, base_lightning * decay_factor)), 1)
            p_rain = round(max(0.0, min(100.0, base_rain * decay_factor)), 1)
            
            max_prob = max(p_thunder, p_lightning, p_rain)
            confidence = round(max(0.40, 0.90 - (horizon * 0.008)), 2)
            
            predictions.append(HorizonPrediction(
                horizon_minutes=horizon,
                thunderstorm_probability=p_thunder,
                lightning_probability=p_lightning,
                heavy_rain_probability=p_rain,
                risk_level=self._classify_risk(max_prob),
                confidence_score=confidence
            ))
            
        return predictions
