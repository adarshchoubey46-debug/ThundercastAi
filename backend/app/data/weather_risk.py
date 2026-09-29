"""Provider adapters for hourly, model-derived convective risk indicators."""

import asyncio
import logging
import math
import os
import time
from datetime import datetime, timezone
from typing import Any

import httpx

CACHE_TTL_SECONDS = 15 * 60
MAX_CACHE_ENTRIES = 256
REQUEST_TIMEOUT_SECONDS = 3
MAX_FORECAST_HOURS = 24

_cache: dict[tuple[str, float, float], tuple[float, dict[str, Any]]] = {}
_cache_lock = asyncio.Lock()
logger = logging.getLogger(__name__)


class WeatherProviderError(Exception):
    """Raised when a provider is misconfigured or returns unusable data."""


def _number(value: Any) -> float | None:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def _clamp_percent(value: float | None) -> float | None:
    return None if value is None else round(max(0.0, min(100.0, value)), 1)


def _parse_forecast_time(value: str) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _convective_potential(cape: float | None, convective_precipitation: float | None, storm_code: bool = False) -> float | None:
    if cape is None and convective_precipitation is None and not storm_code:
        return None
    cape_score = min(max(cape or 0.0, 0.0) / 2000.0, 1.0) * 55.0
    precipitation_score = min(max(convective_precipitation or 0.0, 0.0) / 2.0, 1.0) * 30.0
    storm_signal = 85.0 if storm_code else 0.0
    return _clamp_percent(max(cape_score + precipitation_score, storm_signal))


def normalize_open_meteo(payload: dict[str, Any]) -> list[dict[str, Any]]:
    hourly = payload.get("hourly") or {}
    times = hourly.get("time") or []
    result = []
    for index, timestamp in enumerate(times[:MAX_FORECAST_HOURS]):
        cape = _number((hourly.get("cape") or [])[index] if index < len(hourly.get("cape") or []) else None)
        convective_values = hourly.get("convective_precipitation") or hourly.get("showers") or []
        convective_precipitation = _number(convective_values[index] if index < len(convective_values) else None)
        rain_probability = _number((hourly.get("precipitation_probability") or [])[index] if index < len(hourly.get("precipitation_probability") or []) else None)
        weather_code = _number((hourly.get("weather_code") or [])[index] if index < len(hourly.get("weather_code") or []) else None)
        storm_code = weather_code in (95, 96, 99)
        result.append({
            "time": timestamp,
            "thunderstorm_potential_pct": _convective_potential(cape, convective_precipitation, storm_code),
            "lightning_potential_pct": _clamp_percent(min(max(cape or 0.0, 0.0) / 2000.0 * 75.0, 100.0)) if cape is not None else (85.0 if storm_code else None),
            "precipitation_probability_pct": _clamp_percent(rain_probability),
            "cape_jkg": cape,
            "convective_precipitation_mm": convective_precipitation,
            "condition": "Thunderstorm" if storm_code else None,
        })
    return result


def normalize_openweather(payload: dict[str, Any]) -> list[dict[str, Any]]:
    result = []
    for hour in (payload.get("hourly") or payload.get("list") or [])[:MAX_FORECAST_HOURS]:
        weather = (hour.get("weather") or [{}])[0]
        code = int(_number(weather.get("id")) or 0)
        storm_code = 200 <= code < 300
        rain_probability = _number(hour.get("pop"))
        if rain_probability is not None and rain_probability <= 1:
            rain_probability *= 100
        rain = hour.get("rain") or {}
        result.append({
            "time": datetime.fromtimestamp(hour.get("dt", 0), timezone.utc).isoformat(),
            "thunderstorm_potential_pct": 85.0 if storm_code else (0.0 if code else None),
            "lightning_potential_pct": 85.0 if storm_code else (0.0 if code else None),
            "precipitation_probability_pct": _clamp_percent(rain_probability),
            "cape_jkg": None,
            "convective_precipitation_mm": _number(rain.get("1h") or rain.get("3h")),
            "condition": weather.get("description"),
        })
    return result


