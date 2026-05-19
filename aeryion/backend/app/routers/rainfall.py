# FILE: app/routers/rainfall.py
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.schemas import RainfallResponse
from app.db.supabase import aeryion, shared

router = APIRouter()


# ─── /current ── 90-day rolling totals per sub-county (unchanged) ─────────────
@router.get("/current", response_model=List[RainfallResponse])
def get_rainfall_current(district: Optional[str] = Query(None)):
    """
    Latest 90-day rainfall reading per sub-county.
    Optionally filter by district name e.g. ?district=Alebtong
    """
    sc_res = shared("sub_counties").select("id, name, districts(name)").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    sc_map = {}
    for sc in sc_res.data:
        dist_name = (
            sc.get("districts", {}).get("name", "") if sc.get("districts") else ""
        )
        if district and dist_name.lower() != district.lower():
            continue
        sc_map[sc["id"]] = {"sc_name": sc["name"], "district": dist_name}

    if not sc_map:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found")

    results = []
    for sc_id, meta in sc_map.items():
        obs = (
            aeryion("rainfall_observations")
            .select("*")
            .eq("sub_county_id", sc_id)
            .eq("period_days", 90)
            .order("observation_date", desc=True)
            .limit(1)
            .execute()
        )
        if not obs.data:
            continue
        row = obs.data[0]
        results.append(
            RainfallResponse(
                sub_county=meta["sc_name"],
                observation_date=row["observation_date"],
                period_days=row["period_days"],
                rainfall_mm=row["rainfall_mm"],
                anomaly_pct=row.get("anomaly_pct"),
                drought_flag=row.get("drought_flag", False),
                flood_flag=row.get("flood_flag", False),
            )
        )
    return results


# ─── /history ── daily series for charts ─────────────────────────────────────
class DailyRainfallPoint(BaseModel):
    date: date
    rainfall_mm: float


class SubCountyRainfallSeries(BaseModel):
    sub_county: str
    daily: List[DailyRainfallPoint]


class RainfallHistoryResponse(BaseModel):
    start_date: date
    end_date: date
    data_source: str
    days: int
    series: List[SubCountyRainfallSeries]


@router.get("/history", response_model=RainfallHistoryResponse)
def get_rainfall_history(
    sub_county: Optional[str] = Query(
        None, description="Filter to one sub-county (Lira/Alebtong/Dokolo)"
    ),
    days: int = Query(
        30,
        ge=1,
        le=90,
        description="Number of days back from latest CHIRPS observation",
    ),
):
    """
    Daily rainfall (mm) per sub-county for the last N days, sourced from CHIRPS.

    Note: CHIRPS daily product lags real-time by ~30 days. The endpoint anchors
    the window on the most recent observation in the database rather than today,
    so the chart always returns usable data.
    """
    # 1. Resolve sub-counties
    sc_res = shared("sub_counties").select("id, name").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    sc_map = {}
    for sc in sc_res.data:
        nm = sc["name"]
        if sub_county and sub_county.lower() not in nm.lower():
            continue
        sc_map[sc["id"]] = nm

    if not sc_map:
        raise HTTPException(status_code=404, detail="No matching sub-counties")

    # 2. Find the most recent daily observation across all sub-counties
    latest_res = (
        aeryion("rainfall_observations")
        .select("observation_date")
        .eq("period_days", 1)
        .order("observation_date", desc=True)
        .limit(1)
        .execute()
    )
    if not latest_res.data:
        raise HTTPException(
            status_code=404,
            detail="No daily rainfall data ingested. Run workers/chirps_daily_lango.py to populate.",
        )

    end_date = date.fromisoformat(latest_res.data[0]["observation_date"])
    start_date = end_date - timedelta(days=days - 1)

    # 3. Fetch daily rows in window
    rows = (
        aeryion("rainfall_observations")
        .select("sub_county_id, observation_date, rainfall_mm")
        .eq("period_days", 1)
        .gte("observation_date", start_date.isoformat())
        .lte("observation_date", end_date.isoformat())
        .in_("sub_county_id", list(sc_map.keys()))
        .order("observation_date")
        .execute()
    )

    # 4. Group by sub_county
    series_by_sc: dict[str, List[DailyRainfallPoint]] = {
        nm: [] for nm in sc_map.values()
    }
    for row in rows.data or []:
        sc_name = sc_map.get(row["sub_county_id"])
        if sc_name is None:
            continue
        series_by_sc[sc_name].append(
            DailyRainfallPoint(
                date=row["observation_date"],
                rainfall_mm=float(row.get("rainfall_mm") or 0),
            )
        )

    series = [
        SubCountyRainfallSeries(sub_county=nm, daily=points)
        for nm, points in sorted(series_by_sc.items())
    ]

    return RainfallHistoryResponse(
        start_date=start_date,
        end_date=end_date,
        data_source="chirps_daily",
        days=days,
        series=series,
    )
