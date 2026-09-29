import asyncio

from fastapi.testclient import TestClient

from app.main import app
from app.data import weather_risk


def test_open_meteo_normalizes_convective_fields():
    result = weather_risk.normalize_open_meteo({
        "hourly": {
            "time": ["2026-07-15T12:00"],
            "cape": [1600],
            "convective_precipitation": [1.2],
            "precipitation_probability": [70],
            "weather_code": [95],
        }
    })

    assert result[0]["cape_jkg"] == 1600
    assert result[0]["convective_precipitation_mm"] == 1.2
    assert result[0]["thunderstorm_potential_pct"] == 62


def test_openweather_recognizes_thunderstorm_code_group():
    result = weather_risk.normalize_openweather({
        "list": [{
            "dt": 1784116800,
            "pop": 0.7,
            "weather": [{"id": 211, "description": "thunderstorm"}],
        }]
    })

    assert result[0]["thunderstorm_potential_pct"] == 85
    assert result[0]["precipitation_probability_pct"] == 70


def test_weatherapi_reads_conditions_and_severe_alerts():
    result = weather_risk.normalize_weatherapi({
        "forecast": {"forecastday": [{"hour": [{
            "time": "2026-07-15 12:00",
            "chance_of_rain": 90,
            "condition": {"code": 1087, "text": "Thundery outbreaks"},
        }]}]},
        "alerts": {"alert": [{"headline": "Severe thunderstorm warning"}]},
    })

    assert result[0]["thunderstorm_potential_pct"] == 85
    assert result[0]["condition"] == "Severe thunderstorm warning"


def test_tomorrow_reads_lightning_density_and_precipitation_type():
    result = weather_risk.normalize_tomorrow({
        "timelines": {"hourly": [{
            "time": "2026-07-15T12:00:00Z",
            "values": {"lightningDensity": 3, "precipitationProbability": 80, "precipitationType": 4},
        }]}
    })

    assert result[0]["thunderstorm_potential_pct"] == 60
    assert result[0]["lightning_potential_pct"] == 60
    assert result[0]["condition"] == "Ice pellets"


def test_weather_risk_cache_and_offline_fallback(monkeypatch):
    weather_risk._cache.clear()
    monkeypatch.setattr(weather_risk, "CACHE_TTL_SECONDS", 900)
    calls = 0

    async def fetch(_provider, _latitude, _longitude):
        nonlocal calls
        calls += 1
        return [{"time": "2026-07-15T12:00:00Z", "thunderstorm_potential_pct": 40}]

    monkeypatch.setattr(weather_risk, "_fetch_provider", fetch)
    first = asyncio.run(weather_risk.get_weather_risk(23.2599, 77.4126))
    second = asyncio.run(weather_risk.get_weather_risk(23.2599, 77.4126))

    assert first["available"] is True
    assert second["cached"] is True
    assert calls == 1

    weather_risk._cache.clear()

    async def fail(_provider, _latitude, _longitude):
        raise RuntimeError("provider offline")

    monkeypatch.setattr(weather_risk, "_fetch_provider", fail)
    fallback = asyncio.run(weather_risk.get_weather_risk(23.2599, 77.4126))
    assert fallback["available"] is False
    assert fallback["hours"] == []


def test_weather_risk_endpoint_validates_coordinates(monkeypatch):
    async def fetch(_latitude, _longitude):
        return {"available": False, "hours": []}

    monkeypatch.setattr("app.api.endpoints.weather_risk.get_weather_risk", fetch)
    client = TestClient(app)

    assert client.get("/api/weather-risk?latitude=23.26&longitude=77.41").status_code == 200
    assert client.get("/api/weather-risk?latitude=91&longitude=77").status_code == 422


def test_weather_provider_timeout_returns_graceful_unavailable(monkeypatch):
    monkeypatch.setenv("WEATHER_PROVIDER", "open_meteo")
    monkeypatch.setattr(weather_risk, "REQUEST_TIMEOUT_SECONDS", 0.01)
    weather_risk._cache.clear()

    async def slow_provider(_provider, _latitude, _longitude):
        await asyncio.sleep(0.2)
        return []

    monkeypatch.setattr(weather_risk, "_fetch_provider", slow_provider)
    response = asyncio.run(weather_risk.get_weather_risk(23.2599, 77.4126))

    assert response["available"] is False
    assert response["hours"] == []