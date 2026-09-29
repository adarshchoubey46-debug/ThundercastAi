export type SourceType = 
  | 'REAL_OBSERVATION'
  | 'HISTORICAL_REPLAY'
  | 'MODEL_PREDICTION';

export type DataQuality = 'GOOD' | 'DEGRADED' | 'MISSING_FEATURES';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  location_name: string;
  station_id?: string;
}

export interface AtmosphericObservation {
  timestamp: string;
  location: GeoLocation;
  temperature_c?: number | null;
  humidity_pct?: number | null;
  pressure_hpa?: number | null;
  dew_point_c?: number | null;
  wind_speed_kmh?: number | null;
  wind_direction_deg?: number | null;
  rainfall_mm_hr?: number | null;
  radar_reflectivity_dbz?: number | null;
  cape_jkg?: number | null;
  k_index?: number | null;
  lightning_flashes_count: number;
  source_type: SourceType;
  source_name: string;
  data_quality: DataQuality;
}

export interface HorizonPrediction {
  horizon_minutes: 15 | 30 | 45 | 60;
  thunderstorm_probability: number;
  lightning_probability: number;
  heavy_rain_probability: number;
  risk_level: RiskLevel;
  confidence_score: number;
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  hourly_units: Record<string, string>;
  hourly: {
    time: string[];
    temperature_2m: Array<number | null>;
    dew_point_2m: Array<number | null>;
    precipitation: Array<number | null>;
    wind_speed_10m: Array<number | null>;
    wind_direction_10m: Array<number | null>;
    cape: Array<number | null>;
    lifted_index: Array<number | null>;
    cloud_cover: Array<number | null>;
    weather_code: Array<number | null>;
  };
}

export interface HourlyForecastPoint {
  time: string;
  temperature_c: number | null;
  dew_point_c: number | null;
  precipitation_mm: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg: number | null;
  cape_jkg: number | null;
  lifted_index: number | null;
  cloud_cover_pct: number | null;
  weather_code: number | null;
  thunderstorm_probability: number;
  lightning_probability: number;
  heavy_rain_probability: number;
}

export interface LocationNowcast {
  location: GeoLocation;
  forecast_issue_time: string;
  source_type: SourceType;
  source_name: string;
  model_version: string;
  data_quality: DataQuality;
  disclaimer: string;
  predictions: HorizonPrediction[];
}

export interface Alert {
  id: string;
  risk_level: RiskLevel;
  title: string;
  hazard_type: string;
  affected_area: string;
  issue_time: string;
  expected_window: string;
  explanation: string;
  trigger_factors: string[];
  source_type: SourceType;
}

export interface HistoricalFrame {
  step_index: number;
  timestamp: string;
  time_display: string;
  storm_intensity_phase: number;
  observations: AtmosphericObservation[];
  ground_truth_label: {
    thunderstorm_occurred: boolean;
    lightning_occurred: boolean;
    heavy_rain_occurred: boolean;
  };
}

export interface ModelPerformanceMetrics {
  evaluation_dataset: string;
  time_period: string;
  precision: number;
  recall: number;
  f1_score: number;
  csi: number;
  pod: number;
  far: number;
  brier_score: number;
  confusion_matrix: {
    actual_positive: { pred_positive: number; pred_negative: number };
    actual_negative: { pred_positive: number; pred_negative: number };
  };
  baseline_name: string;
  baseline_f1: number;
  baseline_csi: number;
  disclaimer: string;
}

export interface DataSourceStatus {
  source_id: string;
  source_name: string;
  type: string;
  status: 'OPERATIONAL' | 'DEGRADED';
  last_updated: string;
  latency_minutes: number;
  data_freshness: string;
  coverage_area: string;
}
