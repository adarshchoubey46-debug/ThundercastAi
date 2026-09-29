# MeghDoot — Regional Severe Weather Early-Warning System

> **MeghDoot** is a regional weather decision-support platform that combines atmospheric observations with short-range estimates of thunderstorm, lightning, and heavy rainfall risk over 15, 30, 45, and 60-minute horizons.

---

---

## 🏗️ Technology Stack

- **Frontend (`/frontend`)**:
  - React 19 + TypeScript + Vite
   - Tailwind CSS + accessible light operational dashboard
  - Leaflet & React Leaflet (Interactive Weather Risk Map, Radar Reflectivity Overlay, Storm Track Vectors)
  - Recharts (Dual-axis probability trend curves)
  - Lucide React Icons

- **Backend (`/backend`)**:
  - Python 3.10+ & FastAPI
  - Pydantic v2 (Strict Schema Enforcement)
  - Scikit-learn & XGBoost (Baseline Nowcasting Engine)
  - PyTorch interface stubs (ConvLSTM / U-Net Spatiotemporal tensor models)
  - Pytest & HTTPX test suite

---

## 📁 Repository Structure

```
ThundercastAi/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── router.py
│   │   │   └── endpoints/
│   │   │       ├── health.py
│   │   │       ├── observations.py
│   │   │       ├── nowcast.py
│   │   │       ├── alerts.py
│   │   │       ├── history.py
│   │   │       ├── model.py
│   │   │       └── data_sources.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── data/
│   │   │   └── generator.py (Bhopal Storm Dataset Generator)
│   │   ├── ml/
│   │   │   ├── feature_engineering.py (Strict Null/Sensor handling)
│   │   │   ├── persistence_baseline.py (Benchmark Persistence Model)
│   │   │   ├── nowcaster.py (XGBoost Nowcasting Engine)
│   │   │   ├── deep_learning_interface.py (ConvLSTM/U-Net Abstract Stub)
│   │   │   └── metrics.py (CSI, POD, FAR, Brier Score Evaluator)
│   │   ├── schemas/
│   │   │   └── weather.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_api.py
│   │   └── test_pipeline.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/ (Header, ProvenanceBadge)
│   │   ├── pages/ (OverviewPage, MapPage, NowcastPage, AlertsPage, ReplayPage, PerformancePage, DataSourcesPage)
│   │   ├── services/ (api.ts)
│   │   ├── types/ (weather.ts)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Run Backend (FastAPI)

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- Open Interactive Swagger API Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/health`

### Live thunderstorm outlook providers

The hourly outlook uses Open-Meteo by default and caches normalized responses in process memory for 15 minutes. Provider requests have a 3-second timeout. If a request fails, the API returns a last cached response when available, otherwise an explicit unavailable result; it does not replace missing live data with synthetic storm probabilities.

`GET /api/data-feed-health` reports measured response age/latency for the connected weather provider and labels local observation-generator outputs as `DEMO / SIMULATED`; sources without an adapter are `NOT CONNECTED`. Fresh/stale/offline thresholds are configurable with `DATA_HEALTH_FRESH_THRESHOLD_SECONDS` (default 180), `DATA_HEALTH_STALE_THRESHOLD_SECONDS` (default 900), and `DATA_HEALTH_OFFLINE_THRESHOLD_SECONDS` (default 1800). Pipeline percentages are derived from response age and are omitted for demo/unconnected sources.

Configure `WEATHER_PROVIDER` as one of `open_meteo` (default), `openweather`, `weatherapi`, or `tomorrow`. For paid providers, set the matching secret in the backend environment only:

| Provider | Environment secret | Thunderstorm fields used |
| --- | --- | --- |
| Open-Meteo | None | CAPE, showers (convective-rain proxy), precipitation chance, WMO thunderstorm codes |
| OpenWeather One Call | `OPENWEATHER_API_KEY` | Weather condition IDs in the 2xx thunderstorm group, hourly precipitation chance |
| WeatherAPI | `WEATHERAPI_API_KEY` | Thunderstorm condition codes/text, precipitation chance, severe alert headlines |
| Tomorrow.io | `TOMORROW_API_KEY` | Thunderstorm probability, lightning density/count, precipitation type/chance |

The UI's thunderstorm and lightning percentages are derived screening indicators unless the provider supplies a probability field; they are not calibrated probabilities or official warnings. Forecast duration is limited to the provider's returned forecast hours. July-August mode adds monsoon context only and never boosts current values or predicts specific dates outside the provider forecast horizon. Confirm warnings with IMD and local authorities.

### 2. Run Backend Pytest Suite

```bash
cd backend
python -m pytest
```

### 3. Run Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
- Open Web Application: `http://localhost:5173`

---

## 📊 Core Features & Views

1. **Overview Dashboard**:
   - Real-time ground station summary for Bhopal (MP Nagar, Bairagarh, Kolar, Upper Lake).
   - Multi-horizon prediction cards (15, 30, 45, 60 minutes) with confidence metrics.
   - Data source operational health indicators.

2. **Interactive Weather Map**:
   - Leaflet geographic map with CARTO street tiles and Esri satellite imagery.
   - Street and satellite basemaps with automatic key-failure fallback.
   - Station reflectivity and lightning overlays refreshed from the API every 30 seconds.
   - Monsoon storm movement trajectory vector arrows.
   - Clickable weather station popups.

3. **0 to 60-Minute Nowcasting**:
   - Interactive horizon timeline slider.
   - Recharts trend curves comparing Thunderstorm, Lightning, and Heavy Rain probabilities.
   - Model confidence interval display.

4. **Alerts & Hazard Management**:
   - Risk classification levels (Low, Moderate, High, Severe).
   - Detailed trigger explanations (Reflectivity > 50 dBZ, Lightning stroke rate).
   - Opt-in desktop notifications for newly detected high-risk screenings, plus a local-only notification test.

5. **Historical Replay Engine**:
   - Offline 1-hour playback of Bhopal storm event with Play, Pause, Step (+5 min), and Speed controls (1x, 2x, 5x).
   - Automatic comparison between forecasted predictions and actual ground truth observations.

6. **Model Performance**:
   - Verification metrics: CSI (Threat Score), POD (Hit Rate), FAR (False Alarm Ratio), Brier Score, F1.
   - Benchmark evaluation table comparing **Persistence Baseline** vs **XGBoost Nowcaster**.
   - 2x2 Confusion Matrix (TP, FP, FN, TN).

7. **Data Sources & Adapters**:
   - Status telemetry for configured weather source adapters, with sample-input status identified.
   - Local file selection for CSV, JSON, and NetCDF dataset inspection.

8. **Safety & Shelter Planning**:
   - Save a locally confirmed safe site and show it on the map; no shelter locations are invented or supplied as an official directory.
   - Persistent severe-weather readiness checklist with links to IMD and India's 112 emergency service.

---

## 🛡️ License

Developed for regional weather monitoring and decision-support evaluation.
