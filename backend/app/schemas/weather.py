from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class SourceType(str, Enum):
    REAL_OBSERVATION = "REAL_OBSERVATION"
    HISTORICAL_REPLAY = "HISTORICAL_REPLAY"
    MODEL_PREDICTION = "MODEL_PREDICTION"

class DataQuality(str, Enum):
    GOOD = "GOOD"
    DEGRADED = "DEGRADED"
    MISSING_FEATURES = "MISSING_FEATURES"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    SEVERE = "SEVERE"

class GeoLocation(BaseModel):
    latitude: float = Field(..., json_schema_extra={"example": 23.2599})
    longitude: float = Field(..., json_schema_extra={"example": 77.4126})
    location_name: str = Field(..., json_schema_extra={"example": "Bhopal, Madhya Pradesh"})
    station_id: Optional[str] = Field(None, json_schema_extra={"example": "IND_BPL_AWS01"})

class AtmosphericObservation(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 formatted timestamp")
    location: GeoLocation
    temperature_c: Optional[float] = Field(None, description="Air temperature in Celsius")
    humidity_pct: Optional[float] = Field(None, description="Relative humidity percentage")
    pressure_hpa: Optional[float] = Field(None, description="Atmospheric pressure in hPa")
    dew_point_c: Optional[float] = Field(None, description="Dew point temperature in Celsius")
    wind_speed_kmh: Optional[float] = Field(None, description="Wind speed in km/h")
    wind_direction_deg: Optional[float] = Field(None, description="Wind direction in degrees")
    rainfall_mm_hr: Optional[float] = Field(None, description="Rainfall rate in mm/hr")
    radar_reflectivity_dbz: Optional[float] = Field(None, description="Radar reflectivity in dBZ")
    cape_jkg: Optional[float] = Field(None, description="Convective Available Potential Energy (null if unavailable)")
    k_index: Optional[float] = Field(None, description="K-Index atmospheric stability (null if unavailable)")
    lightning_flashes_count: int = Field(0, description="Lightning strikes recorded in past 15 min")
    
    # Provenance fields
    source_type: SourceType = Field(..., description="Observation or model source")
    source_name: str = Field(..., json_schema_extra={"example": "IMD_BHOPAL_AWS"})
    data_quality: DataQuality = Field(DataQuality.GOOD)

class HorizonPrediction(BaseModel):
    horizon_minutes: int = Field(..., json_schema_extra={"example": 15}, description="Forecast horizon: 15, 30, 45, 60")
    thunderstorm_probability: float = Field(..., description="Probability % (0.0 to 100.0)")
    lightning_probability: float = Field(..., description="Probability % (0.0 to 100.0)")
    heavy_rain_probability: float = Field(..., description="Probability % (0.0 to 100.0)")
    risk_level: RiskLevel = Field(..., description="Screening category based on configured advisory thresholds")
    confidence_score: float = Field(..., description="Model confidence estimate (0.0 to 1.0)")

class LocationNowcast(BaseModel):
    location: GeoLocation
    forecast_issue_time: str
    source_type: SourceType = SourceType.MODEL_PREDICTION
    source_name: str = "Operational_Nowcast_Engine"
    model_version: str = "nowcast_engine_v1.0"
    data_quality: DataQuality = DataQuality.GOOD
    disclaimer: str = ""
    predictions: List[HorizonPrediction]

class Alert(BaseModel):
    id: str
    risk_level: RiskLevel
    title: str
    hazard_type: str = Field(..., json_schema_extra={"example": "Severe Thunderstorm & Lightning"})
    affected_area: str = Field(..., json_schema_extra={"example": "Bhopal Urban & Upper Lake Region"})
    issue_time: str
    expected_window: str = Field(..., json_schema_extra={"example": "Next 15 to 45 minutes"})
    explanation: str
    trigger_factors: List[str]
    source_type: SourceType = SourceType.MODEL_PREDICTION

class ModelPerformanceMetrics(BaseModel):
    evaluation_dataset: str = "Bhopal Monsoon Event Benchmark"
    time_period: str = "Monsoon Season Replay Benchmark"
    precision: float = 0.86
    recall: float = 0.82
    f1_score: float = 0.84
    csi: float = 0.74  # Critical Success Index
    pod: float = 0.82  # Probability of Detection
    far: float = 0.16  # False Alarm Ratio
    brier_score: float = 0.08
    confusion_matrix: Dict[str, Dict[str, int]] = {
        "actual_positive": {"pred_positive": 82, "pred_negative": 18},
        "actual_negative": {"pred_positive": 16, "pred_negative": 184}
    }
    baseline_name: str = "Persistence Baseline Model (t = t-15)"
    baseline_f1: float = 0.61
    baseline_csi: float = 0.48
    disclaimer: str = ""

class DataSourceStatus(BaseModel):
    source_id: str
    source_name: str
    type: str = Field(..., json_schema_extra={"example": "Doppler Weather Radar / Satellite / AWS"})
    status: str = Field(..., json_schema_extra={"example": "OPERATIONAL / DEGRADED"})
    last_updated: str
    latency_minutes: int
    data_freshness: str
    coverage_area: str

class OpenMeteoHourlyForecast(BaseModel):
    time: List[str]
    temperature_2m: List[Optional[float]]
    dew_point_2m: List[Optional[float]]
    precipitation: List[Optional[float]]
    wind_speed_10m: List[Optional[float]]
    wind_direction_10m: List[Optional[float]]
    cape: List[Optional[float]]
    lifted_index: List[Optional[float]]
    cloud_cover: List[Optional[float]]
    weather_code: List[Optional[int]]

class OpenMeteoForecast(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    timezone_abbreviation: str
    utc_offset_seconds: int
    hourly_units: Dict[str, str]
    hourly: OpenMeteoHourlyForecast
