import React, { useState, useEffect } from 'react';
import type { HourlyForecastPoint, RiskLevel } from '../types/weather';
import { getForecast, isPrototypeForecastMode } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { useTranslation } from '../i18n';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Clock, Sliders, TrendingUp, RefreshCw } from 'lucide-react';

export const NowcastPage: React.FC = () => {
  const prototypeMode = isPrototypeForecastMode();
  const { t } = useTranslation();
  const [forecastHours, setForecastHours] = useState<HourlyForecastPoint[]>([]);
  const [selectedHours, setSelectedHours] = useState<number>(6);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [wakingUp, setWakingUp] = useState<boolean>(false);
  const [forecastUnavailable, setForecastUnavailable] = useState<boolean>(false);
  const [systemTime, setSystemTime] = useState<string>(new Date().toUTCString());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setSystemTime(new Date().toUTCString()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadData(hours = selectedHours) {
    setRefreshing(true);
    setWakingUp(false);
    setForecastUnavailable(false);
    try {
      const data = await getForecast(hours, () => setWakingUp(true));
      setForecastHours(data);
    } catch (error) {
      console.error('Unable to load hourly forecast', error);
      setForecastHours([]);
      setForecastUnavailable(true);
    } finally {
      setRefreshing(false);
      setWakingUp(false);
    }
  }

  const selectedPrediction = forecastHours.reduce<HourlyForecastPoint | null>((peak, hour) => (
    !peak || hour.thunderstorm_probability > peak.thunderstorm_probability ? hour : peak
  ), null);

  const classifyRisk = (probability: number): RiskLevel => {
    if (probability < 30) return 'LOW';
    if (probability < 60) return 'MODERATE';
    if (probability < 80) return 'HIGH';
    return 'SEVERE';
  };

  // Prepare chart dataset for Recharts
  const chartData = forecastHours.map((hour) => ({
    horizon: new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Thunderstorm: hour.thunderstorm_probability,
    Lightning: hour.lightning_probability,
    HeavyRain: hour.heavy_rain_probability,
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Controls Header */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{t(prototypeMode ? 'Hourly Thunderstorm Forecast · Prototype Scenario' : 'Hourly Thunderstorm Forecast')}</span>
          </h2>
          <p className="text-xs text-gray-400">
            {t('Location: Bhopal, Madhya Pradesh')} | {t('Forecast issued:')} {forecastHours[0]?.time ?? t('Waiting for forecast')} {t('UTC')} | {t('System time')}: {systemTime}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {forecastHours.length > 0 && (
            <ProvenanceBadge
              sourceType="MODEL_PREDICTION"
              sourceName={t(prototypeMode ? 'Prototype forecast scenario' : 'Open-Meteo hourly forecast')}
            />
          )}
          <button
            onClick={() => void loadData(selectedHours)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition border border-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{t('Refresh Forecast')}</span>
          </button>
        </div>
      </div>

      {/* Main Timeline Slider Control Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>{t('Forecast duration:')}</span>
            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-700 rounded font-mono text-xs">
              {selectedHours} {t('Hours')}
            </span>
          </label>
          <span className="text-xs text-gray-400 font-mono">{t(prototypeMode ? 'Fixed sample values · not live weather' : 'Open-Meteo hourly range')}</span>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="24"
            step="1"
            value={selectedHours}
            onChange={(event) => {
              const hours = Number(event.target.value);
              setSelectedHours(hours);
              void loadData(hours);
            }}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-xs font-mono text-gray-400 px-1">
            <span>{t('1 hour')}</span>
            <span>{t('6 hours')}</span>
            <span>{t('12 hours')}</span>
            <span>{t('24 hours')}</span>
          </div>
        </div>

        {wakingUp && <p role="status" className="text-xs text-amber-700">{t('Waking up server… retrying forecast request.')}</p>}
        {forecastUnavailable && <p role="alert" className="text-xs text-red-700">{t('Live weather data is temporarily unavailable. Please retry later.')}</p>}

        {/* Selected Horizon Probability Spotlight Card */}
        {selectedPrediction && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
            <div className="p-4 bg-gray-900/80 rounded-xl border border-cyan-500/30">
              <div className="text-xs text-gray-400">{t('Peak thunderstorm indicator')}</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
                {selectedPrediction.thunderstorm_probability}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">{new Date(selectedPrediction.time).toLocaleString()} · {t(classifyRisk(selectedPrediction.thunderstorm_probability))}</div>
            </div>

            <div className="p-4 bg-gray-900/80 rounded-xl border border-yellow-500/30">
              <div className="text-xs text-gray-400">{t('Lightning potential indicator')}</div>
              <div className="text-2xl font-bold text-yellow-400 font-mono mt-1">
                {selectedPrediction.lightning_probability}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">{t('CAPE:')} {selectedPrediction.cape_jkg ?? 'N/A'} J/kg</div>
            </div>

            <div className="p-4 bg-gray-900/80 rounded-xl border border-blue-500/30">
              <div className="text-xs text-gray-400">{t('Heavy-rain potential indicator')}</div>
              <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
                {selectedPrediction.heavy_rain_probability}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">{t('Forecast precipitation:')} {selectedPrediction.precipitation_mm ?? 'N/A'} mm</div>
            </div>

            <div className="p-4 bg-gray-900/80 rounded-xl border border-purple-500/30">
              <div className="text-xs text-gray-400">{t('Forecast conditions')}</div>
              <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
                {selectedPrediction.temperature_c ?? 'N/A'}°C
              </div>
              <div className="text-[10px] text-gray-500 mt-1">{t('Cloud cover')} {selectedPrediction.cloud_cover_pct ?? 'N/A'}% · LI {selectedPrediction.lifted_index ?? 'N/A'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Probability Trend Chart Section */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>{t('Hourly Weather Risk Indicators')}</span>
            </h3>
            <p className="text-xs text-gray-400">{t(prototypeMode ? 'Prototype scenario · fixed sample values · not a current forecast' : 'Open-Meteo model fields across the selected forecast').replace('{hours}', String(selectedHours))}</p>
          </div>
        </div>

        <div className="h-[320px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e0e8" />
              <XAxis dataKey="horizon" stroke="#586779" fontSize={12} />
              <YAxis stroke="#586779" domain={[0, 100]} unit="%" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d8e0e8', borderRadius: '4px', color: '#26384b' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Thunderstorm" name={t('Thunderstorm')} stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Lightning" name={t('Lightning Strike')} stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="HeavyRain" name={t('Heavy Rain')} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-gray-500">{t(prototypeMode ? 'Prototype scenario only. Values are predefined for presentation and are not current weather, calibrated probabilities, or official warnings.' : 'Risk indicators are derived from CAPE, lifted index, precipitation, cloud cover, and WMO weather codes; they are not calibrated probabilities or official warnings.')}</p>
      </div>

    </div>
  );
};
