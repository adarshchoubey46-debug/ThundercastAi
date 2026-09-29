import React, { useState, useEffect } from 'react';
import type { HistoricalFrame } from '../types/weather';
import { fetchHistory } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { useTranslation } from '../i18n';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Download,
  History,
  CheckCircle2,
  XCircle,
  Thermometer,
  Zap,
  Activity
} from 'lucide-react';

export const ReplayPage: React.FC = () => {
  const { t } = useTranslation();
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
    let timer: ReturnType<typeof setInterval> | undefined;
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))) return;

      if (event.code === 'Space') {
        if (target instanceof HTMLElement && target.tagName === 'BUTTON') return;
        event.preventDefault();
        setIsPlaying((playing) => !playing);
      } else if (event.key === 'ArrowRight') {
        setCurrentStep((step) => Math.min(frames.length - 1, step + 1));
      } else if (event.key === 'ArrowLeft') {
        setCurrentStep((step) => Math.max(0, step - 1));
      } else if (event.key === 'Home') {
        setIsPlaying(false);
        setCurrentStep(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length]);

  if (loading || frames.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-purple-400 font-mono text-sm">
          <Activity className="w-6 h-6 animate-spin" />
          <span>{t('Loading Historical Bhopal Monsoon Replay...')}</span>
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
  const replayProgress = frames.length > 1 ? currentStep / (frames.length - 1) : 0;
  const stormX = 110 + replayProgress * 520;
  const stormRadius = 22 + currentFrame.storm_intensity_phase * 54;

  const exportReplay = () => {
    const escapeCsv = (value: string | number | boolean | null | undefined) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [
      ['timestamp', 'step', 'location', 'temperature_c', 'humidity_pct', 'rainfall_mm_hr', 'reflectivity_dbz', 'lightning_flashes', 'storm_intensity_pct', 'thunderstorm_observed', 'lightning_observed', 'heavy_rain_observed'],
      ...frames.flatMap((frame) => frame.observations.map((observation) => [
        frame.timestamp,
        frame.step_index,
        observation.location.location_name,
        observation.temperature_c,
        observation.humidity_pct,
        observation.rainfall_mm_hr,
        observation.radar_reflectivity_dbz,
        observation.lightning_flashes_count,
        Math.round(frame.storm_intensity_phase * 100),
        frame.ground_truth_label.thunderstorm_occurred,
        frame.ground_truth_label.lightning_occurred,
        frame.ground_truth_label.heavy_rain_occurred
      ]))
    ];
    const content = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const file = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meghdoot-bhopal-replay.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <span>{t('Historical Storm Event Replay Engine')}</span>
          </h2>
          <p className="text-xs text-gray-400">
            {t('Playback of Bhopal Monsoon Storm Event (12 Steps, 5-Min Intervals)')}
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
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep <= 0}
              className="p-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl border border-gray-800 transition"
              title={t('Step Back (-5 Min)')}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-3 rounded-xl font-bold flex items-center space-x-2 transition ${
                isPlaying ? 'bg-amber-500 text-gray-950' : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span className="text-xs">{t(isPlaying ? 'PAUSE' : 'PLAY')}</span>
            </button>

            <button
              onClick={() => setCurrentStep((prev) => Math.min(frames.length - 1, prev + 1))}
              disabled={currentStep >= frames.length - 1}
              className="p-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl border border-gray-800 transition"
              title={t('Step Forward (+5 Min)')}
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
              className="p-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl border border-gray-800 transition"
              title={t('Reset Timeline')}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Timestamp Display */}
          <div className="text-center font-mono">
            <div className="text-xs text-gray-400">{t('Replay Timestamp (Step')} {currentStep + 1} {t('of')} {frames.length}):</div>
            <div className="text-xl font-bold text-purple-300">{currentFrame.time_display}</div>
          </div>

          {/* Speed Toggles */}
          <div className="flex items-center space-x-1.5 bg-gray-900 p-1.5 rounded-lg border border-gray-800 text-xs">
            <span className="text-gray-400 font-mono px-2">{t('Speed:')}</span>
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
            <button
              onClick={exportReplay}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded hover:bg-slate-50"
              title={t('Download all replay frames as CSV')}
            >
              <Download className="w-4 h-4" />
              <span>{t('Export data')}</span>
            </button>

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
            <span>{t('Step 0 (T-60m)')}</span>
            <span>{t('Peak Intensity Phase')}</span>
            <span>{t('Step 11 (T-0m)')}</span>
          </div>
        </div>
      </div>

      <section className="glass-card overflow-hidden" aria-label={t('Animated storm replay')}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{t('Storm track playback')}</h3>
            <p className="text-xs text-gray-500">{currentFrame.time_display} · {mainObs.location.location_name}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">{t('Intensity')}</span>
            <span className="font-bold text-amber-800">{Math.round(currentFrame.storm_intensity_phase * 100)}%</span>
            <span className={`px-2 py-1 rounded-sm font-semibold ${forecastedThunderstorm ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {t(forecastedThunderstorm ? 'Thunderstorm conditions' : 'Pre-storm conditions')}
            </span>
          </div>
        </div>
        <div className="replay-stage">
          <svg viewBox="0 0 760 280" role="img" aria-label={`Storm visualization for ${currentFrame.time_display}, intensity ${Math.round(currentFrame.storm_intensity_phase * 100)} percent`}>
            <rect width="760" height="280" fill="#edf3f4" />
            <path d="M0 48H760M0 104H760M0 160H760M0 216H760M100 0V280M220 0V280M340 0V280M460 0V280M580 0V280M700 0V280" className="replay-grid" />
            <path d="M0 211C102 178 164 231 244 194S386 199 465 147 615 148 760 81" className="replay-route" />
            <path d="M0 251C123 232 188 260 308 232S536 240 760 185" className="replay-waterway" />
            <text x="18" y="26" className="replay-map-label">{t('BHOPAL DISTRICT · HISTORICAL EVENT')}</text>
            <text x="28" y="195" className="replay-map-label replay-map-small">BAIRAGARH</text>
            <text x="328" y="137" className="replay-map-label replay-map-small">BHOPAL CENTRAL</text>
            <text x="610" y="83" className="replay-map-label replay-map-small">KOLAR</text>
            <circle cx="92" cy="201" r="5" className="replay-station" />
            <circle cx="370" cy="149" r="5" className="replay-station" />
            <circle cx="654" cy="94" r="5" className="replay-station" />
            <circle cx={stormX} cy={176 - replayProgress * 85} r={stormRadius} className="replay-storm-halo" />
            <circle cx={stormX} cy={176 - replayProgress * 85} r={Math.max(8, stormRadius * 0.34)} className="replay-storm-core" />
            <circle cx={stormX} cy={176 - replayProgress * 85} r={stormRadius + 11} className="replay-storm-ring" />
            {groundTruth.lightning_occurred && (
              <g className="replay-lightning" transform={`translate(${stormX + 5} ${156 - replayProgress * 85})`}>
                <path d="M0 0L-9 15H-2L-6 28L8 10H1L6 0Z" />
              </g>
            )}
            <g transform="translate(585 241)">
              <circle cx="0" cy="0" r="7" className="replay-storm-core" />
              <text x="13" y="4" className="replay-legend-label">{t('Storm core')}</text>
              <circle cx="107" cy="0" r="5" className="replay-station" />
              <text x="120" y="4" className="replay-legend-label">{t('Weather station')}</text>
            </g>
          </svg>
          <div className="replay-stage-footer">
            <span>{t('MONSOON EVENT · 5-MINUTE OBSERVATION STEPS')}</span>
            <span>{currentStep + 1} / {frames.length}</span>
          </div>
        </div>
      </section>

      {/* Grid: Historical Observations vs Forecast vs Actual Ground Truth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: Atmospheric Telemetry at Selected Step */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-gray-800">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            <span>{t('Replay Atmospheric State')}</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">{t('Temperature:')}</span>
              <span className="text-white font-bold">{mainObs.temperature_c}°C</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">{t('Humidity:')}</span>
              <span className="text-white font-bold">{mainObs.humidity_pct}%</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">{t('Radar Reflectivity:')}</span>
              <span className="text-yellow-400 font-bold">{mainObs.radar_reflectivity_dbz} dBZ</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">{t('Rainfall Rate:')}</span>
              <span className="text-blue-400 font-bold">{mainObs.rainfall_mm_hr} mm/h</span>
            </div>
            <div className="flex justify-between bg-gray-900/60 p-2.5 rounded border border-gray-800">
              <span className="text-gray-400">{t('Lightning Strikes:')}</span>
              <span className="text-purple-400 font-bold">{mainObs.lightning_flashes_count} flashes</span>
            </div>
          </div>
        </div>

        {/* Col 2: Model Prediction State at Step */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-gray-800">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>{t('Forecast Prediction State')}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>{t('Storm Intensity Phase:')}</span>
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
                <span>{t('Thunderstorm Predicted:')}</span>
                <span className={`font-bold ${forecastedThunderstorm ? 'text-red-400' : 'text-emerald-400'}`}>
                  {t(forecastedThunderstorm ? 'YES (HIGH RISK)' : 'NO (LOW)')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('Heavy Rain Predicted:')}</span>
                <span className={`font-bold ${mainObs.rainfall_mm_hr! > 25 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {t(mainObs.rainfall_mm_hr! > 25 ? 'YES' : 'NO')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Actual Recorded Ground-Truth Comparison */}
        <div className="glass-card p-5 space-y-4 border-l-4 border-l-cyan-500">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-gray-800">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{t('Ground-Truth Verification')}</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-gray-900/80 rounded border border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span>{t('Actual Thunderstorm:')}</span>
                <span className="font-bold text-white">
                  {t(groundTruth.thunderstorm_occurred ? 'OCCURRED' : 'NONE')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('Actual Lightning Strikes:')}</span>
                <span className="font-bold text-white">
                  {t(groundTruth.lightning_occurred ? 'RECORDED' : 'NONE')}
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
                {t(thunderstormCorrect
                  ? 'Forecast Match — Predicted state matches ground truth.'
                  : 'Forecast Variance — Prediction differed from ground observation.')}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
