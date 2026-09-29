"""Data-feed status calculations and last-observation diagnostics."""

from datetime import datetime, timezone
from threading import Lock
from typing import Any

from app.core.config import settings
from app.data.weather_risk import get_weather_risk
from app.schemas.weather import AtmosphericObservation, DataFeedHealth, DataPipelineHealth

_observation_state: dict[str, Any] = {"last_update": None, "latency_ms": None, "records": {}, "last_error": None}
_state_lock = Lock()


def _thresholds() -> tuple[int, int, int]:
    fresh = max(settings.FRESH_THRESHOLD_SECONDS, 1)
    stale = max(settings.STALE_THRESHOLD_SECONDS, fresh + 1)
    offline = max(settings.OFFLINE_THRESHOLD_SECONDS, stale + 1)
    return fresh, stale, offline


def record_observation_success(records: list[AtmosphericObservation], latency_ms: float) -> None:
    latest = {record.location.station_id or record.location.location_name: record.model_dump(mode="json") for record in records}
    update_time = records[0].timestamp if records else None
    with _state_lock:
        _observation_state.update({
            "last_update": update_time,
            "latency_ms": round(latency_ms, 1),
            "records": latest,
            "last_error": None,
        })


def record_observation_failure(error: Exception) -> None:
    with _state_lock:
        _observation_state["last_error"] = type(error).__name__


def get_demo_feed_sources(now: datetime | None = None) -> list[DataFeedHealth]:
    current_time = now or datetime.now(timezone.utc)
    with _state_lock:
        observation_state = {
            "last_update": _observation_state["last_update"],
            "latency_ms": _observation_state["latency_ms"],
            "records": dict(_observation_state["records"]),
            "last_error": _observation_state["last_error"],
        }
    return [_demo_source(metadata, observation_state, current_time) for metadata in settings.DATA_FEED_METADATA]


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _age_seconds(timestamp: str | None, now: datetime) -> float | None:
    parsed = _parse_timestamp(timestamp)
    if parsed is None:
        return None
    return round(max(0.0, (now - parsed).total_seconds()), 1)


def _status_for_external_feed(available: bool, stale: bool, age_seconds: float | None) -> str:
    fresh_threshold, _, offline_threshold = _thresholds()
    if not available:
        return "OFFLINE"
    if age_seconds is None or age_seconds >= offline_threshold:
        return "OFFLINE"
    if stale or age_seconds > fresh_threshold:
        return "STALE"
    return "LIVE / HEALTHY"


def _health_score(status: str, age_seconds: float | None) -> int:
    if status == "OFFLINE" or age_seconds is None:
        return 0
    fresh_threshold, stale_threshold, offline_threshold = _thresholds()
    if age_seconds <= fresh_threshold:
        return 100
    if age_seconds <= stale_threshold:
        stale_range = stale_threshold - fresh_threshold
        return round(100 - 30 * (age_seconds - fresh_threshold) / stale_range)
    offline_range = max(offline_threshold - stale_threshold, 1)
    return max(0, round(70 * (offline_threshold - age_seconds) / offline_range))


