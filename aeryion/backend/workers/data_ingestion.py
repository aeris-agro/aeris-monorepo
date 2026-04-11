# FILE: aeryion/workers/data_ingestion.py
import json
import subprocess
from datetime import date
from pathlib import Path
from dotenv import load_dotenv
import os
from supabase import create_client, Client

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GCS_BUCKET   = os.environ["GCS_BUCKET_NAME"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def db(table: str):
    return supabase.schema("aeryion").table(table)

# ── helpers ───────────────────────────────────────────────────────────────────

def download_latest_geojson(prefix: str) -> dict:
    result = subprocess.run(
        ["gsutil", "ls", f"gs://{GCS_BUCKET}/{prefix}/"],
        capture_output=True, text=True, check=True
    )
    files = [f.strip() for f in result.stdout.strip().split("\n") if f.endswith(".geojson")]
    if not files:
        raise FileNotFoundError(f"No GeoJSON files found in gs://{GCS_BUCKET}/{prefix}/")
    latest = sorted(files)[-1]
    print(f"Downloading: {latest}")
    content = subprocess.run(
        ["gsutil", "cat", latest],
        capture_output=True, text=True, check=True
    ).stdout
    return json.loads(content)

def get_or_create_district(name: str) -> str:
    res = db("districts").select("id").eq("name", name).execute()
    if res.data:
        return res.data[0]["id"]
    ins = db("districts").insert({
        "name": name,
        "code": name.lower()[:3],
        "geometry": "MULTIPOLYGON EMPTY"
    }).execute()
    return ins.data[0]["id"]

def get_or_create_sub_county(name: str, district_id: str) -> str:
    res = db("sub_counties").select("id").eq("name", name).execute()
    if res.data:
        return res.data[0]["id"]
    ins = db("sub_counties").insert({
        "name": name,
        "district_id": district_id,
        "geometry": "MULTIPOLYGON EMPTY"
    }).execute()
    return ins.data[0]["id"]

# ── NDVI ingestion ────────────────────────────────────────────────────────────

def ingest_ndvi():
    print("\n── Ingesting NDVI data ──")
    geojson  = download_latest_geojson("ndvi")
    today    = date.today().isoformat()
    inserted = 0
    skipped  = 0

    for feature in geojson.get("features", []):
        props = feature.get("properties", {})

        # GEE FAO GAUL exports use lowercase adm keys
        district_name = props.get("adm1_name") or props.get("adm2_name", "Unknown")
        sc_name       = props.get("adm2_name", "Unknown")

        ndvi_mean = props.get("NDVI_mean")
        if ndvi_mean is None:
            print(f"  Skipping {sc_name} — no NDVI_mean value")
            skipped += 1
            continue

        district_id = get_or_create_district(district_name)
        sc_id       = get_or_create_sub_county(sc_name, district_id)

        record = {
            "sub_county_id": sc_id,
            "observed_date": today,
            "ndvi_mean":     round(ndvi_mean, 4),
            "ndvi_min":      round(props.get("NDVI_min", 0), 4),
            "ndvi_max":      round(props.get("NDVI_max", 0), 4),
            "red_edge_mean": round(props["RedEdge_mean"], 4) if props.get("RedEdge_mean") else None,
            "data_source":   "sentinel2"
        }

        db("ndvi_observations").upsert(
            record, on_conflict="sub_county_id,observed_date"
        ).execute()

        print(f"  ✓ {sc_name} ({district_name}): NDVI={ndvi_mean:.3f}")
        inserted += 1

    print(f"  Done — {inserted} inserted, {skipped} skipped")

# ── Rainfall ingestion ────────────────────────────────────────────────────────

def ingest_rainfall():
    print("\n── Ingesting CHIRPS rainfall data ──")
    geojson  = download_latest_geojson("rainfall")
    today    = date.today().isoformat()
    inserted = 0
    skipped  = 0

    for feature in geojson.get("features", []):
        props = feature.get("properties", {})

        # GEE FAO GAUL exports use lowercase adm keys
        district_name = props.get("adm1_name") or props.get("adm2_name", "Unknown")
        sc_name       = props.get("adm2_name", "Unknown")

        # CHIRPS export key is current_mm (not current_mm_mean)
        rainfall_mm = props.get("current_mm")
        if rainfall_mm is None:
            print(f"  Skipping {sc_name} — no current_mm value")
            skipped += 1
            continue

        # anomaly_pct is exported directly (not anomaly_pct_mean)
        anomaly_pct  = props.get("anomaly_pct")
        drought_flag = anomaly_pct is not None and anomaly_pct < -30
        flood_flag   = anomaly_pct is not None and anomaly_pct > 50

        district_id = get_or_create_district(district_name)
        sc_id       = get_or_create_sub_county(sc_name, district_id)

        record = {
            "sub_county_id":    sc_id,
            "observation_date": today,
            "period_days":      90,
            "rainfall_mm":      round(rainfall_mm, 2),
            "anomaly_pct":      round(anomaly_pct, 2) if anomaly_pct is not None else None,
            "drought_flag":     drought_flag,
            "flood_flag":       flood_flag
        }

        db("rainfall_observations").upsert(
            record, on_conflict="sub_county_id,observation_date,period_days"
        ).execute()

        flag = " ⚠ DROUGHT" if drought_flag else (" ⚠ FLOOD" if flood_flag else "")
        print(f"  ✓ {sc_name} ({district_name}): {rainfall_mm:.1f}mm | anomaly={anomaly_pct:.1f}%{flag}")
        inserted += 1

    print(f"  Done — {inserted} inserted, {skipped} skipped")

# ── entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("AERYION Data Ingestion Worker")
    print(f"Target: {SUPABASE_URL}")
    ingest_ndvi()
    ingest_rainfall()
    print("\n✓ Ingestion complete")
