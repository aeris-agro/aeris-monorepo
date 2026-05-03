"""
load_isdasoil_v3.py
===================
Falls back to known district centroids if polygon sampling fails.
"""

import json
from datetime import date

import os
from dotenv import load_dotenv
load_dotenv()

import ee
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GEE_PROJECT = "aeryion"
OBSERVED_DATE = date.today().isoformat()

# Hardcoded centroids for Lango sub-region districts (lon, lat)
CENTROIDS = {
    "Lira": (32.8997, 2.2499),
    "Alebtong": (33.2200, 2.2533),
    "Dokolo": (33.1700, 1.9100),
}

print("Initialising GEE...")
ee.Initialize(project=GEE_PROJECT)
print("GEE OK")

print("Connecting to Supabase...")
sb = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Supabase OK\n")

# Load sub-counties from aeryion schema
print("── Step 1: Loading sub-counties from aeryion schema ──")
sc_res = sb.schema("shared").table("sub_counties").select("id, name").execute()
sub_counties = sc_res.data
print(f"Found {len(sub_counties)} sub-counties:")
for sc in sub_counties:
    print(f"  {sc['id']} → {sc['name']}")
print()

# Load iSDAsoil stack
print("── Step 2: Loading iSDAsoil images ──")
stack = ee.Image(
    [
        ee.Image("ISDASOIL/Africa/v1/ph").select("mean_0_20").rename("ph"),
        ee.Image("ISDASOIL/Africa/v1/nitrogen_total")
        .select("mean_0_20")
        .rename("nitrogen"),
        ee.Image("ISDASOIL/Africa/v1/carbon_organic")
        .select("mean_0_20")
        .rename("carbon"),
        ee.Image("ISDASOIL/Africa/v1/phosphorus_extractable")
        .select("mean_0_20")
        .rename("phosphorus"),
        ee.Image("ISDASOIL/Africa/v1/clay_content").select("mean_0_20").rename("clay"),
    ]
)
print("  Stack: ph, nitrogen, carbon, phosphorus, clay\n")

# Sample at each centroid (5km buffer)
print("── Step 3: Sampling iSDAsoil per sub-county (centroid + 5km buffer) ──")
loaded = skipped = errors = 0

for sc in sub_counties:
    sc_id = sc["id"]
    sc_name = sc["name"]

    print(f"  {sc_name:25} ({sc_id[:8]}...) ...", end=" ", flush=True)

    centroid = CENTROIDS.get(sc_name)
    if not centroid:
        print(f"SKIP (no centroid for '{sc_name}')")
        skipped += 1
        continue

    try:
        lon, lat = centroid
        point = ee.Geometry.Point([lon, lat]).buffer(5000)  # 5km buffer

        result = stack.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=point,
            scale=250,
            maxPixels=1e9,
            bestEffort=True,
        ).getInfo()

        if not result or all(v is None for v in result.values()):
            print("SKIP (no iSDAsoil data even at centroid)")
            skipped += 1
            continue

        # Apply scaling
        def scale(val, factor):
            return round(val / factor, 3) if val is not None else None

        ph_value = scale(result.get("ph"), 10)
        nitrogen_pct = scale(result.get("nitrogen"), 1000)
        organic_carbon_pct = scale(result.get("carbon"), 1000)
        phosphorous_ppm = scale(result.get("phosphorus"), 10)
        clay_pct = scale(result.get("clay"), 10)

        # Texture class
        texture_class = "Loam"
        if clay_pct is not None:
            if clay_pct >= 40:
                texture_class = "Clay"
            elif clay_pct >= 27:
                texture_class = "Clay Loam"
            elif clay_pct < 15:
                texture_class = "Sandy Loam"

        print(
            f"pH={ph_value} N={nitrogen_pct}% OC={organic_carbon_pct}% P={phosphorous_ppm}ppm clay={clay_pct}% [{texture_class}]"
        )

        record = {
            "sub_county_id": sc_id,
            "ph_value": ph_value,
            "nitrogen_pct": nitrogen_pct,
            "phosphorous_ppm": phosphorous_ppm,
            "organic_carbon_pct": organic_carbon_pct,
            "clay_pct": clay_pct,
            "texture_class": texture_class,
            "data_source": "isdasoil",
            "observed_date": OBSERVED_DATE,
        }

        existing = (
            sb.schema("aeryion")
            .table("soil_baselines")
            .select("id")
            .eq("sub_county_id", sc_id)
            .eq("data_source", "isdasoil")
            .execute()
        )

        if existing.data:
            sb.schema("aeryion").table("soil_baselines").update(record).eq(
                "id", existing.data[0]["id"]
            ).execute()
        else:
            sb.schema("aeryion").table("soil_baselines").insert(record).execute()

        loaded += 1

    except Exception as e:
        print(f"ERROR: {e}")
        errors += 1

# Verify
print("\n── Step 4: Verification ──")
print(f"  Loaded: {loaded}  Skipped: {skipped}  Errors: {errors}")

verify = (
    sb.schema("aeryion")
    .table("soil_baselines")
    .select(
        "sub_county_id, ph_value, nitrogen_pct, organic_carbon_pct, phosphorous_ppm, clay_pct, texture_class"
    )
    .eq("data_source", "isdasoil")
    .execute()
)

print(f"\nRows in aeryion.soil_baselines: {len(verify.data)}")
print(
    f"{'sub_county_id':40} {'pH':>5} {'N%':>6} {'OC%':>6} {'P ppm':>7} {'clay%':>6} {'Texture':12}"
)
print("-" * 88)
for r in verify.data:
    print(
        f"{r['sub_county_id']:40} "
        f"{str(r.get('ph_value', '—')):>5} "
        f"{str(r.get('nitrogen_pct', '—')):>6} "
        f"{str(r.get('organic_carbon_pct', '—')):>6} "
        f"{str(r.get('phosphorous_ppm', '—')):>7} "
        f"{str(r.get('clay_pct', '—')):>6} "
        f"{r.get('texture_class', '—'):12}"
    )

print("\nDone.")
