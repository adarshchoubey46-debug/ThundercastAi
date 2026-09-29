import httpx
from fastapi.testclient import TestClient

from app.api.endpoints import forecast
from app.main import app


client = TestClient(app)


def test_forecast_endpoint_requests_and_returns_hourly_fields(monkeypatch):
    payload = {
        "latitude": 23.26,
        "longitude": 77.41,
        "timezone": "GMT",
        "timezone_abbreviation": "GMT",
        "utc_offset_seconds": 0,
        "hourly_units": {"temperature_2m": "°C"},
        "hourly": {
            "time": ["2026-09-29T12:00"],
            "temperature_2m": [28.0],
            "dew_point_2m": [20.0],
            "precipitation": [0.0],
            "wind_speed_10m": [10.0],
            "wind_direction_10m": [240.0],
            "cape": [500.0],
            "lifted_index": [-2.0],
            "cloud_cover": [65.0],
            "weather_code": [2],
        },
    }
    requested = {}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return payload

    class FakeClient:
        def __init__(self, timeout):
            requested["timeout"] = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def get(self, url, params):
            requested["url"] = url
            requested["params"] = params
            return FakeResponse()

    monkeypatch.setattr(forecast.httpx, "AsyncClient", FakeClient)
    response = client.get("/api/forecast?lat=23.26&lon=77.41&hours=6")

    assert response.status_code == 200
    assert response.json()["hourly"]["temperature_2m"] == [28.0]
    assert requested["url"] == forecast.OPEN_METEO_FORECAST_URL
    assert requested["timeout"] == 15.0
    assert requested["params"]["forecast_hours"] == 6
    assert requested["params"]["timezone"] == "UTC"
    assert "lifted_index" in requested["params"]["hourly"]


def test_forecast_endpoint_maps_provider_errors_to_502(monkeypatch):
    class FailingClient:
        def __init__(self, timeout):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def get(self, _url, params):
            raise httpx.ConnectError("provider unavailable")

    monkeypatch.setattr(forecast.httpx, "AsyncClient", FailingClient)
    response = client.get("/api/forecast?hours=6")

    assert response.status_code == 502
    assert "Open-Meteo forecast request failed" in response.json()["detail"]


def test_invalid_provider_payload_returns_502_without_taking_down_health(monkeypatch):
    class InvalidPayloadResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"hourly": {"time": ["2026-09-29T12:00"]}}

    class InvalidPayloadClient:
        def __init__(self, timeout):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            return None

        async def get(self, _url, params):
            return InvalidPayloadResponse()

    monkeypatch.setattr(forecast.httpx, "AsyncClient", InvalidPayloadClient)
    response = client.get("/api/forecast?hours=6")

    assert response.status_code == 502
    assert "invalid forecast response" in response.json()["detail"]
    assert client.get("/health").json() == {"status": "ok"}


def test_forecast_endpoint_validates_hours():
    response = client.get("/api/forecast?hours=25")
    assert response.status_code == 422


def test_local_frontend_origin_passes_cors_preflight():
    response = client.options(
        "/api/forecast",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"