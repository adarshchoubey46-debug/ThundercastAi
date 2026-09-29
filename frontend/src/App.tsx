import { useEffect, useState } from 'react';
import { Header } from './components/common/Header';
import { AssistantWidget } from './components/common/AssistantWidget';
import { OverviewPage } from './pages/OverviewPage';
import { MapPage } from './pages/MapPage';
import { NowcastPage } from './pages/NowcastPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReplayPage } from './pages/ReplayPage';
import { PerformancePage } from './pages/PerformancePage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { SafetyPage } from './pages/SafetyPage';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [language, setLanguage] = useState<'en' | 'hi'>(() => localStorage.getItem('meghdoot-language') === 'hi' ? 'hi' : 'en');
  const [forecastMode, setForecastMode] = useState<'live' | 'monsoon'>('live');

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    localStorage.setItem('meghdoot-language', language);
  }, [language]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} language={language} setLanguage={setLanguage} forecastMode={forecastMode} setForecastMode={setForecastMode} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'map' && <MapPage />}
        {activeTab === 'nowcast' && <NowcastPage forecastMode={forecastMode} />}
        <AlertsPage active={activeTab === 'alerts'} />
        {activeTab === 'replay' && <ReplayPage />}
        {activeTab === 'performance' && <PerformancePage />}
        {activeTab === 'sources' && <DataSourcesPage />}
        {activeTab === 'safety' && <SafetyPage />}
      </main>

      <footer className="py-4 border-t border-gray-900 bg-white text-center text-xs text-gray-500">
        {language === 'hi' ? 'मेघदूत · क्षेत्रीय मौसम सहायता · भोपाल, मध्य प्रदेश' : 'MeghDoot · Regional weather decision support · Bhopal, Madhya Pradesh'}
      </footer>
      <AssistantWidget language={language} onOpenSafety={() => setActiveTab('safety')} />
    </div>
  );
}

export default App;