def normalize_weatherapi(payload: dict[str, Any]) -> list[dict[str, Any]]:
    forecast_days = (payload.get("forecast") or {}).get("forecastday") or []
    alerts = (payload.get("alerts") or {}).get("alert") or []
    severe_alert = next((alert.get("headline") for alert in alerts if alert.get("headline")), None)
    thunder_alert = next((
        alert.get("headline")
        for alert in alerts
        if "thunder" in f"{alert.get('headline', '')} {alert.get('desc', '')}".lower()
    ), None)
    result = []
    for day in forecast_days:
        for hour in day.get("hour") or []:
            condition = hour.get("condition") or {}
            code = int(_number(condition.get("code")) or 0)
            is_thunder = code in (1087, 1273, 1276, 1279, 1282) or "thunder" in str(condition.get("text", "")).lower()
            thunderstorm_signal = 85.0 if is_thunder else (0.0 if code else None)
            result.append({
                "time": datetime.fromtimestamp(hour.get("time_epoch"), timezone.utc).isoformat() if hour.get("time_epoch") else hour.get("time"),
                "thunderstorm_potential_pct": thunderstorm_signal,
                "lightning_potential_pct": thunderstorm_signal,
                "precipitation_probability_pct": _clamp_percent(_number(hour.get("chance_of_rain"))),
                "cape_jkg": _number(hour.get("cape")),
                "convective_precipitation_mm": _number(hour.get("precip_mm")),
                "condition": thunder_alert or severe_alert or condition.get("text"),
            })
            if len(result) >= MAX_FORECAST_HOURS:
                return result
    return result


def normalize_tomorrow(payload: dict[str, Any]) -> list[dict[str, Any]]:
    timelines = payload.get("timelines") or {}
    intervals = timelines.get("hourly") or timelines.get("1h") or []
    result = []
    for interval in intervals[:MAX_FORECAST_HOURS]:
        values = interval.get("values") or {}
        lightning_density = _number(values.get("lightningDensity", values.get("lightningStrikeCount")))
        thunder_probability = _number(values.get("thunderstormProbability"))
        precipitation_probability = _number(values.get("precipitationProbability"))
        precipitation_type = int(_number(values.get("precipitationType")) or 0)
        if thunder_probability is None and lightning_density is not None:
            thunder_probability = min(lightning_density * 20.0, 100.0)
        result.append({
            "time": interval.get("time"),
            "thunderstorm_potential_pct": _clamp_percent(thunder_probability),
            "lightning_potential_pct": _clamp_percent(min(lightning_density * 20.0, 100.0)) if lightning_density is not None else None,
            "precipitation_probability_pct": _clamp_percent(precipitation_probability),
            "cape_jkg": _number(values.get("cape")),
            "convective_precipitation_mm": _number(values.get("convectivePrecipitation")),
            "condition": {1: "Rain", 2: "Snow", 3: "Freezing rain", 4: "Ice pellets"}.get(precipitation_type),
        })
    return result


def _provider_request(provider: str, latitude: float, longitude: float) -> tuple[str, dict[str, str]]:
    location = f"{latitude},{longitude}"
    if provider == "open_meteo":
        return "https://api.open-meteo.com/v1/forecast", {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "hourly": "cape,showers,precipitation_probability,weather_code",
            "forecast_hours": "48",
            "timezone": "UTC",
        }
    if provider == "openweather":
        api_key = os.getenv("OPENWEATHER_API_KEY")
        if not api_key:
            raise WeatherProviderError("OPENWEATHER_API_KEY is not configured")
        return "https://api.openweathermap.org/data/3.0/onecall", {
            "lat": str(latitude), "lon": str(longitude), "appid": api_key,
            "exclude": "current,minutely,daily,alerts", "units": "metric",
        }
    if provider == "weatherapi":
        api_key = os.getenv("WEATHERAPI_API_KEY")
        if not api_key:
            raise WeatherProviderError("WEATHERAPI_API_KEY is not configured")
        return "https://api.weatherapi.com/v1/forecast.json", {"key": api_key, "q": location, "days": "2", "alerts": "yes"}
    if provider == "tomorrow":
        api_key = os.getenv("TOMORROW_API_KEY")
        if not api_key:
            raise WeatherProviderError("TOMORROW_API_KEY is not configured")
        return "https://api.tomorrow.io/v4/weather/forecast", {
            "location": location,
            "timesteps": "1h",
            "fields": "thunderstormProbability,lightningDensity,lightningStrikeCount,precipitationProbability,precipitationType,cape,convectivePrecipitation",
            "apikey": api_key,
        }
    raise WeatherProviderError("WEATHER_PROVIDER must be open_meteo, openweather, weatherapi, or tomorrow")


