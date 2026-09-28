import type {
  AtmosphericObservation,
  LocationNowcast,
  Alert,
  HistoricalFrame,
  ModelPerformanceMetrics,
  DataSourceStatus
} from '../types/weather';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const MOCK_BHOPAL_LOCATIONS = [
  { latitude: 23.2599, longitude: 77.4126, location_name: 'Bhopal Central (MP Nagar)', station_id: 'BPL_AWS_01' },
  { latitude: 23.2842, longitude: 77.3489, location_name: 'Bairagarh Airport', station_id: 'BPL_AWS_02' },
  { latitude: 23.1678, longitude: 77.4362, location_name: 'Kolar Road Suburb', station_id: 'BPL_AWS_03' },
  { latitude: 23.2154, longitude: 77.4291, location_name: 'Arera Colony', station_id: 'BPL_AWS_04' },
  { latitude: 23.2450, longitude: 77.3620, location_name: 'Upper Lake Meteorological Tower', station_id: 'BPL_AWS_05' },
  { latitude: 23.0760, longitude: 77.5180, location_name: 'Mandideep Industrial Belt', station_id: 'BPL_AWS_06' },
];

export async function fetchObservations(): Promise<AtmosphericObservation[]> {
  try {
    const res = await fetch(`${API_BASE}/observations`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using client-side fallback observations dataset");
  }
  
  const nowStr = new Date().toISOString();
  return MOCK_BHOPAL_LOCATIONS.map((loc, idx) => ({
    timestamp: nowStr,
    location: loc,
    temperature_c: 28.5 + idx * 0.4,
    humidity_pct: 88 - idx * 2,
    pressure_hpa: 1002.5,
    dew_point_c: 26.1,
    wind_speed_kmh: 34.0 + idx * 3,
    wind_direction_deg: 240,
    rainfall_mm_hr: 38.5 + idx * 4,
    radar_reflectivity_dbz: 48.0 + idx * 2,
    cape_jkg: 2250,
    k_index: 36.5,
    lightning_flashes_count: 24 + idx * 5,
    source_type: 'SYNTHETIC_DEMO',
    source_name: 'CLIENT_FALLBACK_SIMULATOR',
    data_quality: 'SYNTHETIC',
    is_demo: true,
  }));
}

export async function fetchNowcast(): Promise<LocationNowcast[]> {
  try {
    const res = await fetch(`${API_BASE}/nowcast`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using client-side fallback nowcast dataset");
  }
  
  const nowStr = new Date().toISOString();
  return MOCK_BHOPAL_LOCATIONS.map(loc => ({
    location: loc,
    forecast_issue_time: nowStr,
    source_type: 'MODEL_PREDICTION',
    source_name: 'XGBoost_Baseline_Engine',
    model_version: 'xgboost_baseline_v1.0',
    data_quality: 'SYNTHETIC',
    is_demo: true,
    disclaimer: 'Prototype risk thresholds — not official government warnings. DEMO DATA.',
    predictions: [
      { horizon_minutes: 15, thunderstorm_probability: 78.5, lightning_probability: 72.0, heavy_rain_probability: 84.0, risk_level: 'HIGH', confidence_score: 0.92 },
      { horizon_minutes: 30, thunderstorm_probability: 88.0, lightning_probability: 84.5, heavy_rain_probability: 91.0, risk_level: 'SEVERE', confidence_score: 0.88 },
      { horizon_minutes: 45, thunderstorm_probability: 64.0, lightning_probability: 58.0, heavy_rain_probability: 70.0, risk_level: 'HIGH', confidence_score: 0.82 },
      { horizon_minutes: 60, thunderstorm_probability: 42.0, lightning_probability: 35.0, heavy_rain_probability: 48.0, risk_level: 'MODERATE', confidence_score: 0.75 }
    ]
  }));
}

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const res = await fetch(`${API_BASE}/alerts`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using client-side fallback alerts dataset");
  }
  
  const nowStr = new Date().toISOString();
  return [
    {
      id: 'ALT-BPL-2026-001',
      risk_level: 'SEVERE',
      title: 'Severe Thunderstorm & High-Frequency Lightning Warning',
      hazard_type: 'Severe Thunderstorm & Lightning',
      affected_area: 'Bhopal Urban, MP Nagar & Upper Lake District',
      issue_time: nowStr,
      expected_window: 'Next 15 to 45 minutes',
      explanation: 'Convective radar reflectivity exceeds 52 dBZ with high lightning frequency.',
      trigger_factors: ['Radar Reflectivity > 50 dBZ', 'Lightning Frequency > 30 strikes/15 min', 'Surface Moisture Convergence'],
      is_demo: true,
      source_type: 'MODEL_PREDICTION'
    },
    {
      id: 'ALT-BPL-2026-002',
      risk_level: 'HIGH',
      title: 'Heavy Rainfall Hazard Warning',
      hazard_type: 'Heavy Rainfall / Urban Inundation',
      affected_area: 'Kolar Road & Mandideep Industrial Area',
      issue_time: nowStr,
      expected_window: 'Next 30 to 60 minutes',
      explanation: 'Precipitation rate estimated above 45 mm/hr over low-lying catchment zones.',
      trigger_factors: ['Precipitation Rate > 40 mm/hr', 'Monsoon Wind Convergence'],
      is_demo: true,
      source_type: 'MODEL_PREDICTION'
    }
  ];
}

export async function fetchHistory(): Promise<HistoricalFrame[]> {
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using client-side fallback history dataset");
  }

  const baseTime = new Date();
  baseTime.setHours(baseTime.getHours() - 1);
  
  return Array.from({ length: 12 }).map((_, i) => {
    const stepTime = new Date(baseTime.getTime() + i * 5 * 60000);
    const phase = Math.sin(Math.PI * (i / 11));
    return {
      step_index: i,
      timestamp: stepTime.toISOString(),
      time_display: stepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      storm_intensity_phase: Math.round(phase * 100) / 100,
      observations: MOCK_BHOPAL_LOCATIONS.map(loc => ({
        timestamp: stepTime.toISOString(),
        location: loc,
        temperature_c: 32 - phase * 6,
        humidity_pct: 60 + phase * 35,
        pressure_hpa: 1008 - phase * 12,
        dew_point_c: 25,
        wind_speed_kmh: 15 + phase * 40,
        wind_direction_deg: 230,
        rainfall_mm_hr: Math.round(phase * phase * 65 * 10) / 10,
        radar_reflectivity_dbz: Math.round(phase * 56 * 10) / 10,
        cape_jkg: 2400,
        k_index: 35,
        lightning_flashes_count: Math.floor(phase * phase * 40),
        source_type: 'HISTORICAL_REPLAY',
        source_name: 'HISTORICAL_BHOPAL_MONSOON_ARCHIVE',
        data_quality: 'SYNTHETIC',
        is_demo: true
      })),
      ground_truth_label: {
        thunderstorm_occurred: phase > 0.5,
        lightning_occurred: phase > 0.65,
        heavy_rain_occurred: phase > 0.60
      }
    };
  });
}

