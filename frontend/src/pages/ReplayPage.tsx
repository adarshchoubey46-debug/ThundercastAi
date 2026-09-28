import React, { useState, useEffect } from 'react';
import type { HistoricalFrame } from '../types/weather';
import { fetchHistory } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  History,
  CheckCircle2,
  XCircle,
  Thermometer,
  Zap,
  Activity
} from 'lucide-react';

export const ReplayPage: React.FC = () => {
  const [frames, setFrames] = useState<HistoricalFrame[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReplay() {
      setLoading(true);
      const data = await fetchHistory();
      setFrames(data);
      setLoading(false);
    }
    loadReplay();
  }, []);

  // Timer loop for auto playback
  useEffect(() => {
    let timer: any;
    if (isPlaying && frames.length > 0) {
      const intervalMs = 2000 / playbackSpeed; // 2 seconds per step at 1x
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, frames]);

  if (loading || frames.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-purple-400 font-mono text-sm">
          <Activity className="w-6 h-6 animate-spin" />
          <span>Loading Offline Historical Bhopal Monsoon Replay Dataset...</span>
        </div>
      </div>
    );
  }

  const currentFrame = frames[currentStep];
  const mainObs = currentFrame.observations[0];
  const groundTruth = currentFrame.ground_truth_label;

  // Forecast evaluation at current timestamp step
  const forecastedThunderstorm = currentFrame.storm_intensity_phase > 0.45;
  const thunderstormCorrect = forecastedThunderstorm === groundTruth.thunderstorm_occurred;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <span>Historical Storm Event Replay Engine</span>
          </h2>
          <p className="text-xs text-gray-400">
            Playback of Bhopal Monsoon Storm Event (12 Steps, 5-Min Intervals) | Offline Guaranteed
          </p>
        </div>

        <ProvenanceBadge
          sourceType="HISTORICAL_REPLAY"
          sourceName="BHOPAL_MONSOON_ARCHIVE_2025"
        />
      </div>

      {/* Main Playback Controls Bar */}
      <div className="glass-card p-6 space-y-4 border-l-4 border-l-purple-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Play / Pause / Step / Reset Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-xl font-bold flex items-center space-x-2 transition ${
                isPlaying ? 'bg-amber-500 text-gray-950' : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span className="text-xs">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={() => setCurrentStep((prev) => Math.min(frames.length - 1, prev + 1))}
              disabled={currentStep >= frames.length - 1}
              className="p-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl border border-gray-800 transition"
              title="Step Forward (+5 Min)"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
              className="p-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl border border-gray-800 transition"
              title="Reset Timeline"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Timestamp Display */}
          <div className="text-center font-mono">
            <div className="text-xs text-gray-400">Replay Timestamp (Step {currentStep + 1} of {frames.length}):</div>
            <div className="text-xl font-bold text-purple-300">{currentFrame.time_display}</div>
          </div>

          {/* Speed Toggles */}
          <div className="flex items-center space-x-1.5 bg-gray-900 p-1.5 rounded-lg border border-gray-800 text-xs">
            <span className="text-gray-400 font-mono px-2">Speed:</span>
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2.5 py-1 rounded font-mono font-bold transition ${
                  playbackSpeed === speed
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

        </div>

        {/* Timeline Slider */}
        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="0"
            max={frames.length - 1}
            value={currentStep}
            onChange={(e) => setCurrentStep(Number(e.target.value))}
            className="w-full h-2.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
          />
          <div className="flex justify-between text-xs font-mono text-gray-400">
            <span>Step 0 (T-60m)</span>
            <span>Peak Intensity Phase</span>
            <span>Step 11 (T-0m)</span>
          </div>
        </div>
      </div>

      {/* Grid: Historical Observations vs Forecast vs Actual Ground Truth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Atmospheric Telemetry at Selected Step */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-gray-800">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            <span>Replay Atmospheric State</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">Temperature:</span>
              <span className="text-white font-bold">{mainObs.temperature_c}°C</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">Humidity:</span>
              <span className="text-white font-bold">{mainObs.humidity_pct}%</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">Radar Reflectivity:</span>
              <span className="text-yellow-400 font-bold">{mainObs.radar_reflectivity_dbz} dBZ</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">Rainfall Rate:</span>
              <span className="text-blue-400 font-bold">{mainObs.rainfall_mm_hr} mm/h</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">Lightning Strikes:</span>
              <span className="text-purple-400 font-bold">{mainObs.lightning_flashes_count} flashes</span>
            </div>
          </div>
        </div>

        {/* Col 2: Model Prediction State at Step */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-gray-800">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Forecast Prediction State</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Storm Intensity Phase:</span>
                <span className="font-mono text-purple-400 font-bold">{(currentFrame.storm_intensity_phase * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${currentFrame.storm_intensity_phase * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 bg-gray-900/80 rounded border border-gray-800 space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Thunderstorm Predicted:</span>
                <span className={`font-bold ${forecastedThunderstorm ? 'text-red-400' : 'text-emerald-400'}`}>
                  {forecastedThunderstorm ? 'YES (HIGH RISK)' : 'NO (LOW)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Heavy Rain Predicted:</span>
                <span className={`font-bold ${mainObs.rainfall_mm_hr! > 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {mainObs.rainfall_mm_hr! > 25 ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Actual Recorded Ground-Truth Comparison */}
        <div className="glass-card p-5 space-y-4 border-l-4 border-l-cyan-500">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-gray-800">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Ground-Truth Verification</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-gray-900/80 rounded border border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span>Actual Thunderstorm:</span>
                <span className="font-bold text-white">
                  {groundTruth.thunderstorm_occurred ? 'OCCURRED' : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Actual Lightning Strikes:</span>
                <span className="font-bold text-white">
                  {groundTruth.lightning_occurred ? 'RECORDED' : 'NONE'}
                </span>
              </div>
            </div>

            {/* Verification Diff Result */}
            <div className={`p-3 rounded border text-xs flex items-center space-x-2 ${
              thunderstormCorrect
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                : 'bg-red-950/40 text-red-300 border-red-800'
            }`}>
              {thunderstormCorrect ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>
                {thunderstormCorrect
                  ? 'Forecast Match — Predicted state matches ground truth.'
                  : 'Forecast Variance — Prediction differed from ground observation.'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
