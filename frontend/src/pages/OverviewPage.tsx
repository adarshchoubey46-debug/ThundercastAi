import React, { useEffect, useState } from 'react';
import type {
  AtmosphericObservation,
  HourlyForecastPoint,
  Alert,
  DataSourceStatus
} from '../types/weather';
import {
  fetchObservations,
  getForecast,
  isPrototypeForecastMode,
  fetchAlerts,
  fetchDataSources
} from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { useTranslation } from '../i18n';
import {
  CloudLightning,
  CloudRain,
  Wind,
  Thermometer,
  Zap,
  Activity,
  AlertOctagon,
  ShieldCheck,
  Radio
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const prototypeMode = isPrototypeForecastMode();
  const [observations, setObservations] = useState<AtmosphericObservation[]>([]);
  const [forecastHours, setForecastHours] = useState<HourlyForecastPoint[]>([]);
  const [forecastUnavailable, setForecastUnavailable] = useState<boolean>(false);
  const [forecastWaking, setForecastWaking] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const loadForecast = async () => {
        try {
          return await getForecast(6, () => setForecastWaking(true));
        } catch (error) {
          console.error('Unable to load Overview forecast', error);
          setForecastUnavailable(true);
          return [];
        } finally {
          setForecastWaking(false);
        }
      };
      const [obsData, forecastData, alertData, sourcesData] = await Promise.all([
        fetchObservations(),
        loadForecast(),
        fetchAlerts(),
        fetchDataSources()
      ]);
      setObservations(obsData);
      setForecastHours(forecastData);
      setAlerts(alertData);
      setDataSources(sourcesData);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-cyan-400">
          <Activity className="w-6 h-6 animate-spin" />
          <span className="text-sm font-mono">{forecastWaking ? t('Waking up server...') : t('Syncing Atmospheric Observations for Bhopal...')}</span>
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
                <h2 className="text-sm font-bold text-red-400">{t(alerts[0].title)}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getRiskClass(alerts[0].risk_level)}`}>
                  {t(alerts[0].risk_level)}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">{t(alerts[0].affected_area)} — {t(alerts[0].explanation)}</p>
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
              <p className="text-xs text-gray-400">{t(mainObs?.location.location_name ?? '')}</p>
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
                  <span>{t('Temperature')}</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{mainObs.temperature_c}°C</div>
                <div className="text-[11px] text-gray-500">{t('Dew Pt:')} {mainObs.dew_point_c}°C</div>
              </div>

              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <div className="flex items-center text-xs text-gray-400 space-x-1.5 mb-1">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  <span>{t('Rainfall Rate')}</span>
                </div>
                <div className="text-lg font-bold text-cyan-400 font-mono">{mainObs.rainfall_mm_hr} mm/h</div>
                <div className="text-[11px] text-gray-500">{t('Radar:')} {mainObs.radar_reflectivity_dbz} dBZ</div>
              </div>

              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <div className="flex items-center text-xs text-gray-400 space-x-1.5 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>{t('Lightning Flashes')}</span>
                </div>
                <div className="text-lg font-bold text-yellow-400 font-mono">{mainObs.lightning_flashes_count}</div>
                <div className="text-[11px] text-gray-500">{t('Past 15 mins')}</div>
              </div>

              <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-800/80">
                <div className="flex items-center text-xs text-gray-400 space-x-1.5 mb-1">
                  <Wind className="w-4 h-4 text-teal-400" />
                  <span>{t('Wind Speed')}</span>
                </div>
                <div className="text-lg font-bold text-white font-mono">{mainObs.wind_speed_kmh} km/h</div>
                <div className="text-[11px] text-gray-500">{t('Dir:')} {mainObs.wind_direction_deg}°</div>
              </div>
            </div>
          )}

          {/* Meteorological Indices Info */}
          <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-lg text-xs space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">{t('CAPE Instability:')}</span>
              <span className="text-cyan-300 font-bold">{mainObs?.cape_jkg ? `${mainObs.cape_jkg} J/kg` : t('Unavailable / Sensor Absent')}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">{t('K-Index Stability:')}</span>
              <span className="text-cyan-300 font-bold">{mainObs?.k_index ? `${mainObs.k_index}` : t('Unavailable / Sensor Absent')}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Live provider outlook cards */}
        <div className="glass-card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CloudLightning className="w-4 h-4 text-cyan-400" />
                <span>{t(prototypeMode ? 'Thunderstorm Outlook · Prototype Scenario' : 'Live Thunderstorm Outlook')}</span>
              </h2>
              <p className="text-xs text-gray-400">{t(prototypeMode ? 'Fixed sample values · not live weather · Bhopal' : 'Open-Meteo hourly forecast · Bhopal')}</p>
            </div>
            {forecastHours.length > 0 && (
              <ProvenanceBadge sourceType="MODEL_PREDICTION" sourceName={prototypeMode ? 'Prototype forecast scenario' : 'Open-Meteo forecast'} compact />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {forecastHours.slice(0, 4).map((hour) => {
              const riskLevel = hour.thunderstorm_probability < 30 ? 'LOW'
                : hour.thunderstorm_probability < 60 ? 'MODERATE'
                  : hour.thunderstorm_probability < 80 ? 'HIGH' : 'SEVERE';
              return (
              <div key={hour.time} className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 font-mono">{new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${getRiskClass(riskLevel)}`}>
                    {t(riskLevel)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-gray-400 mb-0.5">
                      <span>{t('Thunderstorm')}</span>
                      <span className="font-mono text-white font-bold">{hour.thunderstorm_probability}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-1.5 rounded-full"
                        style={{ width: `${hour.thunderstorm_probability}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 mb-0.5">
                      <span>{t('Lightning Strike')}</span>
                      <span className="font-mono text-yellow-400 font-bold">{hour.lightning_probability}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-1.5 rounded-full"
                        style={{ width: `${hour.lightning_probability}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 mb-0.5">
                      <span>{t('Heavy Rain')}</span>
                      <span className="font-mono text-blue-400 font-bold">{hour.heavy_rain_probability}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${hour.heavy_rain_probability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800 flex justify-between text-[11px] text-gray-500 font-mono">
                  <span>{t('CAPE / rain:')}</span>
                  <span className="text-gray-300 font-bold">{hour.cape_jkg ?? 'N/A'} J/kg · {hour.precipitation_mm ?? 'N/A'} mm</span>
                </div>
              </div>
              );
            })}
          </div>

          {forecastUnavailable && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-xs text-red-800">{t('Live weather data is temporarily unavailable. Please retry later.')}</p>}
          {forecastWaking && <p role="status" className="text-xs text-amber-700">{t('Waking up server… retrying forecast request.')}</p>}
          <div className="p-3 bg-gray-950/60 rounded-lg text-xs text-gray-400 border border-gray-800">
            {t(prototypeMode ? 'Prototype scenario only. Values are predefined for presentation and are not current weather, calibrated probabilities, or official warnings.' : 'Thunderstorm and lightning values are derived risk indicators from CAPE, lifted index, precipitation, cloud cover, and WMO weather codes. They are not calibrated probabilities or official warnings.')}
          </div>
        </div>

      </div>

      {/* Bottom Section: Data Source Health Grid */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t('Meteorological Data Feed Operational Health')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dataSources.map((ds) => (
            <div key={ds.source_id} className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate max-w-[160px]">{t(ds.source_name)}</span>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                  ds.status === 'OPERATIONAL' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  {t(ds.status)}
                </span>
              </div>
              <p className="text-gray-400 text-[11px]">{t(ds.type)}</p>
              <div className="flex justify-between text-gray-500 text-[10px] font-mono border-t border-gray-800 pt-1">
                <span>{t('Latency:')} {ds.latency_minutes}m</span>
                <span className="text-cyan-400">{t(ds.data_freshness)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
