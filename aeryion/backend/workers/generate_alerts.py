"""
generate_alerts.py
==================
Reads latest NDVI / rainfall / soil readings from Supabase and inserts alerts
into aeryion.weather_alerts based on the documented Aeryion v1 ruleset.

Schema target: aeryion.weather_alerts
  id (uuid PK), sub_county_id (uuid FK), alert_type (text NOT NULL),
  severity (text NOT NULL), forecast_date (date), confidence_pct (double),
  message_en (text), message_luo (text), active (bool default true),
  sms_count (int default 0)

Aeryion v1 ruleset:
  R1 — Drought:           anomaly_pct < -30%      → CRITICAL  (alert_type='drought')
  R2 — Flood:             anomaly_pct > +50%      → HIGH      (alert_type='flood_risk')
  R3 — Heavy rain (7-day): disabled (no real forecast table populated)
  R4 — Vegetation stress:  NDVI < 0.30            → HIGH      (alert_type='vegetation_stress')
  R5 — Vegetation critical:NDVI < 0.15            → CRITICAL  (alert_type='vegetation_stress')
  R7 — Soil acidity:       pH < 5.5               → MEDIUM    (alert_type='soil_acidity')
       Soil alkalinity:    pH > 7.5               → MEDIUM    (alert_type='soil_alkalinity')

Idempotency:
  Skip insert if an active alert with the same (sub_county_id, alert_type,
  severity) already exists in the last 7 days.

Usage:
    python3 aeryion/backend/workers/generate_alerts.py
"""

import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"
LOCAL_ENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(LOCAL_ENV if LOCAL_ENV.exists() else ROOT_ENV)

from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def db(table: str):
    return sb.schema("aeryion").table(table)


def db_shared(table: str):
    return sb.schema("shared").table(table)


# ── Thresholds ───────────────────────────────────────────────────────────────
DROUGHT_ANOMALY_PCT = -30.0
FLOOD_ANOMALY_PCT = 50.0
NDVI_STRESS_THRESHOLD = 0.30
NDVI_CRITICAL_THRESHOLD = 0.15
SOIL_PH_ACIDIC_THRESHOLD = 5.5
SOIL_PH_ALKALINE_THRESHOLD = 7.5

DUPLICATE_LOOKBACK_DAYS = 7


def existing_active_alert(sub_county_id: str, alert_type: str, severity: str) -> bool:
    cutoff = (
        datetime.now(timezone.utc) - timedelta(days=DUPLICATE_LOOKBACK_DAYS)
    ).isoformat()
    try:
        r = (
            db("weather_alerts")
            .select("id")
            .eq("sub_county_id", sub_county_id)
            .eq("alert_type", alert_type)
            .eq("severity", severity)
            .eq("active", True)
            .gte("created_at", cutoff)
            .limit(1)
            .execute()
        )
        return bool(r.data)
    except Exception:
        return False


def insert_alert(
    sub_county_id: str,
    alert_type: str,
    severity: str,
    message_en: str,
    confidence: float = 0.85,
) -> bool:
    if existing_active_alert(sub_county_id, alert_type, severity):
        print(
            f"    ⊙ skipped (duplicate active): {alert_type}/{severity}/{sub_county_id[:8]}..."
        )
        return False

    record = {
        "sub_county_id": sub_county_id,
        "alert_type": alert_type,
        "severity": severity,
        "forecast_date": date.today().isoformat(),
        "confidence_pct": round(confidence * 100, 1),
        "message_en": message_en,
        "active": True,
    }
    try:
        db("weather_alerts").insert(record).execute()
        print(f"    ✓ {severity:8} [{alert_type}] sub_county={sub_county_id[:8]}...")
        return True
    except Exception as e:
        print(f"    ✗ insert failed: {str(e)[:120]}")
        return False


def get_sub_county_name(sub_county_id: str) -> str:
    sc = (
        db_shared("sub_counties")
        .select("name")
        .eq("id", sub_county_id)
        .single()
        .execute()
    )
    return sc.data["name"] if sc.data else "Unknown"


