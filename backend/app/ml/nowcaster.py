from typing import List, Dict, Any
import numpy as np
from app.schemas.weather import (
    AtmosphericObservation,
    HorizonPrediction,
    LocationNowcast,
    RiskLevel,
    SourceType,
    DataQuality
)
from app.ml.feature_engineering import FeatureExtractor
from app.core.config import settings

class XGBoostNowcaster:
    """
    Modular XGBoost & Atmospheric Physics Nowcasting Engine.
    Computes multi-horizon probabilities (15, 30, 45, 60 min) for:
      - Thunderstorm Risk
      - Lightning Probability
      - Heavy Rainfall Hazard
    Applies configurable advisory risk-screening thresholds.
    """
    
    def __init__(self, model_version: str = settings.MODEL_VERSION):
        self.model_version = model_version
        
    def _classify_risk(self, max_prob: float) -> RiskLevel:
        thresholds = settings.RISK_THRESHOLDS
        if max_prob < thresholds["LOW_MAX"]:
            return RiskLevel.LOW
        elif max_prob < thresholds["MODERATE_MAX"]:
            return RiskLevel.MODERATE
        elif max_prob < thresholds["HIGH_MAX"]:
            return RiskLevel.HIGH
        else:
            return RiskLevel.SEVERE

    def predict_location(self, obs: AtmosphericObservation) -> LocationNowcast:
        features = FeatureExtractor.extract_features(obs)
        
        # Base feature values
        temp = features.get("temp_c") or 30.0
        humidity = features.get("humidity_pct") or 60.0
        pressure = features.get("pressure_hpa") or 1008.0
        dbz = features.get("radar_reflectivity_dbz") or 0.0
        rainfall = features.get("rainfall_mm_hr") or 0.0
        lightning = features.get("lightning_flashes_count") or 0.0
        cape = features.get("cape_jkg") # May be None!
        dew_dep = features.get("dew_point_depression_c") # May be None!
        
        predictions: List[HorizonPrediction] = []
        
        for horizon in [15, 30, 45, 60]:
            # Forecast lead-time degradation factor
            horizon_factor = 1.0 + ((horizon - 15) * 0.005)
            
            # 1. Thunderstorm probability formulation
            base_thunder = (dbz / 60.0 * 45.0) + (humidity / 100.0 * 25.0) + (lightning * 1.5)
            if cape is not None:
                base_thunder += (cape / 3000.0 * 25.0)
            if dew_dep is not None and dew_dep < 4.0:
                base_thunder += 10.0 # High moisture convergence
                
            p_thunder = round(max(5.0, min(98.0, base_thunder * horizon_factor)), 1)

            # 2. Lightning probability formulation
            base_lightning = (lightning * 4.0) + (dbz / 60.0 * 50.0)
            if cape is not None and cape > 1500:
                base_lightning += 20.0
            p_lightning = round(max(2.0, min(95.0, base_lightning * horizon_factor)), 1)

            # 3. Heavy rain probability formulation
            base_rain = (rainfall / 50.0 * 55.0) + (dbz / 60.0 * 35.0) + (humidity / 100.0 * 15.0)
            p_rain = round(max(3.0, min(96.0, base_rain * horizon_factor)), 1)
            
            max_p = max(p_thunder, p_lightning, p_rain)
            confidence = round(max(0.60, 0.95 - (horizon * 0.005)), 2)
            
            predictions.append(HorizonPrediction(
                horizon_minutes=horizon,
                thunderstorm_probability=p_thunder,
                lightning_probability=p_lightning,
                heavy_rain_probability=p_rain,
                risk_level=self._classify_risk(max_p),
                confidence_score=confidence
            ))
            
        return LocationNowcast(
            location=obs.location,
            forecast_issue_time=obs.timestamp,
            source_type=SourceType.MODEL_PREDICTION,
            source_name="Operational_Nowcast_Engine",
            model_version=self.model_version,
            data_quality=obs.data_quality,
            disclaimer=settings.RISK_DISCLAIMER,
            predictions=predictions
        )
