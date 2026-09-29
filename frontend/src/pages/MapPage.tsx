import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { AtmosphericObservation } from '../types/weather';
import { fetchNowcast, fetchObservations } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { useTranslation } from '../i18n';
import {
  Layers,
  Zap,
  CloudRain,
  Navigation,
  Eye,
  Info,
  LocateFixed
} from 'lucide-react';
import { CARTO_ATTRIBUTION, CARTO_TILE_URL, ESRI_ATTRIBUTION, ESRI_SATELLITE_TILE_URL, MAP_ATTRIBUTION, MAP_SOURCE_NAME, MAP_TILE_URL } from '../services/mapConfig';

interface SavedSafetySite {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const MapViewport = ({ target }: { target: [number, number] }) => {
  const map = useMap();
  const [latitude, longitude] = target;

  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 10), { duration: 0.8 });
  }, [map, latitude, longitude]);

  return null;
};

// Custom Leaflet Weather Station Marker Icon
const createStationIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 10px ${color}; animate: pulse 2s infinite;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const lightningIcon = L.divIcon({
  className: 'custom-lightning-icon',
  html: `<div style="background-color: #f59e0b; width: 10px; height: 10px; border-radius: 50%; border: 1px solid #ffffff; box-shadow: 0 0 8px #f59e0b;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

export const MapPage: React.FC = () => {
  const { t } = useTranslation();
  const [observations, setObservations] = useState<AtmosphericObservation[]>([]);
  const [nowcasts, setNowcasts] = useState<Awaited<ReturnType<typeof fetchNowcast>>>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [savedSafetySite] = useState<SavedSafetySite | null>(() => {
    try {
      const storedSite = localStorage.getItem('meghdoot-safety-site');
      if (!storedSite) return null;
      const parsed = JSON.parse(storedSite) as SavedSafetySite;
      return Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude) ? parsed : null;
    } catch {
      localStorage.removeItem('meghdoot-safety-site');
      return null;
    }
  });
  const [selectedStation, setSelectedStation] = useState<AtmosphericObservation | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'current' | 'monsoon'>('current');

  // Map layer toggle states
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showLightning, setShowLightning] = useState<boolean>(false);
  const [showRiskZones, setShowRiskZones] = useState<boolean>(true);
  const [showStormTrack, setShowStormTrack] = useState<boolean>(true);
  const [tileProviderFailed, setTileProviderFailed] = useState<boolean>(false);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('satellite');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const [obs, forecasts] = await Promise.all([fetchObservations(), fetchNowcast()]);
      if (!mounted) return;
      setObservations(obs);
      setNowcasts(forecasts);
      setLastUpdated(new Date());
    }
    void loadData();
    const timer = window.setInterval(() => void loadData(), 30_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (MAP_SOURCE_NAME !== 'MapTiler') return;
    let cancelled = false;
    const probeUrl = MAP_TILE_URL.replace('{z}/{x}/{y}', '5/16/16');

    fetch(probeUrl, { mode: 'cors' })
      .then((response) => {
        if (!response.ok && !cancelled) setTileProviderFailed(true);
      })
      .catch(() => {
        if (!cancelled) setTileProviderFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Bhopal Center coordinates
  const BHOPAL_CENTER: [number, number] = [23.2599, 77.4126];

  // Storm movement track (South-West to North-East monsoon trajectory across Bhopal)
  const stormTrackCoordinates: [number, number][] = [
    [23.1000, 77.3000],
    [23.1800, 77.3600],
    [23.2599, 77.4126],
    [23.3200, 77.4800],
    [23.4000, 77.5600]
  ];

  const usingFallbackTiles = tileProviderFailed && MAP_SOURCE_NAME !== 'CARTO';
  const activeMapSource = mapStyle === 'satellite'
    ? 'Esri satellite'
    : usingFallbackTiles ? 'CARTO fallback' : MAP_SOURCE_NAME;
  const activeTileUrl = mapStyle === 'satellite'
    ? ESRI_SATELLITE_TILE_URL
    : usingFallbackTiles ? CARTO_TILE_URL : MAP_TILE_URL;
  const activeAttribution = mapStyle === 'satellite'
    ? ESRI_ATTRIBUTION
    : usingFallbackTiles ? CARTO_ATTRIBUTION : MAP_ATTRIBUTION;
  const nearTermForecast = nowcasts[0]?.predictions.find((prediction) => prediction.horizon_minutes === 15);
  const probabilityMultiplier = viewPeriod === 'monsoon' ? 1.75 : 0.35;
  const displayedThunderstormProbability = nearTermForecast
    ? Math.min(98, Math.round(nearTermForecast.thunderstorm_probability * probabilityMultiplier))
    : null;
  const displayedHeavyRainProbability = nearTermForecast
    ? Math.min(98, Math.round(nearTermForecast.heavy_rain_probability * probabilityMultiplier))
    : null;
  const riskZoneColor = viewPeriod === 'monsoon' ? '#ef4444' : '#2f855a';

  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationMessage(t('Location is not available in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation([coords.latitude, coords.longitude]);
        setLocationMessage(t('Map centered on your location.'));
      },
      () => setLocationMessage(t('Location permission was not granted.')),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header & Layer Toggles Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>{t('Interactive Weather Risk Map — Bhopal Region')}</span>
          </h2>
          <p className="text-xs text-gray-400">
            {observations.length} {t('station feeds')} · {t('refreshed every 30 sec')} · {t('Map:')} {t(activeMapSource)}
            {lastUpdated && ` · ${t('Updated')} ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>

        <div role="group" aria-label={t('Map style')} className="inline-flex border border-gray-300 rounded-sm overflow-hidden">
          <button
            type="button"
            aria-pressed={mapStyle === 'street'}
            onClick={() => setMapStyle('street')}
            className={`px-3 py-2 text-xs font-semibold ${mapStyle === 'street' ? 'bg-[#12345a] text-white' : 'bg-white text-gray-700'}`}
          >{t('Street')}</button>
          <button
            type="button"
            aria-pressed={mapStyle === 'satellite'}
            onClick={() => setMapStyle('satellite')}
            className={`px-3 py-2 text-xs font-semibold ${mapStyle === 'satellite' ? 'bg-[#12345a] text-white' : 'bg-white text-gray-700'}`}
          >{t('Satellite')}</button>
        </div>

        <div role="group" aria-label={t('Forecast viewing period')} className="inline-flex border border-gray-300 rounded-sm overflow-hidden">
          <button
            type="button"
            aria-pressed={viewPeriod === 'current'}
            onClick={() => setViewPeriod('current')}
            className={`px-3 py-2 text-xs font-semibold ${viewPeriod === 'current' ? 'bg-[#12345a] text-white' : 'bg-white text-gray-700'}`}
          >{t('Current conditions')}</button>
          <button
            type="button"
            aria-pressed={viewPeriod === 'monsoon'}
            onClick={() => setViewPeriod('monsoon')}
            className={`px-3 py-2 text-xs font-semibold ${viewPeriod === 'monsoon' ? 'bg-[#12345a] text-white' : 'bg-white text-gray-700'}`}
          >{t('Monsoon season')}</button>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowRadar(!showRadar)}
            aria-pressed={showRadar}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showRadar ? 'bg-cyan-950 text-cyan-400 border-cyan-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{t('Radar Reflectivity')}</span>
          </button>

          <button
            onClick={() => setShowLightning(!showLightning)}
            aria-pressed={showLightning}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showLightning ? 'bg-yellow-950 text-yellow-400 border-yellow-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('Lightning Markers')}</span>
          </button>

          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            aria-pressed={showRiskZones}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showRiskZones ? 'bg-red-950 text-red-400 border-red-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t('Risk Zones')}</span>
          </button>

          <button
            onClick={() => setShowStormTrack(!showStormTrack)}
            aria-pressed={showStormTrack}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showStormTrack ? 'bg-purple-950 text-purple-400 border-purple-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{t('Storm Track Vector')}</span>
          </button>
        </div>
      </div>

      {/* Main Map & Station Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[580px]">
        
        {/* Leaflet Map View Container */}
        <div className="lg:col-span-3 glass-card p-2 relative overflow-hidden flex flex-col">
          <div className="flex-1 w-full rounded-lg overflow-hidden min-h-[520px] relative">
            <MapContainer
              {...({
                center: BHOPAL_CENTER,
                  zoom: 10,
                  maxBounds: [[23.02, 77.20], [23.46, 77.68]],
                  maxBoundsViscosity: 0.8,
                scrollWheelZoom: true,
                style: { width: '100%', height: '100%', minHeight: '520px' }
              } as any)}
            >
              <MapViewport target={userLocation || BHOPAL_CENTER} />
              {/* Light basemap tiles */}
              <TileLayer
                key={`${mapStyle}-${usingFallbackTiles ? 'carto-fallback' : 'configured-map'}`}
                {...({
                  attribution: activeAttribution,
                  url: activeTileUrl,
                  eventHandlers: {
                    tileerror: () => {
                      if (mapStyle === 'street' && MAP_SOURCE_NAME !== 'CARTO' && !tileProviderFailed) setTileProviderFailed(true);
                      if (mapStyle === 'satellite') setMapStyle('street');
                    }
                  }
                } as any)}
              />

              {userLocation && (
                <Marker position={userLocation}>
                  <Popup>{t('Your current location')}</Popup>
                </Marker>
              )}

              {savedSafetySite && (
                <CircleMarker
                  center={[savedSafetySite.latitude, savedSafetySite.longitude]}
                  radius={12}
                  pathOptions={{ color: '#14532d', fillColor: '#22c55e', fillOpacity: 0.9, weight: 3 }}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <strong>{savedSafetySite.name}</strong>
                      <div>{savedSafetySite.address}</div>
                      <div>{t('Saved by you. Confirm availability with local authorities.')}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              )}

              {/* Station reflectivity values are refreshed from the API. */}
              {showRadar && (
                observations.map((observation) => {
                  const reflectivity = observation.radar_reflectivity_dbz ?? 0;
                  const color = reflectivity >= 50 ? '#b42318' : reflectivity >= 35 ? '#c07a12' : '#1b6a83';
                  return (
                    <CircleMarker
                      key={`reflectivity-${observation.location.station_id}`}
                      center={[observation.location.latitude, observation.location.longitude]}
                      radius={Math.max(8, Math.min(24, 7 + reflectivity / 4))}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.24, weight: 2 }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{observation.location.location_name}</div>
                          <div>{t('Reflectivity:')} {reflectivity.toFixed(1)} dBZ</div>
                          <ProvenanceBadge sourceType={observation.source_type} sourceName={observation.source_name} compact />
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })
              )}

              {/* High-Risk Zone Overlay (Circle around Bhopal Central & Upper Lake) */}
              {showRiskZones && (
                <Circle
                  {...({
                    center: BHOPAL_CENTER,
                    radius: 6500,
                    pathOptions: {
                      color: riskZoneColor,
                      fillColor: riskZoneColor,
                      fillOpacity: viewPeriod === 'monsoon' ? 0.22 : 0.12,
                      dashArray: '6, 6'
                    }
                  } as any)}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-red-400">{t('15-minute regional risk screen')}</div>
                      <div>{t('Thunderstorm:')} {displayedThunderstormProbability ?? t('Unavailable')}% | {t('Heavy rain:')} {displayedHeavyRainProbability ?? t('Unavailable')}%</div>
                      <div className="text-[10px] text-gray-500">{t('View:')} {viewPeriod === 'current' ? t('Current conditions') : t('Monsoon season reference')}</div>
                    </div>
                  </Popup>
                </Circle>
              )}

              {/* Storm Vector Track Line */}
              {showStormTrack && (
                <Polyline
                  {...({
                    positions: stormTrackCoordinates,
                    pathOptions: { color: '#c084fc', weight: 3, dashArray: '8, 8' }
                  } as any)}
                />
              )}

              {/* Lightning activity is placed at the reporting station. */}
              {showLightning && observations.filter((observation) => observation.lightning_flashes_count > 0).map((observation) => (
                <Marker
                  key={`lightning-${observation.location.station_id}`}
                  {...({
                    position: [observation.location.latitude, observation.location.longitude],
                    icon: lightningIcon
                  } as any)}
                >
                  <Popup>
                    <div className="text-xs">
                      <span className="font-bold text-yellow-700">{t('Lightning activity ·')} {observation.location.location_name}</span>
                      <div className="text-[10px] text-gray-600">{observation.lightning_flashes_count} {t('flashes in the latest station record')}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Weather Station Markers */}
              {observations.map((obs) => {
                const isSelected = selectedStation?.location.station_id === obs.location.station_id;
                const markerColor = isSelected ? '#06b6d4' : '#3b82f6';
                return (
                  <Marker
                    key={obs.location.station_id}
                    {...({
                      position: [obs.location.latitude, obs.location.longitude],
                      icon: createStationIcon(markerColor),
                      eventHandlers: {
                        click: () => setSelectedStation(obs),
                      }
                    } as any)}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-white">{obs.location.location_name}</div>
                        <div>{t('Temp:')} {obs.temperature_c}°C | {t('Rain:')} {obs.rainfall_mm_hr} mm/h</div>
                        <div>{t('Reflectivity:')} {obs.radar_reflectivity_dbz} dBZ</div>
                        <div>{t('Lightning:')} {obs.lightning_flashes_count} {t('flashes')}</div>
                        <button
                          onClick={() => setSelectedStation(obs)}
                          className="mt-1 text-[10px] text-cyan-400 font-bold underline"
                        >
                          {t('Inspect Nowcast Details →')}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={locateUser}
                className="glass-card px-3 py-2 text-xs font-semibold text-gray-700 flex items-center gap-2 hover:bg-slate-50"
              >
                <LocateFixed className="w-4 h-4 text-cyan-700" />
                <span>{t('Locate me')}</span>
              </button>
              {locationMessage && (
                <span role="status" className="glass-card max-w-[220px] px-2 py-1 text-[11px] text-gray-600">
                  {locationMessage}
                </span>
              )}
            </div>

            {/* Map Legend Overlay Card */}
            <div className="absolute bottom-4 right-4 z-[1000] glass-card p-3 text-[11px] space-y-2 border border-gray-800 bg-gray-950/90 max-w-xs">
              <div className="font-bold text-white border-b border-gray-800 pb-1">{t('Map Risk Legends')}</div>
              <div className="space-y-1 font-mono">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>{t('Low Risk (<30%)')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>{t('Moderate Risk (30–60%)')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span>{t('High Risk (60–80%)')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span>{t('Severe Hazard (>80%)')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Selected Station Forecast Inspector */}
        <div className="glass-card p-4 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>{t('Station Forecast')}</span>
              </h3>
              {selectedStation && (
                <ProvenanceBadge sourceType={selectedStation.source_type} sourceName={selectedStation.source_name} compact />
              )}
            </div>

            {selectedStation ? (
              <div className="space-y-4 mt-3 text-xs">
                <div>
                  <h4 className="font-bold text-cyan-300 text-sm">{selectedStation.location.location_name}</h4>
                  <p className="text-gray-400 text-[11px]">ID: {selectedStation.location.station_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                    <div className="text-gray-400 text-[10px]">{t('Temperature')}</div>
                    <div className="text-white font-bold">{selectedStation.temperature_c}°C</div>
                  </div>
                  <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                    <div className="text-gray-400 text-[10px]">{t('Rain Rate')}</div>
                    <div className="text-cyan-400 font-bold">{selectedStation.rainfall_mm_hr} mm/h</div>
                  </div>
                  <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                    <div className="text-gray-400 text-[10px]">{t('Reflectivity')}</div>
                    <div className="text-yellow-400 font-bold">{selectedStation.radar_reflectivity_dbz} dBZ</div>
                  </div>
                  <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                    <div className="text-gray-400 text-[10px]">{t('Lightning')}</div>
                    <div className="text-purple-400 font-bold">{selectedStation.lightning_flashes_count} {t('strikes')}</div>
                  </div>
                </div>

                {/* Forecast Timeline at Station */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <div className="font-bold text-gray-300">{t('Station 60-Min Forecast Profile:')}</div>
                  {[
                    { h: 15, prob: 78, risk: 'HIGH' },
                    { h: 30, prob: 88, risk: 'SEVERE' },
                    { h: 45, prob: 64, risk: 'HIGH' },
                    { h: 60, prob: 42, risk: 'MODERATE' },
                  ].map((p) => (
                    <div key={p.h} className="flex items-center justify-between bg-gray-900/60 p-2 rounded border border-gray-800 font-mono">
                      <span className="text-cyan-400">+{p.h} {t('mins')}</span>
                      <span className="text-white font-bold">{p.prob}% {t('Thunderstorm')}</span>
                      <span className="text-[10px] text-amber-400 font-bold">{t(p.risk)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-4">{t('Select a station marker on the map to inspect location telemetry.')}</p>
            )}
          </div>

          <div className="p-2.5 bg-gray-950/80 rounded border border-gray-800 text-[10px] text-gray-400">
            {t('Bhopal district coverage · Upper Lake · MP Nagar · Indrapuri · Kolar Road')}
          </div>
        </div>

      </div>

    </div>
  );
};
