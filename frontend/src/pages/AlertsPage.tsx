import React, { useState, useEffect, useRef } from 'react';
import type { Alert, AtmosphericObservation } from '../types/weather';
import { fetchAlerts, fetchObservations } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  Bell,
  AlertTriangle,
  Send,
  Clock,
  MapPin,
  BellRing
} from 'lucide-react';

interface AlertsPageProps {
  active: boolean;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ active }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [targetArea, setTargetArea] = useState<string>('Bhopal Central & MP Nagar');
  const [simulatedRisk, setSimulatedRisk] = useState<Alert['risk_level']>('SEVERE');
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
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
          new Notification(`MeghDoot · ${alert.risk_level} screening`, {
            body: `${alert.affected_area}: ${alert.trigger_factors.join('; ')}`
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
    setSimulationLog((current) => [
      `[${timestamp}] ${simulatedRisk} risk trigger evaluated for ${targetArea}`,
      ...current
    ]);
  };

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
            <span>Hazard Risk Classification & Emergency Alert Management</span>
          </h2>
          <p className="text-xs text-gray-400">
            Station observations are screened every minute for rising rainfall, radar, and lightning thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[11px] text-gray-500" aria-live="polite">Last scan: {lastChecked}</div>
          <button
            type="button"
            onClick={enableDesktopAlerts}
            disabled={notificationPermission === 'granted' || notificationPermission === 'denied' || notificationPermission === 'unsupported'}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold disabled:opacity-60"
          >
            <BellRing className="inline w-3.5 h-3.5 mr-1.5" />
            {notificationPermission === 'granted' ? 'Desktop alerts enabled' : notificationPermission === 'denied' ? 'Notifications blocked' : notificationPermission === 'unsupported' ? 'Notifications unavailable' : 'Enable desktop alerts'}
          </button>
        </div>
      </div>

      {/* Main Alert Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Warnings */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Active Warning Advisories ({alerts.length})</span>
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
                      {alert.risk_level} RISK
                    </span>
                    <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                  </div>
                  <ProvenanceBadge sourceType={alert.source_type} sourceName={alert.id} compact />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span><strong>Affected Area:</strong> {alert.affected_area}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span><strong>Hazard Window:</strong> {alert.expected_window}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 bg-gray-900/60 p-3 rounded border border-gray-800">
                  {alert.explanation}
                </p>

                {/* Trigger Factors List */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-gray-400">Trigger Conditions Met:</span>
                  <div className="flex flex-wrap gap-2">
                    {alert.trigger_factors.map((factor, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-800 text-cyan-300 rounded border border-gray-700 text-[11px] font-mono">
                        {factor}
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
            <span>Broadcast Dispatch Log</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Target area:</label>
              <select
                value={targetArea}
                onChange={(e) => setTargetArea(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-white font-mono"
              >
                <option>Bhopal Central &amp; MP Nagar</option>
                <option>Upper Lake</option>
                <option>Indrapuri</option>
                <option>Kolar Road</option>
                <option>Mandideep</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Simulate risk level:</label>
              <select
                value={simulatedRisk}
                onChange={(e) => setSimulatedRisk(e.target.value as Alert['risk_level'])}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-white font-mono"
              >
                <option value="LOW">LOW</option>
                <option value="MODERATE">MODERATE</option>
                <option value="HIGH">HIGH</option>
                <option value="SEVERE">SEVERE</option>
              </select>
            </div>
            <button
              type="button"
              onClick={simulateRiskAlert}
              className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-[#12345a] border border-amber-300 font-bold rounded text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate risk alert</span>
            </button>
          </div>

          {/* Broadcast Log */}
          <div className="space-y-2 pt-3 border-t border-gray-800">
            <span className="text-xs font-bold text-gray-400">Current feed:</span>
            <div className="space-y-2 max-h-[220px] overflow-y-auto font-mono text-[11px]">
              {alerts.filter((alert) => alert.affected_area.includes(targetArea.split(' &')[0])).map((alert) => (
                <div key={alert.id} className="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded text-cyan-800">
                  <div className="font-bold">{alert.risk_level} · {alert.affected_area}</div>
                  <div>{alert.issue_time} · {alert.hazard_type}</div>
                </div>
              ))}
              {alerts.filter((alert) => alert.affected_area.includes(targetArea.split(' &')[0])).length === 0 && (
                <div className="text-[11px] text-gray-500 italic p-3 bg-gray-900/50 rounded border border-gray-800">
                  No active dispatch for the selected area.
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-gray-400">Trigger log:</span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto font-mono text-[11px]">
              {simulationLog.length === 0 ? (
                <div className="text-[11px] text-gray-500 italic p-3 bg-gray-900/50 rounded border border-gray-800">
                  No risk triggers evaluated.
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

    </div>
  );
};
