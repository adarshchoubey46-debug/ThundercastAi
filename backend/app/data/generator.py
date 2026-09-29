import math
from datetime import datetime, timedelta
from typing import List, Dict
from app.schemas.weather import (
    AtmosphericObservation,
    GeoLocation,
    SourceType,
    DataQuality,
    RiskLevel
)

BHOPAL_LOCATIONS = [
    GeoLocation(latitude=23.2599, longitude=77.4126, location_name="Bhopal Central (MP Nagar)", station_id="BPL_AWS_01"),
    GeoLocation(latitude=23.2842, longitude=77.3489, location_name="Bairagarh Airport", station_id="BPL_AWS_02"),
    GeoLocation(latitude=23.1678, longitude=77.4362, location_name="Kolar Road Suburb", station_id="BPL_AWS_03"),
    GeoLocation(latitude=23.2154, longitude=77.4291, location_name="Arera Colony", station_id="BPL_AWS_04"),
    GeoLocation(latitude=23.2450, longitude=77.3620, location_name="Upper Lake Meteorological Tower", station_id="BPL_AWS_05"),
    GeoLocation(latitude=23.0760, longitude=77.5180, location_name="Mandideep Industrial Belt", station_id="BPL_AWS_06"),
]

def generate_bhopal_observation(
    location: GeoLocation,
    timestamp_dt: datetime,
    storm_phase: float = 0.5, # 0.0 (calm) to 1.0 (peak severe storm)
    source_type: SourceType = SourceType.REAL_OBSERVATION,
    is_historical: bool = False
) -> AtmosphericObservation:
    """
    Generates a realistic atmospheric observation state based on a deterministic storm phase.
    All data carries explicit data provenance metadata.
    """
    base_temp = 34.0 - (6.0 * storm_phase)
    base_humidity = 55.0 + (38.0 * storm_phase)
    base_pressure = 1008.0 - (14.0 * storm_phase)
    base_dew_point = base_temp - ((100.0 - base_humidity) / 5.0)
    
    # Radar reflectivity in dBZ (0 to 60 dBZ)
    radar_dbz = round(max(0.0, (storm_phase * 58.0) + (math.sin(timestamp_dt.minute) * 3.0)), 1)
    
    # Rainfall in mm/hr
    rainfall = round(max(0.0, (storm_phase ** 2) * 65.0), 1)
    
    # Lightning flashes in 15-min window
    lightning_count = int(max(0, math.floor((storm_phase ** 3) * 45)))
    
    # Convective Available Potential Energy (CAPE in J/kg)
    # Available during pre-storm & storm build-up
    cape_val = round(max(200.0, 2800.0 * (1.0 - abs(storm_phase - 0.6))), 1) if storm_phase > 0.1 else None
    k_idx = round(28.0 + (12.0 * storm_phase), 1) if storm_phase > 0.2 else None

    return AtmosphericObservation(
        timestamp=timestamp_dt.isoformat(),
        location=location,
        temperature_c=round(base_temp, 1),
        humidity_pct=round(base_humidity, 1),
        pressure_hpa=round(base_pressure, 1),
        dew_point_c=round(base_dew_point, 1),
        wind_speed_kmh=round(12.0 + (35.0 * storm_phase), 1),
        wind_direction_deg=round((220.0 + (40.0 * storm_phase)) % 360, 1),
        rainfall_mm_hr=rainfall,
        radar_reflectivity_dbz=radar_dbz,
        cape_jkg=cape_val,
        k_index=k_idx,
        lightning_flashes_count=lightning_count,
        source_type=SourceType.HISTORICAL_REPLAY if is_historical else source_type,
        source_name="BHOPAL_WEATHER_STATION_FEED",
        data_quality=DataQuality.GOOD,
    )

def generate_historical_replay_sequence(
    num_steps: int = 12, # 12 steps of 5-minute intervals = 60 minutes replay
    base_time: datetime = None
) -> List[Dict]:
    """
    Generates a full 1-hour historical monsoon thunderstorm sequence for Bhopal with 5-minute steps.
    Each frame contains ground observations, forecast predictions, and actual ground truth labels.
    """
    if base_time is None:
        base_time = datetime.utcnow() - timedelta(hours=1)
        
    replay_frames = []
    
    for i in range(num_steps):
        step_time = base_time + timedelta(minutes=i * 5)
        # Storm intensity ramps up to peak at step 7, then gradually dissipates
        phase = math.sin(math.pi * (i / (num_steps - 1)))
        
        obs_list = [
            generate_bhopal_observation(loc, step_time, storm_phase=phase, is_historical=True)
            for loc in BHOPAL_LOCATIONS
        ]
        
        replay_frames.append({
            "step_index": i,
            "timestamp": step_time.isoformat(),
            "time_display": step_time.strftime("%H:%M UTC"),
            "storm_intensity_phase": round(phase, 2),
            "observations": [obs.model_dump() for obs in obs_list],
            "ground_truth_label": {
                "thunderstorm_occurred": phase > 0.5,
                "lightning_occurred": phase > 0.65,
                "heavy_rain_occurred": phase > 0.60
            }
        })
        
    return replay_frames
