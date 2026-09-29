import type { SourceType, DataQuality } from '../../types/weather';
import { useTranslation } from '../../i18n';
import { ShieldAlert, Database, Cpu, History, Eye } from 'lucide-react';

interface ProvenanceBadgeProps {
  sourceType: SourceType;
  sourceName?: string;
  dataQuality?: DataQuality;
  compact?: boolean;
}

export const ProvenanceBadge = ({
  sourceType,
  sourceName,
  compact = false
}: ProvenanceBadgeProps) => {
  const { t } = useTranslation();
  let badgeClass = 'badge-provenance-observation';
  let icon = <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-400" />;
  let label = 'DATA FEED';

  switch (sourceType) {
    case 'REAL_OBSERVATION':
      badgeClass = 'badge-provenance-observation';
      icon = <Eye className="w-3.5 h-3.5 mr-1 text-blue-400" />;
      label = 'REAL OBSERVATION';
      break;
    case 'HISTORICAL_REPLAY':
      badgeClass = 'badge-provenance-replay';
      icon = <History className="w-3.5 h-3.5 mr-1 text-purple-400" />;
      label = 'HISTORICAL REPLAY';
      break;
    case 'MODEL_PREDICTION':
      badgeClass = 'badge-provenance-prediction';
      icon = <Cpu className="w-3.5 h-3.5 mr-1 text-cyan-400" />;
      label = 'MODEL PREDICTION';
      break;
    default:
      badgeClass = 'badge-provenance-observation';
      icon = <Database className="w-3.5 h-3.5 mr-1 text-amber-400" />;
      label = 'DATA FEED';
      break;
  }

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>
        {icon}
        {t(label)}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-900/80 border border-gray-800">
      <span className={`inline-flex items-center px-2 py-0.5 rounded ${badgeClass}`}>
        {icon}
        {t(label)}
      </span>
      {sourceName && (
        <span className="text-gray-400 text-[11px] truncate max-w-[180px]" title={sourceName}>
          {sourceName}
        </span>
      )}
    </div>
  );
};
