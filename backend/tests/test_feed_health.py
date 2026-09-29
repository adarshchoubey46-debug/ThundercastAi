from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.data import feed_health
from app.main import app


def test_external_feed_status_uses_configured_freshness_thresholds():
    assert feed_health._status_for_external_feed(True, False, 10) == "LIVE / HEALTHY"
    assert feed_health._status_for_external_feed(True, False, 200) == "STALE"
    assert feed_health._status_for_external_feed(True, False, 1000) == "STALE"
    assert feed_health._status_for_external_feed(True, False, 1800) == "OFFLINE"
    assert feed_health._status_for_external_feed(True, False, 1900) == "OFFLINE"
    assert feed_health._status_for_external_feed(False, False, None) == "OFFLINE"


def test_connected_feed_health_score_is_derived_from_age():
    assert feed_health._health_score("LIVE / HEALTHY", 10) == 100
    stale_score = feed_health._health_score("STALE", 500)
    assert 70 < stale_score < 100
    assert feed_health._health_score("OFFLINE", 1900) == 0


def test_health_endpoint_labels_unconnected_sources_and_live_provider(monkeypatch):
    async def weather_response(_latitude, _longitude):
        return {
            "available": True,
            "provider": "open_meteo",
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "cached": False,
            "stale": False,
            "latency_ms": 42.5,
            "api_status": "200 OK",
            "last_error": None,
            "hours": [{
                "time": datetime.now(timezone.utc).isoformat(),
                "cape_jkg": 250,
                "convective_precipitation_mm": 0,
            }],
        }

    monkeypatch.setattr(feed_health, "get_weather_risk", weather_response)
    client = TestClient(app)

    client.get("/api/observations")
    response = client.get("/api/data-feed-health")

    assert response.status_code == 200
    health = response.json()
    sources = {source["source_id"]: source for source in health["sources"]}
    assert sources["DS_IMD_RADAR_BPL"]["status"] == "DEMO / SIMULATED"
    assert sources["DS_IMD_RADAR_BPL"]["data_age_seconds"] is not None
    assert sources["DS_IMD_RADAR_BPL"]["latency_ms"] is not None
    assert sources["DS_IMD_RADAR_BPL"]["latency_scope"] == "Observation generator processing time"
    assert sources["DS_MOSDAC_INSAT3D"]["status"] == "NOT CONNECTED"
    assert sources["DS_MOSDAC_INSAT3D"]["last_update"] is None
    assert sources["DS_IMD_AWS_NETWORK"]["status"] == "DEMO / SIMULATED"
    assert sources["DS_IITM_LIGHTNING_NET"]["status"] == "DEMO / SIMULATED"
    assert sources["DS_OPEN_METEO_FORECAST"]["status"] == "LIVE / HEALTHY"
    assert sources["DS_OPEN_METEO_FORECAST"]["latency_ms"] == 42.5
    assert sources["DS_OPEN_METEO_FORECAST"]["latency_scope"] == "Provider HTTP request round-trip"
    assert sources["DS_OPEN_METEO_FORECAST"]["api_status"] == "200 OK"
    assert health["overall_status"] == "HEALTHY"


def test_unavailable_provider_is_offline_and_has_no_success_timestamp(monkeypatch):
    async def unavailable(_latitude, _longitude):
        return {
            "available": False,
            "provider": "open_meteo",
            "generated_at_utc": None,
            "cached": False,
            "stale": False,
            "latency_ms": 3000,
            "api_status": "TIMEOUT",
            "last_error": "Provider request exceeded the configured timeout",
            "hours": [],
        }

    monkeypatch.setattr(feed_health, "get_weather_risk", unavailable)
    health = TestClient(app).get("/api/data-feed-health").json()
    provider = next(source for source in health["sources"] if source["source_id"] == "DS_OPEN_METEO_FORECAST")

    assert provider["status"] == "OFFLINE"
    assert provider["last_update"] is None
    assert provider["api_status"] == "TIMEOUT"
    assert provider["health_score_pct"] == 0