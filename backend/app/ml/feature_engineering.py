import math
from typing import Dict, Any, Optional
from app.schemas.weather import AtmosphericObservation

class FeatureExtractor:
    """
    Extracts meteorological features for the Nowcasting model.
    STRICT RULE: Never fabricate missing meteorological variables.
    If required sensors/inputs are absent, return explicit null/unavailable states.
    """
    
    @staticmethod
    def extract_features(obs: AtmosphericObservation) -> Dict[str, Optional[float]]:
        features = {}
        
        # 1. Temperature & Humidity Features
        features["temp_c"] = obs.temperature_c
        features["humidity_pct"] = obs.humidity_pct
        features["pressure_hpa"] = obs.pressure_hpa
        
        # Dew Point Depression (T - Td) - ONLY calculated if both exist
        if obs.temperature_c is not None and obs.dew_point_c is not None:
            features["dew_point_depression_c"] = round(obs.temperature_c - obs.dew_point_c, 2)
        else:
            features["dew_point_depression_c"] = None
            
        # 2. Radar Reflectivity (dBZ)
        features["radar_reflectivity_dbz"] = obs.radar_reflectivity_dbz
        
        # Reflectivity Gradient / High intensity threshold (> 40 dBZ indicates severe convection)
        if obs.radar_reflectivity_dbz is not None:
            features["is_severe_reflectivity"] = 1.0 if obs.radar_reflectivity_dbz >= 40.0 else 0.0
        else:
            features["is_severe_reflectivity"] = None

        # 3. Wind Features
        features["wind_speed_kmh"] = obs.wind_speed_kmh
        features["wind_dir_deg"] = obs.wind_direction_deg
        
        # Wind vector components (u, v) - ONLY calculated if wind speed and direction exist
        if obs.wind_speed_kmh is not None and obs.wind_direction_deg is not None:
            rad = math.radians(obs.wind_direction_deg)
            features["wind_u"] = round(-obs.wind_speed_kmh * math.sin(rad), 2)
            features["wind_v"] = round(-obs.wind_speed_kmh * math.cos(rad), 2)
        else:
            features["wind_u"] = None
            features["wind_v"] = None
            
        # 4. Thermodynamic Instability Indices (CAPE & K-Index)
        # Returned ONLY if present in input observation, NEVER fabricated!
        features["cape_jkg"] = obs.cape_jkg
        features["k_index"] = obs.k_index
        
        # 5. Lightning & Rainfall Rate
        features["rainfall_mm_hr"] = obs.rainfall_mm_hr
        features["lightning_flashes_count"] = float(obs.lightning_flashes_count)
        
        return features