def _demo_source(metadata: dict[str, Any], state: dict[str, Any], now: datetime) -> DataFeedHealth:
    records = state["records"]
    record = next(iter(records.values()), None)
    last_update = state["last_update"]
    connected_to_external_source = metadata["kind"] != "satellite"
    latest_record = None
    if record:
        if metadata["kind"] == "radar":
            latest_record = (
                f"{record.get('location', {}).get('location_name')}: "
                f"reflectivity {record.get('radar_reflectivity_dbz')} dBZ; "
                f"rainfall {record.get('rainfall_mm_hr')} mm/h"
            )
        elif metadata["kind"] == "aws":
            latest_record = (
                f"{record.get('location', {}).get('location_name')}: "
                f"temperature {record.get('temperature_c')} C; humidity {record.get('humidity_pct')}%; "
                f"wind {record.get('wind_speed_kmh')} km/h; pressure {record.get('pressure_hpa')} hPa; "
                f"rainfall {record.get('rainfall_mm_hr')} mm/h"
            )
        elif metadata["kind"] == "lightning":
            latest_record = (
                f"{record.get('location', {}).get('location_name')}: "
                f"{record.get('lightning_flashes_count')} simulated flashes in the rolling 15-minute sample"
            )

    has_sample = bool(last_update and record and connected_to_external_source)
    if not connected_to_external_source:
        status = "NOT CONNECTED"
        confirmation = "No satellite feed is configured"
        api_status = "No external API/feed configured"
    else:
        status = "DEMO / SIMULATED"
        confirmation = "Latest simulated record generated" if has_sample else "No simulated sample generated yet"
        api_status = "Local generator; no external source connection"

    return DataFeedHealth(
        source_id=metadata["source_id"],
        source_name=metadata["source_name"],
        kind=metadata["kind"],
        status=status,
        last_update=last_update if has_sample else None,
        data_age_seconds=_age_seconds(last_update, now) if has_sample else None,
        latency_ms=state["latency_ms"] if has_sample and connected_to_external_source else None,
        latency_scope="Observation generator processing time" if has_sample and connected_to_external_source else None,
        coverage_area=metadata["coverage_area"],
        products=metadata["products"],
        latest_record=latest_record if has_sample else None,
        api_status=api_status,
        last_error=state["last_error"] if connected_to_external_source else None,
        health_score_pct=None,
        confirmation=confirmation,
        simulated=connected_to_external_source,
    )


async def get_data_feed_health() -> DataPipelineHealth:
    now = datetime.now(timezone.utc)
    fresh_threshold, stale_threshold, offline_threshold = _thresholds()
    feeds = get_demo_feed_sources(now)
    forecast = await get_weather_risk(settings.DEFAULT_LATITUDE, settings.DEFAULT_LONGITUDE)
    forecast_age = _age_seconds(forecast.get("generated_at_utc"), now)
    forecast_status = _status_for_external_feed(
        forecast.get("available", False), forecast.get("stale", False), forecast_age
    )
    first_hour = (forecast.get("hours") or [{}])[0]
    last_record = None
    if first_hour:
        last_record = (
            f"{len(forecast['hours'])} future forecast hours; next period {first_hour.get('time')}; "
            f"CAPE {first_hour.get('cape_jkg')} J/kg; "
            f"showers {first_hour.get('convective_precipitation_mm')} mm"
        )
    open_meteo_score = _health_score(forecast_status, forecast_age)
    feeds.append(DataFeedHealth(
        source_id="DS_OPEN_METEO_FORECAST",
        source_name="Open-Meteo Forecast API",
        kind="forecast",
        status=forecast_status,
        last_update=forecast.get("generated_at_utc"),
        data_age_seconds=forecast_age,
        latency_ms=forecast.get("latency_ms"),
        latency_scope="Provider HTTP request round-trip" if forecast.get("latency_ms") is not None else None,
        coverage_area=settings.DEFAULT_LOCATION_NAME,
        products=["Hourly CAPE", "Showers (convective-rain proxy)", "Precipitation probability", "WMO weather code"],
        latest_record=last_record,
        api_status=forecast.get("api_status", "Not checked"),
        last_error=forecast.get("last_error"),
        health_score_pct=open_meteo_score,
        confirmation="Latest forecast response received" if forecast.get("available") else "No successful forecast response",
        simulated=False,
    ))

    connected_feeds = [feed for feed in feeds if not feed.simulated and feed.status != "NOT CONNECTED"]
    if not connected_feeds:
        overall_status = "DEMO / SIMULATED"
        overall_score = None
    elif any(feed.status == "OFFLINE" for feed in connected_feeds):
        overall_status = "OFFLINE"
        overall_score = round(sum(feed.health_score_pct or 0 for feed in connected_feeds) / len(connected_feeds))
    elif any(feed.status == "STALE" for feed in connected_feeds):
        overall_status = "STALE"
        overall_score = round(sum(feed.health_score_pct or 0 for feed in connected_feeds) / len(connected_feeds))
    else:
        overall_status = "HEALTHY"
        overall_score = round(sum(feed.health_score_pct or 0 for feed in connected_feeds) / len(connected_feeds))

    return DataPipelineHealth(
        overall_status=overall_status,
        overall_health_pct=overall_score,
        fresh_threshold_seconds=fresh_threshold,
        stale_threshold_seconds=stale_threshold,
        offline_threshold_seconds=offline_threshold,
        sources=feeds,
    )