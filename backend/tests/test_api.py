import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    api_response = client.get("/api/health")
    assert api_response.status_code == 200
    assert api_response.json()["status"] == "healthy"

def test_observations_endpoint():
    response = client.get("/api/observations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["source_type"] in ["HISTORICAL_REPLAY", "REAL_OBSERVATION"]

def test_nowcast_endpoint():
    response = client.get("/api/nowcast")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert "predictions" in data[0]
    assert len(data[0]["predictions"]) == 4  # 15, 30, 45, 60 min

def test_location_nowcast():
    response = client.get("/api/nowcast/bhopal")
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data

def test_alerts_endpoint():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_history_endpoint():
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 12  # 12 steps of 5 min

def test_model_metrics_endpoint():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "csi" in data
    assert "pod" in data
    assert "far" in data
    assert data["disclaimer"] == ""

def test_data_sources_endpoint():
    response = client.get("/api/data-sources")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
