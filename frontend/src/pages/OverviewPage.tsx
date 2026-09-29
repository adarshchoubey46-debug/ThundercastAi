import React, { startTransition, useEffect, useEffectEvent, useState } from 'react';
import type {
  AtmosphericObservation,
  WeatherRiskForecast,
  Alert,
  DataPipelineHealth
} from '../types/weather';
import {
  fetchObservations,
  fetchWeatherRisk,
  fetchAlerts,
  fetchDataFeedHealth
} from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { DataFeedHealthSection } from '../components/common/DataFeedHealthSection';
import {
  CloudLightning,
  CloudRain,
  Wind,
  Thermometer,
  Zap,
  Activity,
  AlertOctagon,
  Radio
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const [observations, setObservations] = useState<AtmosphericObservation[]>([]);
  const [weatherRisk, setWeatherRisk] = useState<WeatherRiskForecast | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dataHealth, setDataHealth] = useState<DataPipelineHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useEffectEvent(async () => {
    const obsData = await fetchObservations();
    const [weatherRiskData, alertData, healthData] = await Promise.all([
      fetchWeatherRisk(),
      fetchAlerts(),
      fetchDataFeedHealth()
    ]);
    startTransition(() => {
      setObservations(obsData);
      setWeatherRisk(weatherRiskData);
      setAlerts(alertData);
      setDataHealth(healthData);
      setLoading(false);
    });
  });

  async function retryDataHealth() {
    setDataHealth(await fetchDataFeedHealth());
  }

  useEffect(() => { void loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-cyan-400">
          <Activity className="w-6 h-6 animate-spin" />
          <span className="text-sm font-mono">Syncing Atmospheric Observations for Bhopal...</span>
        </div>
      </div>
    );
  }

  const mainObs = observations[0];

  const getRiskClass = (level: string) => {
    switch (level) {
      case 'LOW': return 'badge-low';
      case 'MODERATE': return 'badge-moderate';
      case 'HIGH': return 'badge-high';
      case 'SEVERE':
      default: return 'badge-severe';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Severe Warning Summary if present */}
      {alerts.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-red-500 bg-red-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-red-400">{alerts[0].title}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getRiskClass(alerts[0].risk_level)}`}>
                  {alerts[0].risk_level}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">{alerts[0].affected_area} — {alerts[0].explanation}</p>
            </div>
          </div>
          <div className="shrink-0">
            <ProvenanceBadge sourceType={alerts[0].source_type} sourceName="FastAPI Alert Engine" compact />
          </div>
        </div>
      )}

      {/* Main Meteorological Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Current Atmospheric Observations (Bhopal Central) */}
        <div className="glass-card p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Current Observation Summary</span>
              </h2>
              <p className="text-xs text-gray-400">{mainObs?.location.location_name}</p>
            </div>
            {mainObs && (
              <ProvenanceBadge sourceType={mainObs.source_type} sourceName={mainObs.source_name} compact />
            )}
          </div>

          {mainObs && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <div className="flex items-center text-xs text-gray-400 space-x-1.5 mb-1">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <span>Temperature</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{mainObs.temperature_c}°C</div>
                <div className="text-[11px] text-gray-500">Dew Pt: {mainObs.dew_point_c}°C</div>
              </div>

              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <div className="flex items-center text-xs text-gray-400 space-x-1.5 mb-1">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  <span>Rainfall Rate</span>
                </div>
                <div className="text-lg font-bold text-cyan-400 font-mono">{mainObs.rainfall_mm_hr} mm/h</div>
                <div className="text-[11px] text-gray-500">Radar: {mainObs.radar_reflectivity_dbz} dBZ</div>
              </div>

              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <div className="flex items-center text-xs text-gray-400 space-x-1.5 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Lightning Flashes</span>
                </div>
                <div className="text-lg font-bold text-yellow-400 font-mono">{mainObs.lightning_flashes_count}</div>
                <div className="text-[11px] text-gray-500">Past 15 mins</div>
              </div>

              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <div className="flex items-center text-xs text-gray-400 space-x-1.5 mb-1">
                  <Wind className="w-4 h-4 text-teal-400" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{mainObs.wind_speed_kmh} km/h</div>
                <div className="text-[11px] text-gray-500">Dir: {mainObs.wind_direction_deg}°</div>
              </div>
            </div>
          )}

          {/* Meteorological Indices Info */}
          <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-lg text-xs space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">CAPE Instability:</span>
              <span className="text-cyan-300 font-bold">{mainObs?.cape_jkg ? `${mainObs.cape_jkg} J/kg` : 'Unavailable / Sensor Absent'}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">K-Index Stability:</span>
              <span className="text-cyan-300 font-bold">{mainObs?.k_index ? `${mainObs.k_index}` : 'Unavailable / Sensor Absent'}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Live provider forecast */}
        <div className="glass-card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CloudLightning className="w-4 h-4 text-cyan-400" />
                <span>Live Thunderstorm Outlook</span>
              </h2>
              <p className="text-xs text-gray-400">{weatherRisk?.provider.replaceAll('_', ' ') ?? 'Weather provider'} · next hourly forecasts</p>
            </div>
          </div>

          {weatherRisk?.available ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {weatherRisk.hours.slice(0, 4).map((hour) => (
                <div key={hour.time} className="rounded-sm border border-gray-800 bg-gray-900/60 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(hour.time).toLocaleString()}</span>
                    <span>{hour.condition ?? 'Forecast'}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="text-xs text-gray-500">Thunderstorm potential indicator</span>
                    <strong className="font-mono text-[#175a91]">{hour.thunderstorm_potential_pct === null ? 'N/A' : `${hour.thunderstorm_potential_pct}%`}</strong>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-gray-500">Precipitation chance</span>
                    <strong className="font-mono text-sky-800">{hour.precipitation_probability_pct === null ? 'N/A' : `${hour.precipitation_probability_pct}%`}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p role="status" className="rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {weatherRisk?.message ?? 'Live forecast is unavailable. Numeric estimates are withheld; check official local alerts.'}
            </p>
          )}

          <p className="rounded-sm border border-gray-800 bg-gray-950/60 p-3 text-xs text-gray-500">
            {weatherRisk?.disclaimer ?? 'Thunderstorm potential is an indicator derived from forecast fields, not an official warning.'}
          </p>
        </div>

      </div>

      <DataFeedHealthSection health={dataHealth} onRetry={() => void retryDataHealth()} />

    </div>
  );
};
