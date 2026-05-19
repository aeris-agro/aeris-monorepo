# FILE: coltiva/backend/app/routers/planting.py
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel

from app.db.supabase import coltiva, resolve_sub_county, shared
from app.clients.aeryion import client as aeryion_client
from app.services.sms import client as sms_client
from app.models.schemas import (
    PlotCreate,
    PlotResponse,
    PlotAdvisoryResponse,
    AdvisoryItem,
)

router = APIRouter()


CROP_CYCLE_DAYS = {
    "maize": 115,
    "sorghum": 120,
    "beans": 90,
    "groundnut": 100,
    "sunflower": 110,
    "cassava": 330,
    "rice": 120,
    "millet": 100,
}

SEVERITY_ORDER = {"critical": 0, "warning": 1, "info": 2}


def expected_ndvi(crop: str, days_planted: int) -> tuple[float, float]:
    cycle = CROP_CYCLE_DAYS.get(crop, 120)
    pct = days_planted / cycle if cycle > 0 else 0
    if pct < 0.15:
        return (0.20, 0.40)
    elif pct < 0.50:
        return (0.45, 0.75)
    elif pct < 0.80:
        return (0.55, 0.85)
    else:
        return (0.30, 0.60)


def build_advisories(plot: dict, sc_name: str) -> tuple[list[AdvisoryItem], dict]:
    """Build advisory list and metadata for a plot. Returns (items, metadata)."""
    advisories: list[AdvisoryItem] = []
    crop = plot.get("crop_type", "maize")

    days_planted = None
    if plot.get("planted_at"):
        planted = date.fromisoformat(plot["planted_at"]) if isinstance(plot["planted_at"], str) else plot["planted_at"]
        days_planted = (date.today() - planted).days

    ndvi_rec = aeryion_client.get_ndvi_for_sub_county(sc_name)
    soil_rec = aeryion_client.get_soil_for_sub_county(sc_name)
    forecast_rec = aeryion_client.get_forecast_for_sub_county(sc_name)

    ndvi_mean = ndvi_rec.get("ndvi_mean") if ndvi_rec else None
    soil_ph = soil_rec.get("ph_value") if soil_rec else None
    forecast_total = sum(d.get("rainfall_mm", 0) for d in forecast_rec) if forecast_rec else None

    # 1) Vegetation
    if ndvi_mean is not None and days_planted is not None and days_planted > 0:
        lo, hi = expected_ndvi(crop, days_planted)
        if ndvi_mean < lo:
            advisories.append(
                AdvisoryItem(
                    category="vegetation",
                    severity="warning",
                    title=f"Crop stress detected ({crop})",
                    body=(
                        f"Your {crop} field shows NDVI {ndvi_mean:.2f}, below the healthy range of "
                        f"{lo:.2f}–{hi:.2f} for day {days_planted}. May indicate water stress, pest "
                        "damage, or nutrient deficiency."
                    ),
                    action="Inspect field within 48hrs. Check for pests on leaves and verify soil moisture.",
                )
            )
        elif ndvi_mean > hi:
            advisories.append(
                AdvisoryItem(
                    category="vegetation",
                    severity="info",
                    title="Excellent crop vigour",
                    body=f"NDVI {ndvi_mean:.2f} is above expected — strong vegetative growth.",
                    action="Continue current practices.",
                )
            )
        else:
            advisories.append(
                AdvisoryItem(
                    category="vegetation",
                    severity="info",
                    title="Crop on track",
                    body=f"NDVI {ndvi_mean:.2f} is within healthy range for day {days_planted} of {crop}.",
                    action=None,
                )
            )

    # 2) Rainfall
    if forecast_total is not None:
        if forecast_total > 50:
            advisories.append(
                AdvisoryItem(
                    category="rainfall",
                    severity="warning",
                    title="Heavy rainfall forecast",
                    body=f"Total {forecast_total:.0f}mm forecast over next 7 days. Risk of waterlogging.",
                    action="Clear drainage channels. Delay top-dressing fertilizer until rain ends.",
                )
            )
        elif forecast_total < 5 and days_planted and days_planted < 60:
            advisories.append(
                AdvisoryItem(
                    category="rainfall",
                    severity="warning",
                    title="Dry spell forecast",
                    body=f"Only {forecast_total:.0f}mm expected over next 7 days during a critical growth window.",
                    action="Apply mulch where possible. Defer planting of new fields.",
                )
            )
        else:
            advisories.append(
                AdvisoryItem(
                    category="rainfall",
                    severity="info",
                    title="Adequate rainfall expected",
                    body=f"7-day forecast: {forecast_total:.0f}mm. Conditions normal.",
                    action=None,
                )
            )

    # 3) Soil pH
    if soil_ph is not None:
        if soil_ph < 5.5:
            advisories.append(
                AdvisoryItem(
                    category="soil",
                    severity="warning",
                    title="Acidic soil",
                    body=f"Soil pH {soil_ph:.1f} is below optimal 5.5–7.0 for {crop}.",
                    action="Apply agricultural lime at 200kg/acre before next planting season.",
                )
            )
        elif soil_ph > 7.5:
            advisories.append(
                AdvisoryItem(
                    category="soil",
                    severity="warning",
                    title="Alkaline soil",
                    body=f"Soil pH {soil_ph:.1f} is above optimal range.",
                    action="Apply organic matter to gradually lower pH.",
                )
            )

    # 4) Harvest
    if days_planted is not None and crop in CROP_CYCLE_DAYS:
        cycle = CROP_CYCLE_DAYS[crop]
        days_remaining = cycle - days_planted
        if 0 < days_remaining <= 14:
            advisories.append(
                AdvisoryItem(
                    category="harvest",
                    severity="info",
                    title="Harvest window approaching",
                    body=f"Expected harvest in {days_remaining} days for {crop}.",
                    action="Prepare drying space and arrange labour.",
                )
            )

    metadata = {
        "ndvi_mean": ndvi_mean,
        "soil_ph": soil_ph,
        "forecast_7d_mm": round(forecast_total, 1) if forecast_total is not None else None,
        "days_planted": days_planted,
        "crop_type": crop,
    }
    return advisories, metadata


