"""
seed_demo_alerts.py
===================
Inserts demo alerts into aeryion.weather_alerts for stakeholder demos.
Each alert is tagged with [DEMO] in message_en for easy filtering/cleanup.

Usage:
    python3 aeryion/backend/workers/seed_demo_alerts.py          # insert
    python3 aeryion/backend/workers/seed_demo_alerts.py --clear  # remove all DEMO alerts
"""

import os
import sys
from datetime import date, datetime, timezone
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


def get_sub_county_id(name: str) -> str | None:
    r = db_shared("sub_counties").select("id").ilike("name", name).limit(1).execute()
    return r.data[0]["id"] if r.data else None


# ── Demo alert templates (resolved at runtime to actual sub_county UUIDs) ────
DEMO_ALERTS = [
    {
        "sub_county": "Lira",
        "alert_type": "rainfall_heavy",
        "severity": "CRITICAL",
        "confidence_pct": 89.0,
        "message_en": "[DEMO] Heavy rainfall forecast in Lira. 52mm expected over next 48 hours. "
        "Risk of surface flooding in low-lying agricultural zones. Advise farmers "
        "to delay planting and harvest standing crops.",
        "message_luo": "[DEMO] Pii malo madongo bibino i Lira. Pii cibedo ki 52mm i kine awalu 48. "
        "Ber ka pwonyo poto pi cabbe ka kobongo myero kibedi.",
    },
    {
        "sub_county": "Dokolo",
        "alert_type": "pest_risk",
        "severity": "HIGH",
        "confidence_pct": 78.0,
        "message_en": "[DEMO] Fall armyworm pressure in Dokolo. Humidity at 88% for 5+ days, "
        "temperature 24–31°C. Conditions favorable for emergence. Recommend "
        "scouting and early intervention.",
        "message_luo": "[DEMO] Akili tek twero bedo me pwonyo cabbe i Dokolo. Cwiny me iye otimo "
        "atir, lyeto onyo kalu. Ber ka kibedo madongo ki neno cabbe-ni.",
    },
    {
        "sub_county": "Alebtong",
        "alert_type": "soil_moisture",
        "severity": "MEDIUM",
        "confidence_pct": 82.0,
        "message_en": "[DEMO] Soil moisture deficit in Alebtong. Currently 28% (below 45% optimal "
        "for maize). 3-day dry forecast. Consider irrigated plots or delay planting "
        "by 5–7 days.",
        "message_luo": "[DEMO] Pii i ngom orem i Alebtong. Tin gibedo 28%. Tii pi pii ki kony marom "
        "ka kobongo cabbe ki nino abic.",
    },
    {
        "sub_county": "Lira",
        "alert_type": "planting_window",
        "severity": "LOW",
        "confidence_pct": 91.0,
        "message_en": "[DEMO] Optimal planting window in Lira. Soil moisture at 65%, 5-day dry "
        "forecast. Conditions favorable for second planting season. Cooperative "
        "messaging recommended.",
        "message_luo": "[DEMO] Kare maber me pwonyo cabbe i Lira. Pii i ngom 65%, lyeto pwoyo "
        "obedo. Tii cabbe atir.",
    },
]


def clear_demo_alerts() -> int:
    """Delete (or hard-deactivate) all weather_alerts where message_en contains [DEMO]."""
    res = (
        db("weather_alerts")
        .select("id, message_en")
        .like("message_en", "%[DEMO]%")
        .execute()
    )
    if not res.data:
        return 0
    for row in res.data:
        db("weather_alerts").delete().eq("id", row["id"]).execute()
    return len(res.data)


def seed_demo_alerts() -> int:
    inserted = 0
    today = date.today().isoformat()

    for spec in DEMO_ALERTS:
        sc_id = get_sub_county_id(spec["sub_county"])
        if not sc_id:
            print(f"  ⊙ skipped — no sub_county named {spec['sub_county']}")
            continue

        # Check for an existing demo alert with same message_en
        dup = (
            db("weather_alerts")
            .select("id")
            .eq("message_en", spec["message_en"])
            .limit(1)
            .execute()
        )
        if dup.data:
            print(
                f"  ⊙ skipped (already exists): {spec['alert_type']}/{spec['sub_county']}"
            )
            continue

        record = {
            "sub_county_id": sc_id,
            "alert_type": spec["alert_type"],
            "severity": spec["severity"],
            "forecast_date": today,
            "confidence_pct": spec["confidence_pct"],
            "message_en": spec["message_en"],
            "message_luo": spec.get("message_luo"),
            "active": True,
        }
        try:
            db("weather_alerts").insert(record).execute()
            print(
                f"  ✓ {spec['severity']:8} [{spec['alert_type']}] {spec['sub_county']}"
            )
            inserted += 1
        except Exception as e:
            print(f"  ✗ insert failed: {str(e)[:120]}")
    return inserted


if __name__ == "__main__":
    if "--clear" in sys.argv:
        print("Clearing all [DEMO] alerts from aeryion.weather_alerts...")
        n = clear_demo_alerts()
        print(f"\n✓ Deleted {n} demo alert(s).")
    else:
        print("Seeding demo alerts into aeryion.weather_alerts...")
        n = seed_demo_alerts()
        print(f"\n✓ Inserted {n} new demo alert(s).")
