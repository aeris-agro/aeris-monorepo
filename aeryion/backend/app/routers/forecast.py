# FILE: app/routers/forecast.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, timedelta
from app.db.supabase import aeryion, shared

router = APIRouter()


class DailyForecast(BaseModel):
    date: date
    rainfall_mm: float
    confidence_pct: float


class SeasonalForecast(BaseModel):
    season: str
    period: str
    rainfall_category: str  # BELOW_NORMAL / NORMAL / ABOVE_NORMAL
    probability_pct: float
    source: str
    issued_date: str


@router.get("/7day", response_model=List[DailyForecast])
def get_7day_forecast(
    sub_county: Optional[str] = Query(None, description="Sub-county name e.g. Lira")
):
    """
    7-day rainfall forecast per sub-county.
    Currently uses CHIRPS anomaly trend as proxy until LSTM model is deployed.
    LSTM model replaces this in Week 6 (see Section 6 of build guide).
    """
    # Get latest rainfall anomaly to inform trend direction
    sc_res = shared("sub_counties").select("id, name").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    # Filter to requested sub-county if specified
    target_sc = None
    for sc in sc_res.data:
        if not sub_county or sc["name"].lower() == sub_county.lower():
            target_sc = sc
            break

    if not target_sc:
        raise HTTPException(
            status_code=404, detail=f"Sub-county '{sub_county}' not found"
        )

    rainfall = (
        aeryion("rainfall_observations")
        .select("rainfall_mm, anomaly_pct, observation_date")
        .eq("sub_county_id", target_sc["id"])
        .order("observation_date", desc=True)
        .limit(1)
        .execute()
    )

    # Baseline daily from 90-day total
    if rainfall.data:
        row = rainfall.data[0]
        daily_base = row["rainfall_mm"] / 90
        anomaly_pct = row.get("anomaly_pct", 0) or 0
        # Apply anomaly trend: if currently dry, forecast slightly drier
        trend_factor = 1 + (anomaly_pct / 100 * 0.3)
    else:
        daily_base = 5.0  # Uganda April average fallback
        trend_factor = 1.0

    # Build 7-day forecast with natural daily variation
    # Replaced by LSTM model in Week 6
    variation = [1.1, 0.8, 1.3, 0.6, 1.2, 0.9, 1.0]
    today = date.today()

    return [
        DailyForecast(
            date=today + timedelta(days=i + 1),
            rainfall_mm=round(daily_base * trend_factor * variation[i], 2),
            confidence_pct=round(85 - (i * 3.5), 1),  # confidence decays over 7 days
        )
        for i in range(7)
    ]


@router.get("/seasonal", response_model=SeasonalForecast)
def get_seasonal_forecast():
    """
    3-month seasonal outlook from ICPAC data.
    Updated quarterly: March, June, September, December.
    """
    # Current ICPAC outlook for Uganda Lango — April-June 2026
    # Source: icpac.net — updated each quarter
    # Replace with live ICPAC API call when data agreement is in place
    return SeasonalForecast(
        season="Season A 2026",
        period="April - June 2026",
        rainfall_category="NORMAL",
        probability_pct=45.0,
        source="ICPAC East Africa Seasonal Outlook",
        issued_date="2026-03-01",
    )