def format_sms(advisory: AdvisoryItem, farmer_name: str, crop: str) -> str:
    """Format an advisory as a ≤320 char SMS for Africa's Talking."""
    prefix = "AERIS"
    name = farmer_name.split()[0] if farmer_name else "Farmer"
    parts = [f"{prefix}: Hi {name}.", advisory.title + "."]
    if advisory.body:
        parts.append(advisory.body)
    if advisory.action:
        parts.append(f"Action: {advisory.action}")
    msg = " ".join(parts)
    if len(msg) > 320:
        msg = msg[:317] + "..."
    return msg


# ─── Plots ────────────────────────────────────────────────────────────────────
@router.post("/plots", response_model=PlotResponse, status_code=201)
def register_plot(plot: PlotCreate):
    """Register a plot. Sub-county is auto-resolved via PostGIS ST_Contains."""
    farmer = coltiva("farmers").select("id").eq("id", plot.farmer_id).execute()
    if not farmer.data:
        raise HTTPException(status_code=404, detail="Farmer not found")

    sub_county_id = resolve_sub_county(plot.longitude, plot.latitude)

    record = plot.model_dump(exclude_none=True)
    record["sub_county_id"] = sub_county_id

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
    limit: int = Query(50, ge=1, le=500),
):
    q = coltiva("plots").select("*").order("created_at", desc=True).limit(limit)
    if farmer_id:
        q = q.eq("farmer_id", farmer_id)
    res = q.execute()
    return res.data or []


