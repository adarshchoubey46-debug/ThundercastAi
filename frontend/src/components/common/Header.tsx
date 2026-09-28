import { useState, useEffect } from 'react';
import {
  Zap,
  LayoutDashboard,
  Map,
  Clock,
  Bell,
  RotateCcw,
  BarChart2,
  Database,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Weather Map', icon: Map },
    { id: 'nowcast', label: 'Nowcasting', icon: Clock },
    { id: 'alerts', label: 'Alerts & Risks', icon: Bell },
    { id: 'replay', label: 'Historical Replay', icon: RotateCcw },
    { id: 'performance', label: 'Model Metrics', icon: BarChart2 },
    { id: 'sources', label: 'Data Sources', icon: Database },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass-nav px-4 py-3 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Location */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                  ThunderCast AI
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase font-mono">
                  v1.0 Demo
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span>Region: Bhopal, MP, India (23.2599°N, 77.4126°E)</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-800 overflow-x-auto max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls & Timestamp */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setShowDisclaimer(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition"
              title="View Meteorological Disclaimer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prototype Disclaimer</span>
            </button>
            <div className="text-right font-mono text-gray-400 text-[11px]">
              <div>{currentTime || 'Syncing...'}</div>
            </div>
          </div>

        </div>
      </header>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border border-amber-500/30">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-lg">
              <AlertTriangle className="w-6 h-6" />
              <h2>Meteorological Notice</h2>
            </div>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                <strong>ThunderCast AI Prototype Notice:</strong>
              </p>
              <p className="bg-amber-950/40 p-3 rounded border border-amber-800/50 text-amber-200 text-xs font-mono">
                "Prototype risk thresholds — not official government warnings. DEMO / SYNTHETIC DATA — NOT A REAL-WORLD VALIDATION."
              </p>
              <p className="text-xs text-gray-400">
                All hazard probabilities and nowcast forecasts are generated for software pipeline evaluation. For official emergency advisories, refer to the India Meteorological Department (IMD).
              </p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-lg text-xs transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
};
