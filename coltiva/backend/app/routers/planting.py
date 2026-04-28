# FILE: coltiva/backend/app/routers/planting.py
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.db.supabase import coltiva, aeryion, resolve_sub_county
from app.clients.aeryion import client as aeryion_client
from app.models.schemas import (
    PlotCreate, PlotResponse, PlotAdvisoryResponse, AdvisoryItem,
)

router = APIRouter()


# Crop calendar — minimal first cut. Based on Lango bimodal seasons (March-July, Aug-Dec).
CROP_CYCLE_DAYS = {
    "maize":     115,
    "sorghum":   120,
    "beans":     90,
    "groundnut": 100,
    "sunflower": 110,
    "cassava":   330,
    "rice":      120,
    "millet":    100,
}

# Critical NDVI threshold by crop growth stage (% of cycle)
def expected_ndvi(crop: str, days_planted: int) -> tuple[float, float]:
    """Return (min_healthy_ndvi, max_healthy_ndvi) for the crop's current stage."""
    cycle = CROP_CYCLE_DAYS.get(crop, 120)
    pct   = days_planted / cycle if cycle > 0 else 0
    if pct < 0.15:                      # emergence
        return (0.20, 0.40)
    elif pct < 0.50:                    # vegetative
        return (0.45, 0.75)
    elif pct < 0.80:                    # flowering / grain fill
        return (0.55, 0.85)
    else:                               # senescence
        return (0.30, 0.60)


# ─── Plots ────────────────────────────────────────────────────────────────────
@router.post("/plots", response_model=PlotResponse, status_code=201)
def register_plot(plot: PlotCreate):
    """
    Register a plot with GPS coordinates.
    Sub-county is resolved automatically via PostGIS ST_Contains.
    """
    # Verify farmer exists
    farmer = coltiva("farmers").select("id").eq("id", plot.farmer_id).execute()
    if not farmer.data:
        raise HTTPException(status_code=404, detail="Farmer not found")

    # Resolve sub-county from GPS
    sub_county_id = resolve_sub_county(plot.longitude, plot.latitude)

    # Build record
    record = plot.model_dump(exclude_none=True)
    record["sub_county_id"] = sub_county_id

    # Convert dates to ISO strings for Supabase
    if record.get("planted_at"):
        record["planted_at"] = record["planted_at"].isoformat()
    if record.get("expected_harvest"):
        record["expected_harvest"] = record["expected_harvest"].isoformat()

    res = coltiva("plots").insert(record).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to register plot")

    return res.data[0]


@router.get("/plots", response_model=list[PlotResponse])
def list_plots(
    farmer_id: Optional[str] = Query(None),
    limit:     int           = Query(50, ge=1, le=500),
):
    """List plots, optionally filtered by farmer."""
    q = coltiva("plots").select("*").order("created_at", desc=True).limit(limit)
    if farmer_id:
        q = q.eq("farmer_id", farmer_id)
    res = q.execute()
    return res.data or []