@router.get("/plots/{plot_id}", response_model=PlotResponse)
def get_plot(plot_id: str):
    res = coltiva("plots").select("*").eq("id", plot_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    return res.data


# ─── Advisory ─────────────────────────────────────────────────────────────────
@router.get("/plots/{plot_id}/advisory", response_model=PlotAdvisoryResponse)
def get_plot_advisory(plot_id: str):
    """Generate a real-time advisory for a plot (read-only, doesn't send SMS)."""
    plot_res = coltiva("plots").select("*").eq("id", plot_id).single().execute()
    if not plot_res.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    plot = plot_res.data

    sc_name = "Unknown"
    if plot.get("sub_county_id"):
        sc = shared("sub_counties").select("name").eq("id", plot["sub_county_id"]).single().execute()
        if sc.data:
            sc_name = sc.data["name"]

    advisories, meta = build_advisories(plot, sc_name)

    return PlotAdvisoryResponse(
        plot_id=plot["id"],
        farmer_id=plot["farmer_id"],
        sub_county=sc_name,
        crop_type=meta["crop_type"],
        days_planted=meta["days_planted"],
        ndvi_mean=meta["ndvi_mean"],
        soil_ph=meta["soil_ph"],
        forecast_7d_mm=meta["forecast_7d_mm"],
        advisories=advisories,
        generated_at=datetime.utcnow(),
    )


# ─── Advisory dispatch ────────────────────────────────────────────────────────
class AdvisorySendResponse(BaseModel):
    plot_id: str
    phone: str
    sent: bool
    message: str
    provider_msg_id: Optional[str]
    cost: Optional[str]
    error: Optional[str]
    advisory_id: Optional[str]


@router.post("/plots/{plot_id}/advisory/send", response_model=AdvisorySendResponse)
def send_plot_advisory(plot_id: str):
    """
    Generate the advisory for a plot and SMS the highest-priority item to the farmer.
    Logs to coltiva.advisories and coltiva.sms_log.
    """
    # 1. Fetch plot + farmer
    plot_res = coltiva("plots").select("*").eq("id", plot_id).single().execute()
    if not plot_res.data:
        raise HTTPException(status_code=404, detail="Plot not found")
    plot = plot_res.data

    farmer_res = coltiva("farmers").select("id, full_name, phone").eq("id", plot["farmer_id"]).single().execute()
    if not farmer_res.data:
        raise HTTPException(status_code=404, detail="Farmer not found for this plot")
    farmer = farmer_res.data

    sc_name = "Unknown"
    if plot.get("sub_county_id"):
        sc = shared("sub_counties").select("name").eq("id", plot["sub_county_id"]).single().execute()
        if sc.data:
            sc_name = sc.data["name"]

    # 2. Generate advisories
    advisories, meta = build_advisories(plot, sc_name)
    if not advisories:
        raise HTTPException(status_code=200, detail="No advisories to send")

    # 3. Pick highest-priority advisory
    top = sorted(advisories, key=lambda a: SEVERITY_ORDER.get(a.severity, 9))[0]
    message = format_sms(top, farmer["full_name"], meta["crop_type"])

    # 4. Persist advisory record
    advisory_record = {
        "plot_id": plot["id"],
        "farmer_id": farmer["id"],
        "category": top.category,
        "severity": top.severity,
        "title": top.title,
        "body": top.body,
        "action": top.action,
        "metadata": meta,
    }
    adv_res = coltiva("advisories").insert(advisory_record).execute()
    advisory_id = adv_res.data[0]["id"] if adv_res.data else None

    # 5. Send via Africa's Talking
    sms_result = sms_client.send(farmer["phone"], message)

    # 6. Log SMS attempt
    sms_log_record = {
        "farmer_id": farmer["id"],
        "advisory_id": advisory_id,
        "phone": farmer["phone"],
        "message": message,
        "provider": "africastalking",
        "provider_msg_id": sms_result.provider_msg_id,
        "status": sms_result.status,
        "error": sms_result.error,
    }
    if sms_result.cost:
        # AT returns "KES 0.8000" or similar — strip non-numeric for our INTEGER cost_ugx column
        try:
            cost_value = float("".join(c for c in sms_result.cost if c.isdigit() or c == "."))
            sms_log_record["cost_ugx"] = int(cost_value * 100)  # store in cents
        except (ValueError, AttributeError):
            pass

    coltiva("sms_log").insert(sms_log_record).execute()

    # 7. Mark advisory as sent if successful
    if sms_result.success and advisory_id:
        coltiva("advisories").update(
            {
                "sent_via_sms": True,
                "sent_at": datetime.utcnow().isoformat(),
            }
        ).eq("id", advisory_id).execute()

    return AdvisorySendResponse(
        plot_id=plot["id"],
        phone=farmer["phone"],
        sent=sms_result.success,
        message=message,
        provider_msg_id=sms_result.provider_msg_id,
        cost=sms_result.cost,
        error=sms_result.error,
        advisory_id=advisory_id,
    )
