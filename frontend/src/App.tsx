import { useState } from 'react';
import { Header } from './components/common/Header';
import { OverviewPage } from './pages/OverviewPage';
import { MapPage } from './pages/MapPage';
import { NowcastPage } from './pages/NowcastPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReplayPage } from './pages/ReplayPage';
import { PerformancePage } from './pages/PerformancePage';
import { DataSourcesPage } from './pages/DataSourcesPage';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'map' && <MapPage />}
        {activeTab === 'nowcast' && <NowcastPage />}
        {activeTab === 'alerts' && <AlertsPage />}
        {activeTab === 'replay' && <ReplayPage />}
        {activeTab === 'performance' && <PerformancePage />}
        {activeTab === 'sources' && <DataSourcesPage />}
      </main>

      <footer className="py-4 border-t border-gray-900 bg-white text-center text-xs text-gray-500">
        ThunderCast AI · Bhopal, Madhya Pradesh · Prototype decision-support system
      </footer>
    </div>
  );
}

export default App;
