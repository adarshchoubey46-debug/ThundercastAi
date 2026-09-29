import { useState } from 'react';
import { Activity, Check, CircleAlert, CircleCheck, CircleHelp, CircleX, Eye, FlaskConical, X } from 'lucide-react';
import type { DataFeedHealth, DataPipelineHealth } from '../../types/weather';

interface DataFeedHealthSectionProps {
  health: DataPipelineHealth | null;
  onRetry: () => void;
}

function formatAge(seconds: number | null): string {
  if (seconds === null) return 'No successful update';
  if (seconds < 60) return `${Math.floor(seconds)} sec`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ${Math.floor(seconds % 60)} sec`;
  return `${Math.floor(seconds / 3600)} hr ${Math.floor((seconds % 3600) / 60)} min`;
}

function formatLatency(milliseconds: number | null): string {
  if (milliseconds === null) return 'Not measured';
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  return `${(milliseconds / 1000).toFixed(2)} sec`;
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'No successful update';
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return 'Invalid timestamp';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: 'short',
    timeZoneName: 'short'
  }).format(timestamp);
}

function statusStyle(status: DataFeedHealth['status'] | DataPipelineHealth['overall_status']) {
  if (status === 'LIVE / HEALTHY' || status === 'HEALTHY') {
    return { badge: 'border-emerald-300 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-600', Icon: CircleCheck };
  }
  if (status === 'STALE') {
    return { badge: 'border-amber-300 bg-amber-50 text-amber-900', dot: 'bg-amber-500', Icon: CircleAlert };
  }
  if (status === 'OFFLINE') {
    return { badge: 'border-red-300 bg-red-50 text-red-800', dot: 'bg-red-600', Icon: CircleX };
  }
  if (status === 'DEMO / SIMULATED') {
    return { badge: 'border-sky-300 bg-sky-50 text-sky-800', dot: 'bg-sky-600', Icon: FlaskConical };
  }
  return { badge: 'border-slate-300 bg-slate-100 text-slate-700', dot: 'bg-slate-500', Icon: CircleHelp };
}

function FeedCard({ source, onDetails }: { source: DataFeedHealth; onDetails: (source: DataFeedHealth) => void }) {
  const style = statusStyle(source.status);
  const StatusIcon = style.Icon;

  return (
    <article className="glass-card flex min-w-0 flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-bold leading-snug text-slate-800">{source.source_name}</h3>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-bold ${style.badge}`}>
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          {source.status}
        </span>
      </div>

      <div className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="text-[10px] font-semibold uppercase text-slate-500">Data age</div>
        <div className="mt-0.5 font-mono text-lg font-bold text-slate-800">{formatAge(source.data_age_seconds)}</div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[11px] leading-relaxed">
        <dt className="text-slate-500">Last update</dt>
        <dd className="text-right font-medium text-slate-700">{formatTimestamp(source.last_update)}</dd>
        <dt className="text-slate-500">Latency</dt>
        <dd className="text-right font-medium text-slate-700">
          {formatLatency(source.latency_ms)}
          {source.latency_scope && <span className="block text-[9px] font-normal text-slate-500">{source.latency_scope}</span>}
        </dd>
        <dt className="text-slate-500">Coverage</dt>
        <dd className="text-right text-slate-700">{source.coverage_area}</dd>
      </dl>

      <div>
        <div className="text-[10px] font-semibold uppercase text-slate-500">Products / parameters</div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{source.products.join(' · ')}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-slate-600" role="status">
          <Check className="h-3.5 w-3.5 shrink-0 text-slate-600" />
          <span className="truncate">{source.confirmation}</span>
        </p>
        <button type="button" onClick={() => onDetails(source)} className="inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold text-[#175a91] hover:bg-blue-50">
          <Eye className="h-3.5 w-3.5" /> Details
        </button>
      </div>
      <StatusIcon className="sr-only" aria-hidden="true" />
    </article>
  );
}