# ── R1 / R2 — Rainfall anomaly ───────────────────────────────────────────────
def evaluate_rainfall_anomaly():
    print("\n── R1/R2: Rainfall anomaly ──")
    rows = (
        db("rainfall_observations")
        .select("sub_county_id, rainfall_mm, anomaly_pct, observation_date")
        .order("observation_date", desc=True)
        .limit(50)
        .execute()
    )
    seen = set()
    inserted = 0
    for row in rows.data or []:
        sc_id = row["sub_county_id"]
        if sc_id in seen:
            continue
        seen.add(sc_id)
        anomaly = row.get("anomaly_pct")
        if anomaly is None:
            continue
        sc_name = get_sub_county_name(sc_id)

        if anomaly < DROUGHT_ANOMALY_PCT:
            ok = insert_alert(
                sc_id,
                "drought",
                "CRITICAL",
                f"Drought conditions detected in {sc_name}. 90-day rainfall anomaly of "
                f"{anomaly:.1f}% below historical average. Crops likely water-stressed. "
                f"Recommend irrigation interventions and delayed planting advisories.",
                confidence=0.90,
            )
            inserted += 1 if ok else 0
        elif anomaly > FLOOD_ANOMALY_PCT:
            ok = insert_alert(
                sc_id,
                "flood_risk",
                "HIGH",
                f"Flood risk in {sc_name}. 90-day rainfall {anomaly:.1f}% above historical avg. "
                f"Risk of waterlogging in low-lying agricultural zones. Advise drainage maintenance.",
                confidence=0.85,
            )
            inserted += 1 if ok else 0
    print(f"  → {inserted} alerts inserted")


# ── R4 / R5 — NDVI vegetation health ─────────────────────────────────────────
def evaluate_ndvi():
    print("\n── R4/R5: Vegetation health (NDVI) ──")
    rows = (
        db("ndvi_observations")
        .select("sub_county_id, ndvi_mean, observed_date")
        .order("observed_date", desc=True)
        .limit(50)
        .execute()
    )
    seen = set()
    inserted = 0
    for row in rows.data or []:
        sc_id = row["sub_county_id"]
        if sc_id in seen:
            continue
        seen.add(sc_id)
        ndvi = row.get("ndvi_mean")
        if ndvi is None:
            continue
        sc_name = get_sub_county_name(sc_id)

        if ndvi < NDVI_CRITICAL_THRESHOLD:
            ok = insert_alert(
                sc_id,
                "vegetation_stress",
                "CRITICAL",
                f"Critical vegetation distress in {sc_name}. NDVI of {ndvi:.2f} indicates "
                f"severely stressed or dying crops. Immediate field inspection recommended.",
                confidence=0.92,
            )
            inserted += 1 if ok else 0
        elif ndvi < NDVI_STRESS_THRESHOLD:
            ok = insert_alert(
                sc_id,
                "vegetation_stress",
                "HIGH",
                f"Vegetation stress in {sc_name}. NDVI of {ndvi:.2f} below healthy threshold. "
                f"Possible causes: water stress, pest damage, or nutrient deficiency. "
                f"Recommend ground-truth scouting.",
                confidence=0.88,
            )
            inserted += 1 if ok else 0
    print(f"  → {inserted} alerts inserted")


# ── R7 — Soil pH ─────────────────────────────────────────────────────────────
def evaluate_soil_ph():
    print("\n── R7: Soil pH ──")
    rows = (
        db("soil_baselines")
        .select("sub_county_id, ph_value")
        .eq("data_source", "isdasoil")
        .execute()
    )
    seen = set()
    inserted = 0
    for row in rows.data or []:
        sc_id = row["sub_county_id"]
        if sc_id in seen:
            continue
        seen.add(sc_id)
        ph = row.get("ph_value")
        if ph is None:
            continue
        sc_name = get_sub_county_name(sc_id)

        if ph < SOIL_PH_ACIDIC_THRESHOLD:
            ok = insert_alert(
                sc_id,
                "soil_acidity",
                "MEDIUM",
                f"Acidic soil baseline in {sc_name}. iSDAsoil pH of {ph:.2f} below optimal "
                f"5.5–7.5 range. Recommend agricultural lime application before next planting.",
                confidence=0.95,
            )
            inserted += 1 if ok else 0
        elif ph > SOIL_PH_ALKALINE_THRESHOLD:
            ok = insert_alert(
                sc_id,
                "soil_alkalinity",
                "MEDIUM",
                f"Alkaline soil baseline in {sc_name}. iSDAsoil pH of {ph:.2f} above optimal. "
                f"Recommend organic matter (compost, manure) to gradually lower pH.",
                confidence=0.95,
            )
            inserted += 1 if ok else 0
    print(f"  → {inserted} alerts inserted")


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("AERYION — Alert Generation Worker")
    print(f"Target: {os.environ['SUPABASE_URL']}")
    print(f"Run at: {datetime.now(timezone.utc).isoformat()}")

    evaluate_rainfall_anomaly()
    evaluate_ndvi()
    evaluate_soil_ph()

    active = (
        db("weather_alerts")
        .select("severity", count="exact")
        .eq("active", True)
        .execute()
    )
    by_sev = {}
    for a in active.data or []:
        by_sev[a["severity"]] = by_sev.get(a["severity"], 0) + 1

    print(f"\n── Summary ──")
    print(f"  Total active alerts: {active.count or 0}")
    for sev in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
        if sev in by_sev:
            print(f"    {sev:9} {by_sev[sev]}")

    print("\n✓ Done.")