async def _fetch_provider(provider: str, latitude: float, longitude: float) -> list[dict[str, Any]]:
    url, params = _provider_request(provider, latitude, longitude)
    timeout = httpx.Timeout(REQUEST_TIMEOUT_SECONDS, connect=REQUEST_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        payload = response.json()
    normalizers = {
        "open_meteo": normalize_open_meteo,
        "openweather": normalize_openweather,
        "weatherapi": normalize_weatherapi,
        "tomorrow": normalize_tomorrow,
    }
    normalized = normalizers[provider](payload)
    current_hour = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    normalized = [
        hour for hour in normalized
        if (forecast_time := _parse_forecast_time(hour.get("time", ""))) is not None
        and forecast_time >= current_hour
    ][:MAX_FORECAST_HOURS]
    if not normalized:
        raise WeatherProviderError("Weather provider returned no hourly forecast data")
    return normalized


def _response(
    provider: str,
    latitude: float,
    longitude: float,
    *,
    available: bool,
    hours: list[dict[str, Any]],
    message: str,
    latency_ms: float | None = None,
    api_status: str = "Not checked",
    last_error: str | None = None,
    cached: bool = False,
    stale: bool = False,
) -> dict[str, Any]:
    month = datetime.now(timezone.utc).month
    season = "July-August monsoon window" if month in (7, 8) else "Outside July-August monsoon window"
    return {
        "available": available,
        "provider": provider,
        "latitude": latitude,
        "longitude": longitude,
        "season_context": season,
        "generated_at_utc": datetime.now(timezone.utc).isoformat() if available else None,
        "cached": cached,
        "stale": stale,
        "latency_ms": latency_ms,
        "api_status": api_status,
        "last_error": last_error,
        "message": message,
        "disclaimer": "Thunderstorm potential is an indicator derived from provider forecast fields, not a calibrated probability or an official warning. Follow local authority and IMD alerts.",
        "hours": hours,
    }


async def get_weather_risk(latitude: float, longitude: float) -> dict[str, Any]:
    """Fetch, normalize, and cache hourly convective indicators without raising provider errors."""
    provider = os.getenv("WEATHER_PROVIDER", "open_meteo").strip().lower()
    cache_key = (provider, round(latitude, 4), round(longitude, 4))
    cached_entry = _cache.get(cache_key)
    now = time.monotonic()
    if cached_entry and now - cached_entry[0] < CACHE_TTL_SECONDS:
        cached_response = dict(cached_entry[1])
        cached_response["cached"] = True
        return cached_response

    async with _cache_lock:
        cached_entry = _cache.get(cache_key)
        now = time.monotonic()
        if cached_entry and now - cached_entry[0] < CACHE_TTL_SECONDS:
            cached_response = dict(cached_entry[1])
            cached_response["cached"] = True
            return cached_response
        try:
            request_started = time.perf_counter()
            hours = await asyncio.wait_for(
                _fetch_provider(provider, latitude, longitude),
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            latency_ms = round((time.perf_counter() - request_started) * 1000, 1)
            result = _response(
                provider,
                latitude,
                longitude,
                available=True,
                hours=hours,
                message="Forecast data loaded",
                latency_ms=latency_ms,
                api_status="200 OK",
            )
            for key, (stored_at, _) in list(_cache.items()):
                if time.monotonic() - stored_at >= CACHE_TTL_SECONDS:
                    _cache.pop(key, None)
            if len(_cache) >= MAX_CACHE_ENTRIES:
                _cache.pop(next(iter(_cache)))
            _cache[cache_key] = (time.monotonic(), result)
            return result
        except Exception as error:
            logger.warning("Weather provider request failed (%s): %s", provider, type(error).__name__)
            latency_ms = round((time.perf_counter() - request_started) * 1000, 1)
            if isinstance(error, httpx.HTTPStatusError):
                api_status = f"HTTP {error.response.status_code}"
                last_error = f"Provider returned HTTP {error.response.status_code}"
            elif isinstance(error, (httpx.TimeoutException, asyncio.TimeoutError)):
                api_status = "TIMEOUT"
                last_error = "Provider request exceeded the configured timeout"
            elif isinstance(error, WeatherProviderError):
                api_status = "NOT CONFIGURED" if "not configured" in str(error).lower() else "NO DATA"
                last_error = str(error)
            else:
                api_status = "REQUEST FAILED"
                last_error = type(error).__name__
            if cached_entry:
                stale_response = dict(cached_entry[1])
                stale_response.update({
                    "cached": True,
                    "stale": True,
                    "message": "Provider unavailable; showing the last cached forecast",
                    "latency_ms": latency_ms,
                    "api_status": api_status,
                    "last_error": last_error,
                })
                return stale_response
            return _response(
                provider,
                latitude,
                longitude,
                available=False,
                hours=[],
                message="Live weather data is temporarily unavailable. Please retry later and follow official local alerts.",
                latency_ms=latency_ms,
                api_status=api_status,
                last_error=last_error,
            )