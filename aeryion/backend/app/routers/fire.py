from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
from datetime import date
from app.config import settings

router = APIRouter()


class FireAlert(BaseModel):
    latitude: float
    longitude: float
    brightness: float
    scan_date: str
    satellite: str
    confidence: str
    frp: float  # Fire Radiative Power in MW


# Lango sub-region bounding box
LANGO_BBOX = {"min_lat": 1.5, "max_lat": 3.0, "min_lon": 32.5, "max_lon": 34.0}


@router.get("/active", response_model=List[FireAlert])
def get_active_fires():
    """
    Active fire alerts from NASA FIRMS for Lango sub-region.
    Uses MODIS data — refreshed every 6 hours.
    Bounding box: Lira, Alebtong, Dokolo districts.
    """
    # NASA FIRMS public CSV endpoint — no API key needed for MODIS
    today = date.today().isoformat()

    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        f"{settings.NASA_FIRMS_MAP_KEY}/MODIS_NRT/"
        f"{LANGO_BBOX['min_lon']},{LANGO_BBOX['min_lat']},"
        f"{LANGO_BBOX['max_lon']},{LANGO_BBOX['max_lat']}/"
        f"1"  # last 1 day
    )

    try:
        response = httpx.get(url, timeout=15)
        response.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"NASA FIRMS unavailable: {str(e)}")

    lines = response.text.strip().split("\n")
    if len(lines) < 2:
        return []  # no fires detected

    headers = [h.strip() for h in lines[0].split(",")]
    results = []

    for line in lines[1:]:
        if not line.strip():
            continue
        values = [v.strip() for v in line.split(",")]
        row = dict(zip(headers, values))

        try:
            results.append(
                FireAlert(
                    latitude=float(row.get("latitude", 0)),
                    longitude=float(row.get("longitude", 0)),
                    brightness=float(row.get("brightness", 0)),
                    scan_date=row.get("acq_date", today),
                    satellite=row.get("satellite", "Terra"),
                    confidence=row.get("confidence", "nominal"),
                    frp=float(row.get("frp", 0)),
                )
            )
        except (ValueError, KeyError):
            continue

    return results
