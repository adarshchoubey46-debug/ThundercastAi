# Vajra Kavach — Regional Severe Weather Early-Warning System

> **Vajra Kavach** is a regional weather decision-support platform that combines atmospheric observations with short-range estimates of thunderstorm, lightning, and heavy rainfall risk over 15, 30, 45, and 60-minute horizons.

---

## ⚠️ Important Notices & Data Provenance

1. **ADVISORY RISK SCREENING**:
   > *"Automated risk screening is not an official warning. For verified advisories, consult the India Meteorological Department (IMD)."*
   - Low Risk: `< 30%`
   - Moderate Risk: `30% - 60%`
   - High Risk: `60% - 80%`
   - Severe Hazard: `> 80%`

2. **SAMPLE-DATA PROVENANCE**:
   > *"Some records use synthetic sample data and have not been validated against live sensors. Do not use this dashboard as the sole source for safety decisions."*

3. **STRICT DATA PROVENANCE BADGING**:
   Every record, observation, and model output displays explicit metadata:
   - `source_type`: `REAL_OBSERVATION` | `HISTORICAL_REPLAY` | `SYNTHETIC_DEMO` | `MODEL_PREDICTION`
   - `source_name`: String identifier
   - `data_quality`: Sensor quality status
   - `is_demo`: API compatibility flag; true marks synthetic sample input

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
