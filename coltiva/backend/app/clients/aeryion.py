# FILE: coltiva/backend/app/clients/aeryion.py
"""
Thin HTTP client for the Aeryion FastAPI backend.
Used by Coltiva to fetch NDVI, soil, and rainfall forecast data.
"""
import httpx
from typing import Optional
from app.config import settings


class AeryionClient:
    def __init__(self, base_url: Optional[str] = None, timeout: float = 5.0):
        self.base_url = (base_url or settings.AERYION_API_URL).rstrip("/")
        self.timeout  = timeout

    def _get(self, path: str, params: Optional[dict] = None) -> Optional[dict | list]:
        try:
            with httpx.Client(timeout=self.timeout) as client:
                r = client.get(f"{self.base_url}{path}", params=params)
                if r.status_code == 200:
                    return r.json()
        except (httpx.HTTPError, httpx.TimeoutException):
            pass
        return None

    def get_ndvi_for_sub_county(self, sub_county_name: str) -> Optional[dict]:
        """Return latest NDVI record for a given sub-county name, or None."""
        data = self._get("/v1/ndvi/latest")
        if not data:
            return None
        for rec in data:
            if rec.get("sub_county", "").lower() == sub_county_name.lower():
                return rec
        return None

    def get_soil_for_sub_county(self, sub_county_name: str) -> Optional[dict]:
        """Return latest iSDAsoil baseline for a given sub-county name, or None."""
        data = self._get("/v1/soil/latest", params={"sub_county": sub_county_name})
        if not data:
            return None
        for rec in data:
            if sub_county_name.lower() in rec.get("sub_county", "").lower():
                return rec
        return None

    def get_forecast_for_sub_county(self, sub_county_name: str) -> Optional[list]:
        """Return 7-day LSTM rainfall forecast for a given sub-county, or None."""
        return self._get("/v1/forecast/7day", params={"sub_county": sub_county_name})


# Module-level singleton for convenience
client = AeryionClient()
