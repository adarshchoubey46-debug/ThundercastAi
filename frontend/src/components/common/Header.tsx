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
      <header className="sticky top-0 z-50 glass-nav border-b">
        <div className="border-b border-gray-800 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-[11px] text-gray-500">
            <span>Thunderstorm and lightning nowcasting · Bhopal, Madhya Pradesh</span>
            <span className="hidden sm:inline">Coordinates: 23.2599°N, 77.4126°E</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#12345a] text-white flex items-center justify-center rounded-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl leading-tight font-bold text-[#12345a]">ThunderCast AI</h1>
              <p className="text-xs text-gray-500">Regional Weather Intelligence Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setShowDisclaimer(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/40 text-amber-400 border border-amber-800/50 rounded-sm"
              title="View Meteorological Disclaimer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Prototype · Not an official warning</span>
            </button>
            <div className="hidden md:block text-right text-gray-500">
              <div className="font-semibold text-gray-700">System time</div>
              <div>{currentTime || 'Syncing...'}</div>
            </div>
          </div>
        </div>

        <nav aria-label="Main navigation" className="max-w-7xl mx-auto px-4 mt-4 flex items-center gap-1 overflow-x-auto border-t border-gray-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-3 border-b-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-[#175a91] text-[#12345a]'
                      : 'border-transparent text-gray-500 hover:text-[#12345a] hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </nav>
      </header>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div role="dialog" aria-modal="true" aria-labelledby="notice-title" className="glass-card max-w-md w-full p-6 space-y-4 border border-amber-500/30">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-lg">
              <AlertTriangle className="w-6 h-6" />
              <h2 id="notice-title">Meteorological Notice</h2>
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
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-sm text-xs transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
};
