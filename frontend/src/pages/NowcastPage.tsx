import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import type { ThunderstormHour, WeatherRiskForecast } from '../types/weather';
import { fetchWeatherRisk } from '../services/api';

interface NowcastPageProps {
  forecastMode: 'live' | 'monsoon';
}

export const NowcastPage: React.FC<NowcastPageProps> = ({ forecastMode }) => {
  const [forecast, setForecast] = useState<WeatherRiskForecast | null>(null);
  const [selectedHours, setSelectedHours] = useState(6);
  const [refreshing, setRefreshing] = useState(false);
  const [systemTime, setSystemTime] = useState(new Date().toUTCString());

  useEffect(() => {
    void loadData();
    const timer = window.setInterval(() => setSystemTime(new Date().toUTCString()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadData() {
    setRefreshing(true);
    const data = await fetchWeatherRisk();
    setForecast(data);
    setRefreshing(false);
  }

  const availableHours = forecast?.hours.length ?? 0;
  const boundedHours = Math.min(selectedHours, availableHours);
  const selectedWindow = forecast?.hours.slice(0, boundedHours) ?? [];
  const peakHour = selectedWindow.reduce<ThunderstormHour | null>((peak, hour) => {
    if (hour.thunderstorm_potential_pct === null) return peak;
    if (!peak || hour.thunderstorm_potential_pct > (peak.thunderstorm_potential_pct ?? -1)) return hour;
    return peak;
  }, null);
  const chartData = selectedWindow.map((hour) => ({
    time: new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Thunderstorm: hour.thunderstorm_potential_pct,
    Lightning: hour.lightning_potential_pct,
    Rain: hour.precipitation_probability_pct,
  }));
  const seasonLabel = forecast?.season_context ?? (new Date().getMonth() === 6 || new Date().getMonth() === 7
    ? 'July-August monsoon window'
    : 'Outside July-August monsoon window');

  return (
    <div className="space-y-6">
      <section className="glass-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Activity className="h-4 w-4 text-[#175a91]" />
            {forecastMode === 'monsoon' ? 'July-August Monsoon Context' : 'Live Thunderstorm Outlook'}
          </h2>
          <p className="mt-1 text-xs text-slate-600">Bhopal · Hourly forecast window · UTC system time: {systemTime}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {forecast && <span className="text-xs font-medium text-slate-600">{forecast.provider.replaceAll('_', ' ')}</span>}
          <button type="button" onClick={() => void loadData()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh forecast
          </button>
        </div>
      </section>

      {forecastMode === 'monsoon' && (
        <section className="glass-card border-l-4 border-l-sky-700 p-4">
          <h3 className="text-sm font-bold text-slate-800">Seasonal planning: July-August</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Central India generally has greater convective-weather exposure during the monsoon. This is seasonal context, not a forecast for a future July or August date. The hourly values below remain based only on the provider forecast window and are never increased just because monsoon mode is selected.
          </p>
        </section>
      )}

      <section className="glass-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="forecast-window" className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Clock className="h-4 w-4 text-[#175a91]" />
            Forecast duration
          </label>
          <span className="rounded-sm border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">Next {boundedHours || selectedHours} hours</span>
        </div>
        <input id="forecast-window" aria-label="Forecast duration in hours" type="range" min="1" max={Math.max(availableHours, 1)} value={Math.min(selectedHours, Math.max(availableHours, 1))} onChange={(event) => setSelectedHours(Number(event.target.value))} disabled={!availableHours} className="w-full accent-[#175a91] disabled:opacity-50" />
        <div className="flex justify-between text-[11px] text-slate-500"><span>1 hour</span><span>{availableHours || 0} forecast hours available</span></div>

        {forecast?.available && peakHour ? (
          <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-600">Peak thunderstorm potential indicator</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#175a91]">{peakHour.thunderstorm_potential_pct}%</div>
              <div className="mt-1 text-[11px] text-slate-500">{new Date(peakHour.time).toLocaleString()}</div>
            </div>
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-600">Lightning potential indicator</div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-700">{peakHour.lightning_potential_pct === null ? 'N/A' : `${peakHour.lightning_potential_pct}%`}</div>
              <div className="mt-1 text-[11px] text-slate-500">CAPE: {peakHour.cape_jkg === null ? 'not provided' : `${peakHour.cape_jkg} J/kg`}</div>
            </div>
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-600">Precipitation probability</div>
              <div className="mt-1 font-mono text-2xl font-bold text-sky-800">{peakHour.precipitation_probability_pct === null ? 'N/A' : `${peakHour.precipitation_probability_pct}%`}</div>
              <div className="mt-1 text-[11px] text-slate-500">Convective rain: {peakHour.convective_precipitation_mm === null ? 'not provided' : `${peakHour.convective_precipitation_mm} mm`}</div>
            </div>
          </div>
        ) : (
          <div role="status" className="flex items-start gap-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <span>{forecast?.message ?? 'Loading provider forecast…'} Numeric estimates are withheld when real forecast data is unavailable.</span>
          </div>
        )}
      </section>

      <section className="glass-card space-y-4 p-5">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><TrendingUp className="h-4 w-4 text-[#175a91]" />Hourly weather indicators</h3>
          <p className="mt-1 text-xs text-slate-600">Selected forecast window · {seasonLabel}</p>
        </div>
        {chartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8e0e8" />
                <XAxis dataKey="time" stroke="#586779" fontSize={11} />
                <YAxis stroke="#586779" domain={[0, 100]} unit="%" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#d8e0e8', borderRadius: '4px', color: '#26384b' }} />
                <Legend />
                <Line connectNulls type="monotone" dataKey="Thunderstorm" name="Thunderstorm potential" stroke="#175a91" strokeWidth={2} dot={false} />
                <Line connectNulls type="monotone" dataKey="Lightning" name="Lightning potential" stroke="#b7791f" strokeWidth={2} dot={false} />
                <Line connectNulls type="monotone" dataKey="Rain" name="Precipitation chance" stroke="#16809a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">No hourly forecast is available right now.</p>
        )}
        <p className="border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">{forecast?.disclaimer ?? 'Thunderstorm potential is an indicator derived from forecast fields, not a calibrated probability or official warning. Follow IMD and local authority alerts.'} {forecast?.cached && (forecast.stale ? 'Showing a stale cached response because the provider is unavailable.' : 'Cached for up to 15 minutes.')}</p>
      </section>
    </div>
  );
};
