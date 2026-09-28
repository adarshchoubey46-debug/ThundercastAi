import React, { useState, useEffect } from 'react';
import type { LocationNowcast } from '../types/weather';
import { fetchNowcast } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
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
import {
  Clock,
  Sliders,
  TrendingUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const NowcastPage: React.FC = () => {
  const [nowcasts, setNowcasts] = useState<LocationNowcast[]>([]);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(30); // Default 30 minutes
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setRefreshing(true);
    const data = await fetchNowcast();
    setNowcasts(data);
    setRefreshing(false);
  }

  const primaryNowcast = nowcasts[0];

  // Prepare chart dataset for Recharts
  const chartData = primaryNowcast?.predictions.map((p) => ({
    horizon: `+${p.horizon_minutes} Min`,
    Thunderstorm: p.thunderstorm_probability,
    Lightning: p.lightning_probability,
    HeavyRain: p.heavy_rain_probability,
    Confidence: p.confidence_score * 100,
  })) || [];

  const selectedPrediction = primaryNowcast?.predictions.find(
    (p) => p.horizon_minutes === selectedHorizon
  ) || primaryNowcast?.predictions[1];

  return (
    <div className="space-y-6">
      
      {/* Top Controls Header */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>0 to 60-Minute Nowcasting Forecast Engine</span>
          </h2>
          <p className="text-xs text-gray-400">
            Location: {primaryNowcast?.location.location_name} | Forecast Issued: {primaryNowcast?.forecast_issue_time.slice(11, 19)} UTC
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {primaryNowcast && (
            <ProvenanceBadge sourceType={primaryNowcast.source_type} sourceName={primaryNowcast.source_name} />
          )}
          <button
            onClick={loadData}
            disabled={refreshing}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition border border-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Model</span>
          </button>
        </div>
      </div>

      {/* Main Timeline Slider Control Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Forecast Lead Time Selector:</span>
            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-700 rounded font-mono text-xs">
              +{selectedHorizon} Minutes
            </span>
          </label>
          <span className="text-xs text-gray-400 font-mono">Horizon Steps: [15m, 30m, 45m, 60m]</span>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="15"
            max="60"
            step="15"
            value={selectedHorizon}
            onChange={(e) => setSelectedHorizon(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-xs font-mono text-gray-400 px-1">
            <span>+15 Min (Immediate)</span>
            <span>+30 Min (Peak Risk)</span>
            <span>+45 Min (Dissipating)</span>
            <span>+60 Min (Outlook)</span>
          </div>
        </div>

        {/* Selected Horizon Probability Spotlight Card */}
        {selectedPrediction && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
            <div className="p-4 bg-gray-900/80 rounded-xl border border-cyan-500/30">
              <div className="text-xs text-gray-400">Thunderstorm Probability</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
                {selectedPrediction.thunderstorm_probability}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Classification: {selectedPrediction.risk_level}</div>
            </div>

            <div className="p-4 bg-gray-900/80 rounded-xl border border-yellow-500/30">
              <div className="text-xs text-gray-400">Lightning Strike Hazard</div>
              <div className="text-2xl font-bold text-yellow-400 font-mono mt-1">
                {selectedPrediction.lightning_probability}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Strike Rate: High Frequency</div>
            </div>

            <div className="p-4 bg-gray-900/80 rounded-xl border border-blue-500/30">
              <div className="text-xs text-gray-400">Heavy Rain Inundation</div>
              <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
                {selectedPrediction.heavy_rain_probability}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Rate: &gt; 40 mm/hr</div>
            </div>

            <div className="p-4 bg-gray-900/80 rounded-xl border border-purple-500/30">
              <div className="text-xs text-gray-400">Model Confidence & Uncertainty</div>
              <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
                {(selectedPrediction.confidence_score * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Uncertainty Bound: &plusmn; 8.5%</div>
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
              <span>Multi-Horizon Probabilistic Hazard Curves (15 to 60 mins)</span>
            </h3>
            <p className="text-xs text-gray-400">Comparing Thunderstorm, Lightning, and Heavy Rain trajectory over Bhopal</p>
          </div>
        </div>

        <div className="h-[320px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="horizon" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" domain={[0, 100]} unit="%" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Thunderstorm" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="Lightning" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="HeavyRain" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center space-x-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Note: Predictions reflect XGBoost baseline feature importance outputs based on synthetic Bhopal atmospheric profiles.</span>
        </div>
      </div>

    </div>
  );
};
