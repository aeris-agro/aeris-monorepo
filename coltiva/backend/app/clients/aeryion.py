# FILE: coltiva/backend/app/clients/aeryion.py
"""
Thin HTTP client for the Aeryion FastAPI backend.
Used by Coltiva to fetch NDVI, soil, and rainfall forecast data.
"""

import httpx
from typing import Any, Optional, cast
from app.config import settings


class AeryionClient:
    def __init__(self, base_url: Optional[str] = None, timeout: float = 5.0):
        self.base_url = (base_url or settings.AERYION_API_URL).rstrip("/")
        self.timeout = timeout

    def _get(self, path: str, params: Optional[dict[str, Any]] = None) -> dict[str, Any] | list[dict[str, Any]] | None:
        try:
            with httpx.Client(timeout=self.timeout) as client:
                r = client.get(f"{self.base_url}{path}", params=params)
                if r.status_code == 200:
                    return cast(dict[str, Any] | list[dict[str, Any]], r.json())
        except (httpx.HTTPError, httpx.TimeoutException):
            pass
        return None

    def get_ndvi_for_sub_county(self, sub_county_name: str) -> Optional[dict[str, Any]]:
        """Return latest NDVI record for a given sub-county name, or None."""
        data = self._get("/v1/ndvi/latest")
        if not isinstance(data, list):
            return None
        for rec in data:
            if rec.get("sub_county", "").lower() == sub_county_name.lower():
                return rec
        return None

    def get_soil_for_sub_county(self, sub_county_name: str) -> Optional[dict[str, Any]]:
        """Return latest iSDAsoil baseline for a given sub-county name, or None."""
        data = self._get("/v1/soil/latest", params={"sub_county": sub_county_name})
        if not isinstance(data, list):
            return None
        for rec in data:
            if sub_county_name.lower() in rec.get("sub_county", "").lower():
                return rec
        return None

    def get_forecast_for_sub_county(self, sub_county_name: str) -> Optional[list[dict[str, Any]]]:
        """Return 7-day LSTM rainfall forecast for a given sub-county, or None."""
        data = self._get("/v1/forecast/7day", params={"sub_county": sub_county_name})
        return data if isinstance(data, list) else None


# Module-level singleton for convenience
client = AeryionClient()
