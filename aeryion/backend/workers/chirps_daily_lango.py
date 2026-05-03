"""
chirps_daily_lango.py
=====================
Pulls per-day CHIRPS rainfall for each Lango sub-county for the last N days
and writes one row per (sub_county, date) into aeryion.rainfall_observations
with period_days = 1.

Distinct from the existing chirps_rainfall_lango.py worker, which writes
a single 90-day cumulative total per sub-county. This one powers the
dashboard's daily history chart and the /v1/rainfall/history endpoint.

Source:  UCSB-CHG/CHIRPS/DAILY  (5km resolution)
Geometry: OCHA COD-AB ADM2 polygons via FieldMaps (same as workers/sentinel2 + chirps weekly)

Idempotency:
    Upserts on (sub_county_id, observation_date, period_days). Re-running
    the worker for the same date range overwrites previous values rather
    than duplicating.

Usage:
    source aeris-venv/bin/activate
    python3 aeryion/backend/workers/chirps_daily_lango.py            # last 30 days
    python3 aeryion/backend/workers/chirps_daily_lango.py --days 60  # last 60 days
"""

import os
import sys
from datetime import date, timedelta
from pathlib import Path
from dotenv import load_dotenv

ROOT_ENV  = Path(__file__).resolve().parents[3] / ".env"
LOCAL_ENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(LOCAL_ENV if LOCAL_ENV.exists() else ROOT_ENV)

import ee
from supabase import create_client


# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GEE_PROJECT  = "aeryion"

LANGO_DISTRICTS = ["Lira", "Alebtong", "Dokolo"]

# Parse --days flag
DEFAULT_DAYS = 30
days_arg = DEFAULT_DAYS
for i, arg in enumerate(sys.argv):
    if arg == "--days" and i + 1 < len(sys.argv):
        days_arg = int(sys.argv[i + 1])
        break


# ── Init ──────────────────────────────────────────────────────────────────────
print(f"AERYION — Daily CHIRPS Worker (last {days_arg} days)")
print(f"Target: {SUPABASE_URL}\n")

print("Initialising GEE...")
ee.Initialize(project=GEE_PROJECT)
print("GEE OK")

print("Connecting to Supabase...")
sb = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Supabase OK\n")


# ── Step 1: Load sub-counties from shared schema ─────────────────────────────
print("── Step 1: Loading shared.sub_counties ──")
sc_res = sb.schema("shared").table("sub_counties").select("id, name").execute()
sc_rows = {row["name"]: row["id"] for row in (sc_res.data or [])}
print(f"  Found {len(sc_rows)} sub-counties: {list(sc_rows.keys())}\n")
if not sc_rows:
    print("✗ No sub-counties — bailing out.")
    sys.exit(1)


# ── Step 2: Build OCHA geometry filter ───────────────────────────────────────
print("── Step 2: Fetching OCHA geometries ──")
OCHA_ADM2 = ee.FeatureCollection(
    "projects/sat-io/open-datasets/field-maps/edge-matched-humanitarian/adm2_polygons"
)
lango = OCHA_ADM2.filter(ee.Filter.And(
    ee.Filter.eq("adm0_name", "Uganda"),
    ee.Filter.inList("adm2_name", LANGO_DISTRICTS),
))
matched = sorted(lango.aggregate_array("adm2_name").getInfo())
print(f"  OCHA matched: {matched}")
assert matched == sorted(LANGO_DISTRICTS), f"Expected {sorted(LANGO_DISTRICTS)}, got {matched}"

# Build a list of (sub_county_name, ee.Geometry) to iterate
features = lango.getInfo()["features"]
geom_by_name = {feat["properties"]["adm2_name"]: ee.Geometry(feat["geometry"]) for feat in features}
print(f"  Built geometry map for {len(geom_by_name)} districts\n")


# ── Step 3: Iterate days, sample CHIRPS daily per sub_county ─────────────────
chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")

# CHIRPS daily lags real-time by ~30 days. Anchor on the most recent
# available image rather than `today` so we always get usable data.
latest_iso = ee.Date(
    chirps.sort("system:time_start", False).first().get("system:time_start")
).format("YYYY-MM-dd").getInfo()
end_date   = date.fromisoformat(latest_iso)
start_date = end_date - timedelta(days=days_arg - 1)  # inclusive on both ends

print(f"── Step 3: Sampling CHIRPS daily {start_date} → {end_date} (CHIRPS latest = {latest_iso}) ──")

total_inserts = 0
errors        = 0

# Iterate per sub-county to keep the GEE call surface small
for sc_name, sc_id in sc_rows.items():
    if sc_name not in geom_by_name:
        print(f"  {sc_name:12} ⊙ skipped (no OCHA polygon)")
        continue

    geom = geom_by_name[sc_name]
    print(f"\n  {sc_name:12} ({sc_id[:8]}...)", flush=True)

    # Get a list of {date, mean_rainfall} for the date range, in one GEE call
    daily_collection = chirps.filterDate(start_date.isoformat(), end_date.isoformat()) \
                              .filterBounds(geom)

    # Map: each image → reduce to mean over the geometry, return (date, value)
    def per_image(img):
        d = ee.Date(img.get("system:time_start")).format("YYYY-MM-dd")
        mean = img.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geom,
            scale=5000,
        ).get("precipitation")
        return ee.Feature(None, {"obs_date": d, "rainfall_mm": mean})

    fc = daily_collection.map(per_image).filter(ee.Filter.notNull(["rainfall_mm"]))

    try:
        rows = fc.getInfo()["features"]
    except Exception as e:
        print(f"    ✗ GEE fetch failed: {str(e)[:100]}")
        errors += 1
        continue

    print(f"    {len(rows)} daily records returned")

    # Build upsert payload
    records = []
    for r in rows:
        p = r["properties"]
        rainfall_value = p.get("rainfall_mm")
        if rainfall_value is None:
            continue
        records.append({
            "sub_county_id":    sc_id,
            "observation_date": p["obs_date"],
            "period_days":      1,
            "rainfall_mm":      round(float(rainfall_value), 3),
            "drought_flag":     False,
            "flood_flag":       False,
        })

    if not records:
        print(f"    no usable records, skipping")
        continue

    # Upsert in batches (Supabase accepts up to ~1000 per call comfortably)
    try:
        sb.schema("aeryion").table("rainfall_observations").upsert(
            records,
            on_conflict="sub_county_id,observation_date,period_days",
        ).execute()
        total_inserts += len(records)
        print(f"    ✓ upserted {len(records)} rows")
    except Exception as e:
        print(f"    ✗ upsert failed: {str(e)[:140]}")
        errors += 1


# ── Summary ──────────────────────────────────────────────────────────────────
print(f"\n── Summary ──")
print(f"  Total upserts: {total_inserts}")
print(f"  Errors:        {errors}")

# Verify
verify = sb.schema("aeryion").table("rainfall_observations") \
    .select("sub_county_id, observation_date, rainfall_mm", count="exact") \
    .eq("period_days", 1) \
    .gte("observation_date", start_date.isoformat()) \
    .execute()

print(f"\n  Daily rows in DB for {start_date}+ : {verify.count}")

print("\n✓ Done.")