export function DataFeedHealthSection({ health, onRetry }: DataFeedHealthSectionProps) {
  const [selectedSource, setSelectedSource] = useState<DataFeedHealth | null>(null);
  const overallStyle = health ? statusStyle(health.overall_status) : statusStyle('OFFLINE');
  const OverallIcon = overallStyle.Icon;

  return (
    <section aria-labelledby="feed-health-heading" className="glass-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="feed-health-heading" className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Activity className="h-4 w-4 text-[#175a91]" /> Meteorological Data Feed Operational Health
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">Times shown in IST. Demo values are explicitly separated from connected provider data.</p>
        </div>
        {health && (
          <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-bold ${overallStyle.badge}`}>
            <OverallIcon className="h-3.5 w-3.5" /> Pipeline: {health.overall_status}
            {health.overall_health_pct !== null && ` · ${health.overall_health_pct}%`}
          </span>
        )}
      </div>

      {health ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {health.sources.map((source) => <FeedCard key={source.source_id} source={source} onDetails={setSelectedSource} />)}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold tracking-wide text-slate-700">DATA PIPELINE HEALTH</h3>
            <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {health.sources.map((source) => {
                const sourceStyle = statusStyle(source.status);
                return (
                  <div key={source.source_id} className="grid grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-2 text-[11px]">
                    <span className="truncate text-slate-600">{source.source_name}</span>
                    {source.health_score_pct === null ? (
                      <span className={`text-xs font-semibold ${sourceStyle.badge.split(' ').at(-1)}`}>{source.status}</span>
                    ) : (
                      <div className="h-2 overflow-hidden rounded-sm bg-slate-200" role="progressbar" aria-label={`${source.source_name} health`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={source.health_score_pct}>
                        <div className={`h-full ${sourceStyle.dot}`} style={{ width: `${source.health_score_pct}%` }} />
                      </div>
                    )}
                    <span className="text-right font-mono font-semibold text-slate-700">{source.health_score_pct === null ? 'N/A' : `${source.health_score_pct}%`}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-slate-500">
              Fresh ≤ {health.fresh_threshold_seconds}s · stale after {health.stale_threshold_seconds}s · offline after {health.offline_threshold_seconds}s. Health score is age-based and only shown for connected feeds.
            </p>
          </div>
        </>
      ) : (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <span>Data health API is unreachable. Source status is unknown; no live status is assumed.</span>
          <button type="button" onClick={onRetry} className="rounded-sm border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-red-100">Retry health check</button>
        </div>
      )}

      {selectedSource && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSource(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="feed-detail-title" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-slate-300 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Source details</p>
                <h3 id="feed-detail-title" className="mt-1 text-base font-bold text-slate-800">{selectedSource.source_name}</h3>
              </div>
              <button type="button" aria-label="Close source details" onClick={() => setSelectedSource(null)} className="rounded-sm p-1.5 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-3 gap-y-3 text-xs">
              <dt className="font-semibold text-slate-500">Status</dt><dd className="font-semibold text-slate-800">{selectedSource.status}</dd>
              <dt className="font-semibold text-slate-500">Last update</dt><dd className="text-slate-800">{formatTimestamp(selectedSource.last_update)}</dd>
              <dt className="font-semibold text-slate-500">Data age</dt><dd className="text-slate-800">{formatAge(selectedSource.data_age_seconds)}</dd>
              <dt className="font-semibold text-slate-500">Latency</dt><dd className="text-slate-800">{formatLatency(selectedSource.latency_ms)}</dd>
              <dt className="font-semibold text-slate-500">Latency scope</dt><dd className="text-slate-800">{selectedSource.latency_scope ?? 'Not measured'}</dd>
              <dt className="font-semibold text-slate-500">Coverage</dt><dd className="text-slate-800">{selectedSource.coverage_area}</dd>
              <dt className="font-semibold text-slate-500">Products</dt><dd className="text-slate-800">{selectedSource.products.join(' · ')}</dd>
              <dt className="font-semibold text-slate-500">Latest record</dt><dd className="wrap-break-word text-slate-800">{selectedSource.latest_record ?? 'No record available'}</dd>
              <dt className="font-semibold text-slate-500">API/feed status</dt><dd className="text-slate-800">{selectedSource.api_status}</dd>
              <dt className="font-semibold text-slate-500">Last error</dt><dd className="wrap-break-word text-slate-800">{selectedSource.last_error ?? 'None recorded'}</dd>
            </dl>
          </section>
        </div>
      )}
    </section>
  );
}