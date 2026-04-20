# FILE: app/routers/alerts.py
from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.db.supabase import aeryion
from app.config import settings

router = APIRouter()

class AlertResponse(BaseModel):
    id:             str
    sub_county:     str
    alert_type:     str
    severity:       str
    forecast_date:  date
    confidence_pct: float
    message_en:     str
    message_luo:    Optional[str]
    active:         bool
    created_at:     str

class CreateAlertRequest(BaseModel):
    sub_county_id:  str
    alert_type:     str
    severity:       str
    forecast_date:  date
    confidence_pct: float
    message_en:     str
    message_luo:    Optional[str] = None

SEVERITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

@router.get("/active", response_model=List[AlertResponse])
def get_active_alerts():
    """
    All active weather alerts for Lango sorted by severity.
    Consumed by government dashboard and Coltiva.
    """
    alerts = (aeryion("weather_alerts")
              .select("*, sub_counties(name)")
              .eq("active", True)
              .order("created_at", desc=True)
              .execute())

    if not alerts.data:
        return []

    results = []
    for row in alerts.data:
        sc_name = (row.get("sub_counties") or {}).get("name", "Unknown")
        results.append(AlertResponse(
            id             = str(row["id"]),
            sub_county     = sc_name,
            alert_type     = row["alert_type"],
            severity       = row["severity"],
            forecast_date  = row["forecast_date"],
            confidence_pct = row["confidence_pct"],
            message_en     = row.get("message_en", ""),
            message_luo    = row.get("message_luo"),
            active         = row["active"],
            created_at     = str(row["created_at"])
        ))

    results.sort(key=lambda x: SEVERITY_ORDER.get(x.severity, 99))
    return results


@router.post("/create", status_code=201)
def create_alert(
    payload: CreateAlertRequest,
    x_service_key: Optional[str] = Header(None)
):
    """
    Internal only — creates alert record.
    Called by forecast_runner worker.
    Requires X-Service-Key header matching SUPABASE_SERVICE_KEY.
    """
    if x_service_key != settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Invalid service key")

    # Deactivate existing active alert of same type for same sub-county
    (aeryion("weather_alerts")
     .update({"active": False})
     .eq("sub_county_id", payload.sub_county_id)
     .eq("alert_type", payload.alert_type)
     .eq("active", True)
     .execute())

    record = {
        "sub_county_id":  payload.sub_county_id,
        "alert_type":     payload.alert_type,
        "severity":       payload.severity,
        "forecast_date":  payload.forecast_date.isoformat(),
        "confidence_pct": payload.confidence_pct,
        "message_en":     payload.message_en,
        "message_luo":    payload.message_luo,
        "active":         True
    }

    res = aeryion("weather_alerts").insert(record).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create alert")

    return {"id": res.data[0]["id"], "status": "created"}
