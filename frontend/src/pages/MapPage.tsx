import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import type { AtmosphericObservation } from '../types/weather';
import { fetchObservations } from '../services/api';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  Layers,
  Zap,
  CloudRain,
  Navigation,
  Eye,
  Info
} from 'lucide-react';

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
  const [observations, setObservations] = useState<AtmosphericObservation[]>([]);
  const [selectedStation, setSelectedStation] = useState<AtmosphericObservation | null>(null);

  // Map layer toggle states
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showLightning, setShowLightning] = useState<boolean>(true);
  const [showRiskZones, setShowRiskZones] = useState<boolean>(true);
  const [showStormTrack, setShowStormTrack] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      const obs = await fetchObservations();
      setObservations(obs);
      if (obs.length > 0) setSelectedStation(obs[0]);
    }
    loadData();
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

  // Radar reflectivity grid bounding box around Bhopal
  const radarBounds: [[number, number], [number, number]] = [
    [23.0000, 77.1500],
    [23.5000, 77.7000]
  ];

  return (
    <div className="space-y-4">
      
      {/* Top Header & Layer Toggles Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Interactive Weather Risk Map — Bhopal Region</span>
          </h2>
          <p className="text-xs text-gray-400">
            Center: 23.2599°N, 77.4126°E | IMD Doppler Weather Radar & Lightning Layer
          </p>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showRadar ? 'bg-cyan-950 text-cyan-400 border-cyan-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Radar Reflectivity</span>
          </button>

          <button
            onClick={() => setShowLightning(!showLightning)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showLightning ? 'bg-yellow-950 text-yellow-400 border-yellow-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Lightning Markers</span>
          </button>

          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showRiskZones ? 'bg-red-950 text-red-400 border-red-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Risk Zones</span>
          </button>

          <button
            onClick={() => setShowStormTrack(!showStormTrack)}
            className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition ${
              showStormTrack ? 'bg-purple-950 text-purple-400 border-purple-700' : 'bg-gray-900 text-gray-500 border-gray-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Storm Track Vector</span>
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
                zoom: 11,
                scrollWheelZoom: true,
                style: { width: '100%', height: '100%', minHeight: '520px' }
              } as any)}
            >
              {/* Light basemap tiles */}
              <TileLayer
                {...({
                  attribution: '&copy; CARTO',
                  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                } as any)}
              />

              {/* Simulated Radar Reflectivity Layer (Rectangle Overlay) */}
              {showRadar && (
                <Rectangle
                  {...({
                    bounds: radarBounds,
                    pathOptions: {
                      color: '#06b6d4',
                      weight: 1,
                      fillColor: '#06b6d4',
                      fillOpacity: 0.18
                    }
                  } as any)}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-cyan-400">IMD Bhopal Radar Reflectivity Overlay</div>
                      <div>Max Intensity: 52.4 dBZ (Severe Convective Cell)</div>
                      <ProvenanceBadge sourceType="SYNTHETIC_DEMO" sourceName="IMD_S_BAND_RADAR_BPL" compact />
                    </div>
                  </Popup>
                </Rectangle>
              )}

              {/* High-Risk Zone Overlay (Circle around Bhopal Central & Upper Lake) */}
              {showRiskZones && (
                <Circle
                  {...({
                    center: BHOPAL_CENTER,
                    radius: 6500,
                    pathOptions: {
                      color: '#ef4444',
                      fillColor: '#ef4444',
                      fillOpacity: 0.22,
                      dashArray: '6, 6'
                    }
                  } as any)}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-red-400">Predicted Severe Thunderstorm Zone (+15m)</div>
                      <div>Thunderstorm Risk: 88.0% | Heavy Rain: 91.0%</div>
                      <div className="text-[10px] text-gray-400">Prototype Risk Threshold — Not an Official Warning</div>
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

              {/* Lightning Strike Markers */}
              {showLightning && [
                [23.2400, 77.3900],
                [23.2700, 77.4300],
                [23.2100, 77.4100],
                [23.2900, 77.3600]
              ].map((coords, i) => (
                <Marker
                  key={i}
                  {...({
                    position: coords as [number, number],
                    icon: lightningIcon
                  } as any)}
                >
                  <Popup>
                    <div className="text-xs">
                      <span className="font-bold text-yellow-400">Cloud-to-Ground Lightning Stroke</span>
                      <div className="text-[10px] text-gray-400">Recorded: 2 mins ago</div>
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
                        <div>Temp: {obs.temperature_c}°C | Rain: {obs.rainfall_mm_hr} mm/h</div>
                        <div>Reflectivity: {obs.radar_reflectivity_dbz} dBZ</div>
                        <div>Lightning: {obs.lightning_flashes_count} flashes</div>
                        <button
                          onClick={() => setSelectedStation(obs)}
                          className="mt-1 text-[10px] text-cyan-400 font-bold underline"
                        >
                          Inspect Nowcast Details &rarr;
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Legend Overlay Card */}
            <div className="absolute bottom-4 right-4 z-[1000] glass-card p-3 text-[11px] space-y-2 border border-gray-800 bg-gray-950/90 max-w-xs">
              <div className="font-bold text-white border-b border-gray-800 pb-1">Map Risk Legends</div>
              <div className="space-y-1 font-mono">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>Low Risk (&lt;30%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span>Moderate Risk (30–60%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span>High Risk (60–80%)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span>Severe Hazard (&gt;80%)</span>
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
                <span>Station Forecast</span>
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
                    <div className="text-gray-400 text-[10px]">Temperature</div>
                    <div className="text-white font-bold">{selectedStation.temperature_c}°C</div>
                  </div>
                  <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                    <div className="text-gray-400 text-[10px]">Rain Rate</div>
                    <div className="text-cyan-400 font-bold">{selectedStation.rainfall_mm_hr} mm/h</div>
                  </div>
                  <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                    <div className="text-gray-400 text-[10px]">Reflectivity</div>
                    <div className="text-yellow-400 font-bold">{selectedStation.radar_reflectivity_dbz} dBZ</div>
                  </div>
                  <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                    <div className="text-gray-400 text-[10px]">Lightning</div>
                    <div className="text-purple-400 font-bold">{selectedStation.lightning_flashes_count} strikes</div>
                  </div>
                </div>

                {/* Forecast Timeline at Station */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <div className="font-bold text-gray-300">Station 60-Min Forecast Profile:</div>
                  {[
                    { h: 15, prob: 78, risk: 'HIGH' },
                    { h: 30, prob: 88, risk: 'SEVERE' },
                    { h: 45, prob: 64, risk: 'HIGH' },
                    { h: 60, prob: 42, risk: 'MODERATE' },
                  ].map((p) => (
                    <div key={p.h} className="flex items-center justify-between bg-gray-900/60 p-2 rounded border border-gray-800 font-mono">
                      <span className="text-cyan-400">+{p.h} min</span>
                      <span className="text-white font-bold">{p.prob}% Thunderstorm</span>
                      <span className="text-[10px] text-amber-400 font-bold">{p.risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-4">Select a station marker on the map to inspect location telemetry.</p>
            )}
          </div>

          <div className="p-2.5 bg-gray-950/80 rounded border border-gray-800 text-[10px] text-gray-400">
            Click any weather station marker or risk polygon to view detailed forecasts.
          </div>
        </div>

      </div>

    </div>
  );
};
