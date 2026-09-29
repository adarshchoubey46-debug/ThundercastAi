interface MapEnvironment {
  VITE_MAP_API_KEY?: string;
  VITE_MAPTILER_API_KEY?: string;
  VITE_MAP_TILE_URL?: string;
  VITE_MAP_ATTRIBUTION?: string;
}

const environment = import.meta.env as MapEnvironment;
const mapApiKey = environment.VITE_MAP_API_KEY || environment.VITE_MAPTILER_API_KEY || '';
export const CARTO_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const CARTO_ATTRIBUTION = '&copy; CARTO';
export const ESRI_SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const ESRI_ATTRIBUTION = 'Tiles &copy; Esri — Sources: Esri, Maxar, Earthstar Geographics';
const configuredTileUrl = environment.VITE_MAP_TILE_URL || (
  mapApiKey
    ? 'https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key={apiKey}'
    : ''
);

export const MAP_TILE_URL = configuredTileUrl
  ? configuredTileUrl.replaceAll('{apiKey}', encodeURIComponent(mapApiKey))
  : CARTO_TILE_URL;

export const MAP_ATTRIBUTION = environment.VITE_MAP_ATTRIBUTION || (
  mapApiKey && !environment.VITE_MAP_TILE_URL
    ? '&copy; MapTiler &copy; OpenStreetMap contributors'
    : configuredTileUrl ? '&copy; Map data provider' : CARTO_ATTRIBUTION
);

export const MAP_SOURCE_NAME = configuredTileUrl
  ? mapApiKey && !environment.VITE_MAP_TILE_URL ? 'MapTiler' : 'Configured tile API'
  : 'CARTO';