export async function fetchModelMetrics(): Promise<ModelPerformanceMetrics> {
  try {
    const res = await fetch(`${API_BASE}/model/metrics`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using client-side fallback metrics dataset");
  }
  
  return {
    evaluation_dataset: 'Bhopal Monsoon Event Benchmark (Replay Dataset)',
    time_period: 'Monsoon Season Replay Suite',
    precision: 0.86,
    recall: 0.82,
    f1_score: 0.84,
    csi: 0.74,
    pod: 0.82,
    far: 0.16,
    brier_score: 0.08,
    confusion_matrix: {
      actual_positive: { pred_positive: 82, pred_negative: 18 },
      actual_negative: { pred_positive: 16, pred_negative: 184 }
    },
    baseline_name: 'Persistence Baseline Model (t = t-15)',
    baseline_f1: 0.61,
    baseline_csi: 0.48,
    disclaimer: 'DEMO / SYNTHETIC DATA — NOT A REAL-WORLD VALIDATION'
  };
}

export async function fetchDataSources(): Promise<DataSourceStatus[]> {
  try {
    const res = await fetch(`${API_BASE}/data-sources`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using client-side fallback data sources dataset");
  }
  
  const nowStr = new Date().toISOString();
  return [
    {
      source_id: 'DS_IMD_RADAR_BPL',
      source_name: 'IMD Bhopal Doppler Weather Radar (S-Band)',
      type: 'Doppler Weather Radar (Reflectivity & Velocity)',
      status: 'DEMO_MODE',
      last_updated: nowStr,
      latency_minutes: 3,
      data_freshness: 'Operational (Synthetic Stream)',
      coverage_area: '150 km Radius centered on Bhopal (23.2599°N, 77.4126°E)',
      is_demo: true
    },
    {
      source_id: 'DS_MOSDAC_INSAT3D',
      source_name: 'MOSDAC INSAT-3DR Rapid-Scan Satellite',
      type: 'Thermal Infrared & Water Vapor Channels',
      status: 'DEMO_MODE',
      last_updated: nowStr,
      latency_minutes: 12,
      data_freshness: 'Operational (Synthetic Stream)',
      coverage_area: 'Central India Region',
      is_demo: true
    },
    {
      source_id: 'DS_IMD_AWS_NETWORK',
      source_name: 'IMD Automatic Weather Station (AWS) Network',
      type: 'Ground Telemetry (Temp, Pressure, Humidity, Rain Gauge)',
      status: 'OPERATIONAL',
      last_updated: nowStr,
      latency_minutes: 5,
      data_freshness: 'Operational (Live Simulator)',
      coverage_area: '6 Ground Stations across Bhopal District',
      is_demo: true
    },
    {
      source_id: 'DS_IITM_LIGHTNING_NET',
      source_name: 'IITM Damini Lightning Detection Network',
      type: 'VLF/LF Lightning Stroke Sensors',
      status: 'OPERATIONAL',
      last_updated: nowStr,
      latency_minutes: 1,
      data_freshness: 'Real-Time Feed',
      coverage_area: 'Madhya Pradesh Corridor',
      is_demo: true
    }
  ];
}