@router.get("/plots/{plot_id}", response_model=PlotResponse)
def get_plot(plot_id: str):
    """Get a single plot by id."""
    res = coltiva("plots").select("*").eq("id", plot_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    return res.data


# ─── Advisory generation ──────────────────────────────────────────────────────
@router.get("/plots/{plot_id}/advisory", response_model=PlotAdvisoryResponse)
def get_plot_advisory(plot_id: str):
    """
    Generate a real-time advisory for a plot by joining:
      - latest NDVI       (from Aeryion / Sentinel-2)
      - soil baseline     (from Aeryion / iSDAsoil)
      - 7-day forecast    (from Aeryion / LSTM)
    Returns SMS-friendly action items keyed to the plot's crop and growth stage.
    """
    # Fetch plot
    plot_res = coltiva("plots").select("*").eq("id", plot_id).single().execute()
    if not plot_res.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    plot = plot_res.data

    # Resolve sub-county name from id
    sc_name = "Unknown"
    if plot.get("sub_county_id"):
        sc = aeryion("sub_counties").select("name").eq("id", plot["sub_county_id"]).single().execute()
        if sc.data:
            sc_name = sc.data["name"]

    # Compute days since planting
    days_planted = None
    if plot.get("planted_at"):
        planted = date.fromisoformat(plot["planted_at"]) if isinstance(plot["planted_at"], str) else plot["planted_at"]
        days_planted = (date.today() - planted).days

    # Pull live data from Aeryion API
    ndvi_rec     = aeryion_client.get_ndvi_for_sub_county(sc_name)
    soil_rec     = aeryion_client.get_soil_for_sub_county(sc_name)
    forecast_rec = aeryion_client.get_forecast_for_sub_county(sc_name)

    ndvi_mean      = ndvi_rec.get("ndvi_mean")    if ndvi_rec     else None
    soil_ph        = soil_rec.get("ph_value")     if soil_rec     else None
    forecast_total = sum(d.get("rainfall_mm", 0) for d in forecast_rec) if forecast_rec else None

    # ─── Build advisories ─────────────────────────────────────────────────────
    advisories: list[AdvisoryItem] = []
    crop = plot.get("crop_type", "maize")

    # 1) Vegetation health vs crop stage
    if ndvi_mean is not None and days_planted is not None and days_planted > 0:
        lo, hi = expected_ndvi(crop, days_planted)
        if ndvi_mean < lo:
            advisories.append(AdvisoryItem(
                category="vegetation",
                severity="warning",
                title=f"Crop stress detected ({crop})",
                body=f"Your {crop} field shows NDVI {ndvi_mean:.2f}, below the healthy range of {lo:.2f}–{hi:.2f} for day {days_planted}. This may indicate water stress, pest damage, or nutrient deficiency.",
                action=f"Inspect field within 48hrs. Check for pests on leaves and verify soil moisture.",
            ))
        elif ndvi_mean > hi:
            advisories.append(AdvisoryItem(
                category="vegetation",
                severity="info",
                title="Excellent crop vigour",
                body=f"NDVI {ndvi_mean:.2f} is above expected range — strong vegetative growth.",
                action="Continue current practices.",
            ))
        else:
            advisories.append(AdvisoryItem(
                category="vegetation",
                severity="info",
                title="Crop on track",
                body=f"NDVI {ndvi_mean:.2f} is within healthy range for day {days_planted} of {crop}.",
                action=None,
            ))

    # 2) Rainfall forecast
    if forecast_total is not None:
        if forecast_total > 50:
            advisories.append(AdvisoryItem(
                category="rainfall",
                severity="warning",
                title="Heavy rainfall forecast",
                body=f"Total {forecast_total:.0f}mm forecast over next 7 days. Risk of waterlogging in low-lying plots.",
                action="Clear drainage channels. Delay top-dressing fertilizer until rain ends.",
            ))
        elif forecast_total < 5 and days_planted and days_planted < 60:
            advisories.append(AdvisoryItem(
                category="rainfall",
                severity="warning",
                title="Dry spell forecast",
                body=f"Only {forecast_total:.0f}mm expected over the next 7 days during a critical growth window.",
                action="Conserve soil moisture — apply mulch where possible. Defer planting of new fields.",
            ))
        else:
            advisories.append(AdvisoryItem(
                category="rainfall",
                severity="info",
                title="Adequate rainfall expected",
                body=f"7-day forecast: {forecast_total:.0f}mm. Conditions normal.",
                action=None,
            ))

    # 3) Soil pH advisory
    if soil_ph is not None:
        if soil_ph < 5.5:
            advisories.append(AdvisoryItem(
                category="soil",
                severity="warning",
                title="Acidic soil",
                body=f"Soil pH {soil_ph:.1f} is below optimal 5.5–7.0 for {crop}.",
                action="Apply agricultural lime at 200kg/acre before next planting season.",
            ))
        elif soil_ph > 7.5:
            advisories.append(AdvisoryItem(
                category="soil",
                severity="warning",
                title="Alkaline soil",
                body=f"Soil pH {soil_ph:.1f} is above optimal range.",
                action="Apply organic matter (compost/manure) to gradually lower pH.",
            ))

    # 4) Harvest prediction
    if days_planted is not None and crop in CROP_CYCLE_DAYS:
        cycle = CROP_CYCLE_DAYS[crop]
        days_remaining = cycle - days_planted
        if 0 < days_remaining <= 14:
            advisories.append(AdvisoryItem(
                category="harvest",
                severity="info",
                title="Harvest window approaching",
                body=f"Expected harvest in {days_remaining} days for {crop}.",
                action="Prepare drying space and arrange labour.",
            ))

    return PlotAdvisoryResponse(
        plot_id        = plot["id"],
        farmer_id      = plot["farmer_id"],
        sub_county     = sc_name,
        crop_type      = crop,
        days_planted   = days_planted,
        ndvi_mean      = ndvi_mean,
        soil_ph        = soil_ph,
        forecast_7d_mm = round(forecast_total, 1) if forecast_total is not None else None,
        advisories     = advisories,
        generated_at   = datetime.utcnow(),
    )
