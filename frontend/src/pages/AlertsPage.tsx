import React, { useState, useEffect, useRef } from 'react';
import type { Alert, AtmosphericObservation } from '../types/weather';
import { fetchAlerts, fetchObservations } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { SafetyPage } from './SafetyPage';
import { useTranslation } from '../i18n';
import {
  Bell,
  AlertTriangle,
  Send,
  Clock,
  MapPin,
  BellRing,
  Building2,
  Hospital,
  School,
  ShieldCheck
} from 'lucide-react';

interface AlertsPageProps {
  active: boolean;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ active }) => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [targetArea, setTargetArea] = useState<string>('Bhopal Central & MP Nagar');
  const [simulatedRisk, setSimulatedRisk] = useState<Alert['risk_level']>('SEVERE');
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [organizationType, setOrganizationType] = useState<'school' | 'hospital'>('school');
  const [dispatchPreview, setDispatchPreview] = useState<{
    risk: Alert['risk_level'];
    area: string;
    organization: 'school' | 'hospital';
    measures: string;
  } | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('Checking observations...');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const previousAutoAlertIds = useRef<Set<string>>(new Set());
  const completedInitialCheck = useRef(false);

  useEffect(() => {
    let mounted = true;
    const assessConditions = async () => {
      const [advisories, observations] = await Promise.all([fetchAlerts(), fetchObservations()]);
      if (!mounted) return;

      const automaticAlerts = observations.flatMap((observation: AtmosphericObservation) => {
        const factors: string[] = [];
        const rain = observation.rainfall_mm_hr ?? 0;
        const reflectivity = observation.radar_reflectivity_dbz ?? 0;
        const lightning = observation.lightning_flashes_count;

        if (reflectivity >= 45) factors.push(`Radar reflectivity ${reflectivity} dBZ (screening threshold: 45 dBZ)`);
        if (rain >= 30) factors.push(`Rainfall rate ${rain} mm/h (screening threshold: 30 mm/h)`);
        if (lightning >= 20) factors.push(`Lightning activity ${lightning} flashes (screening threshold: 20)`);
        if (factors.length === 0) return [];

        const severeConditions = reflectivity >= 55 || rain >= 50 || lightning >= 35;
        const riskLevel: Alert['risk_level'] = severeConditions ? 'SEVERE' : factors.length > 1 ? 'HIGH' : 'MODERATE';
        const stationName = observation.location.location_name;

        return [{
          id: `AUTO-${observation.location.station_id ?? stationName}-${riskLevel}`,
          risk_level: riskLevel,
          title: `Automated ${riskLevel.toLowerCase()} screening: ${stationName}`,
          hazard_type: 'Thunderstorm and heavy rainfall screening',
          affected_area: stationName,
          issue_time: observation.timestamp,
          expected_window: 'Review current conditions',
          explanation: factors.join('; '),
          trigger_factors: factors,
          source_type: 'MODEL_PREDICTION' as const
        }];
      });

      const newAutomaticAlerts = automaticAlerts.filter((alert) => !previousAutoAlertIds.current.has(alert.id));
      if (completedInitialCheck.current && notificationPermission === 'granted') {
        newAutomaticAlerts.filter((alert) => alert.risk_level === 'HIGH' || alert.risk_level === 'SEVERE').forEach((alert) => {
          new Notification(`MeghDoot · ${t(alert.risk_level)} ${t('screening')}`, {
            body: `${t(alert.affected_area)}: ${alert.trigger_factors.map(t).join('; ')}`
          });
        });
      }

      previousAutoAlertIds.current = new Set(automaticAlerts.map((alert) => alert.id));
      completedInitialCheck.current = true;
      setAlerts([...automaticAlerts, ...advisories]);
      setLastChecked(new Date().toLocaleTimeString());
    };

    void assessConditions();
    const timer = window.setInterval(() => void assessConditions(), 60_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [notificationPermission]);

  const enableDesktopAlerts = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return;
    }
    setNotificationPermission(await Notification.requestPermission());
  };

  const simulateRiskAlert = () => {
    const timestamp = new Date().toLocaleTimeString();
    const responseMeasures = organizationType === 'school'
      ? 'Move students and staff into a sturdy enclosed building, keep everyone away from windows, cancel outdoor activities, and follow district emergency instructions.'
      : 'Secure patients and staff indoors, protect essential power and communications, pause non-essential transfers during severe weather, and follow facility emergency procedures.';
    setDispatchPreview({ risk: simulatedRisk, area: targetArea, organization: organizationType, measures: responseMeasures });
    setSimulationLog((current) => [
      `[${timestamp}] ${t('Preview prepared for')} ${t(organizationType)} · ${t(simulatedRisk)} ${t('risk')} · ${t(targetArea)}`,
      ...current
    ]);
  };

  const elevatedAlerts = alerts.filter((alert) => alert.risk_level === 'HIGH' || alert.risk_level === 'SEVERE');

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
    <div className={active ? 'space-y-6' : 'hidden'} aria-hidden={!active}>
      
      {/* Top Header Card */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>{t('Hazard Risk Classification & Emergency Alert Management')}</span>
          </h2>
          <p className="text-xs text-gray-400">
            {t('Station observations are screened every minute for rising rainfall, radar, and lightning thresholds.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[11px] text-gray-500" aria-live="polite">{t('Last scan:')} {lastChecked}</div>
          <button
            type="button"
            onClick={enableDesktopAlerts}
            disabled={notificationPermission === 'granted' || notificationPermission === 'denied' || notificationPermission === 'unsupported'}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold disabled:opacity-60"
          >
            <BellRing className="inline w-3.5 h-3.5 mr-1.5" />
            {t(notificationPermission === 'granted' ? 'Desktop alerts enabled' : notificationPermission === 'denied' ? 'Notifications blocked' : notificationPermission === 'unsupported' ? 'Notifications unavailable' : 'Enable desktop alerts')}
          </button>
        </div>
      </div>

      {/* Main Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Warnings */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>{t('Active Warning Advisories')} ({alerts.length})</span>
          </h3>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="glass-card p-5 border-l-4 border-l-red-500 space-y-4 hover:border-red-400 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded ${getRiskClass(alert.risk_level)}`}>
                      {t(alert.risk_level)} {t('RISK')}
                    </span>
                    <h4 className="text-sm font-bold text-white">{t(alert.title)}</h4>
                  </div>
                  <ProvenanceBadge sourceType={alert.source_type} sourceName={alert.id} compact />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>{t('Affected Area:')}</strong> {t(alert.affected_area)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span><strong>{t('Hazard Window:')}</strong> {t(alert.expected_window)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded border border-gray-800">
                  {t(alert.explanation)}
                </p>

                {/* Trigger Factors List */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-gray-400">{t('Trigger Conditions Met:')}</span>
                  <div className="flex flex-wrap gap-2">
                    {alert.trigger_factors.map((factor, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-800 text-cyan-300 rounded border border-gray-700 text-[11px] font-mono">
                        {t(factor)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch status */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>{t('Broadcast Dispatch Log')}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">{t('Target area:')}</label>
              <select
                value={targetArea}
                onChange={(e) => setTargetArea(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-white font-mono"
              >
                <option>{t('Bhopal Central & MP Nagar')}</option>
                <option>{t('Upper Lake')}</option>
                <option>{t('Indrapuri')}</option>
                <option>{t('Kolar Road')}</option>
                <option>{t('Mandideep')}</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">{t('Simulate risk level:')}</label>
              <select
                value={simulatedRisk}
                onChange={(e) => setSimulatedRisk(e.target.value as Alert['risk_level'])}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-white font-mono"
              >
                <option value="LOW">{t('LOW')}</option>
                <option value="MODERATE">{t('MODERATE')}</option>
                <option value="HIGH">{t('HIGH')}</option>
                <option value="SEVERE">{t('SEVERE')}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={simulateRiskAlert}
              className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-[#12345a] border border-amber-300 font-bold rounded text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('Simulate risk alert')}</span>
            </button>
          </div>

          {/* Broadcast Log */}
          <div className="space-y-2 pt-3 border-t border-gray-800">
            <span className="text-xs font-bold text-gray-400">{t('Current feed:')}</span>
            <div className="space-y-2 max-h-55 overflow-y-auto font-mono text-[11px]">
              {alerts.filter((alert) => alert.affected_area.includes(targetArea.split(' &')[0])).map((alert) => (
                <div key={alert.id} className="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded text-cyan-800">
                  <div className="font-bold">{t(alert.risk_level)} · {t(alert.affected_area)}</div>
                  <div>{alert.issue_time} · {t(alert.hazard_type)}</div>
                </div>
              ))}
              {alerts.filter((alert) => alert.affected_area.includes(targetArea.split(' &')[0])).length === 0 && (
                <div className="text-[11px] text-gray-500 italic p-3 bg-gray-900/50 rounded border border-gray-800">
                  {t('No active dispatch for the selected area.')}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-gray-400">{t('Trigger log:')}</span>
            <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-[11px]">
              {simulationLog.length === 0 ? (
                <div className="text-[11px] text-gray-500 italic p-3 bg-gray-900/50 rounded border border-gray-800">
                  {t('No risk triggers evaluated.')}
                </div>
              ) : simulationLog.map((entry, index) => (
                <div key={`${entry}-${index}`} className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded text-amber-800">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <section className="glass-card p-5 space-y-4" aria-labelledby="area-coordination-heading">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#175a91]" />
          <div>
            <h3 id="area-coordination-heading" className="text-sm font-bold text-gray-800">{t('High-risk area coordination')}</h3>
            <p className="mt-1 text-xs text-gray-600">{t('Organization counts and government-authorized shelters require a verified local directory, which is not connected to this prototype.')}</p>
          </div>
        </div>

        {elevatedAlerts.length > 0 ? (
          <div className="space-y-3">
            {elevatedAlerts.map((alert) => (
              <article key={`coordination-${alert.id}`} className="rounded-sm border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-gray-800">{t(alert.risk_level)} · {t(alert.affected_area)}</div>
                  <span className="text-[11px] text-gray-600">{t(alert.expected_window)}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-sm border border-gray-200 bg-white p-3 text-xs">
                    <School className="mb-1 h-4 w-4 text-[#175a91]" />
                    <strong>{t('Nearby schools')}</strong>
                    <p className="mt-1 text-gray-600">{t('Count unavailable · verified directory not connected')}</p>
                  </div>
                  <div className="rounded-sm border border-gray-200 bg-white p-3 text-xs">
                    <Hospital className="mb-1 h-4 w-4 text-red-700" />
                    <strong>{t('Nearby hospitals')}</strong>
                    <p className="mt-1 text-gray-600">{t('Count unavailable · verified directory not connected')}</p>
                  </div>
                  <div className="rounded-sm border border-gray-200 bg-white p-3 text-xs">
                    <ShieldCheck className="mb-1 h-4 w-4 text-emerald-700" />
                    <strong>{t('Authorized shelters')}</strong>
                    <p className="mt-1 text-gray-600">{t('No verified government shelter directory is available.')}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">{t('No HIGH or SEVERE alert is currently available. Organization counts are not estimated.')}</p>
        )}

        <div className="grid gap-4 border-t border-gray-200 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700">{t('Organization response preview')}</h4>
            <label className="block text-xs text-gray-600" htmlFor="organization-type">{t('Preview guidance for')}</label>
            <select id="organization-type" value={organizationType} onChange={(event) => setOrganizationType(event.target.value as 'school' | 'hospital')} className="w-full rounded-sm border border-gray-300 bg-white p-2 text-xs text-gray-800">
              <option value="school">{t('School')}</option>
              <option value="hospital">{t('Hospital')}</option>
            </select>
            <button type="button" onClick={simulateRiskAlert} className="inline-flex items-center gap-2 rounded-sm border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-amber-200">
              <Send className="h-3.5 w-3.5" /> {t('Prepare response preview')}
            </button>
          </div>
          <div role="status" className="min-h-20 whitespace-pre-line rounded-sm border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
            {dispatchPreview
              ? [
                `${t(dispatchPreview.risk)} ${t('risk')} · ${t(dispatchPreview.area)}`,
                t(dispatchPreview.measures),
                t('Preview only: no organization recipients are configured and no message was sent.')
              ].join('\n')
              : t('No message prepared. This prototype does not send messages to schools, hospitals, or other organizations.')}
          </div>
        </div>
        <p className="text-[11px] text-amber-800">{t('Do not use this prototype to issue public warnings. Verify alerts, recipients, shelters, and response procedures with the appropriate district authority before operational use.')}</p>
      </section>

      <SafetyPage />

    </div>
  );
};
