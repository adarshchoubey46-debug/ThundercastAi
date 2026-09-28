import React, { useState, useEffect } from 'react';
import type { Alert } from '../types/weather';
import { fetchAlerts } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  Bell,
  AlertTriangle,
  Send,
  Clock,
  MapPin
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [demoNotifications, setDemoNotifications] = useState<string[]>([]);
  const [simulatedRisk, setSimulatedRisk] = useState<string>('SEVERE');
  const [simulatedArea, setSimulatedArea] = useState<string>('Bhopal Central & MP Nagar');

  useEffect(() => {
    async function loadAlerts() {
      const data = await fetchAlerts();
      setAlerts(data);
    }
    loadAlerts();
  }, []);

  const handleSimulatePushNotification = () => {
    const timeStr = new Date().toLocaleTimeString();
    const newMsg = `[${timeStr}] DEMO ALERT PUSH: ${simulatedRisk} hazard predicted for ${simulatedArea} within next 15–30 mins.`;
    setDemoNotifications([newMsg, ...demoNotifications]);
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
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>Hazard Risk Classification & Emergency Alert Management</span>
          </h2>
          <p className="text-xs text-gray-400">
            Automated threshold trigger engine based on radar reflectivity and lightning flash density
          </p>
        </div>

        <div className="p-2 bg-amber-950/40 border border-amber-800/50 rounded-lg text-xs text-amber-300 font-mono">
          Prototype risk thresholds — not official government warnings.
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
                        &check; {factor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Interactive Demo Notification Simulator */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            <span>Demo Push Notification Simulator</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Simulate Risk Level:</label>
              <select
                value={simulatedRisk}
                onChange={(e) => setSimulatedRisk(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-white font-mono"
              >
                <option value="LOW">LOW (&lt;30%)</option>
                <option value="MODERATE">MODERATE (30–60%)</option>
                <option value="HIGH">HIGH (60–80%)</option>
                <option value="SEVERE">SEVERE (&gt;80%)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Target Area:</label>
              <input
                type="text"
                value={simulatedArea}
                onChange={(e) => setSimulatedArea(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-white"
              />
            </div>

            <button
              onClick={handleSimulatePushNotification}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Demo Alert Broadcast</span>
            </button>
          </div>

          {/* Broadcast Log */}
          <div className="space-y-2 pt-3 border-t border-gray-800">
            <span className="text-xs font-bold text-gray-400">Broadcast Dispatch Log:</span>
            {demoNotifications.length === 0 ? (
              <div className="text-[11px] text-gray-500 italic p-3 bg-gray-900/50 rounded border border-gray-800">
                No simulated push alerts dispatched yet. Click button above to test notification queue.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto font-mono text-[11px]">
                {demoNotifications.map((msg, i) => (
                  <div key={i} className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded text-amber-200">
                    {msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
