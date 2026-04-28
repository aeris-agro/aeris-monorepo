"""
load_ocha_boundaries.py
=======================
Loads OCHA COD-AB ADM2 polygons (Lira, Alebtong, Dokolo) into the
aeryion.sub_counties table — using the exact same FeatureCollection
that workers/sentinel2_ndvi_lango.py and chirps_rainfall_lango.py
already use for satellite exports.

This guarantees the geometries here match the geometries that
Sentinel-2 and CHIRPS data was reduced over — so NDVI/rainfall
joins on sub_county.name will be consistent.
"""

import os
import json
from dotenv import load_dotenv
load_dotenv()

import ee
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GEE_PROJECT  = "aeryion"

LANGO_DISTRICTS = ["Lira", "Alebtong", "Dokolo"]

# ── Init ──────────────────────────────────────────────────────────────────────
print("Initialising GEE...")
ee.Initialize(project=GEE_PROJECT)
print("GEE OK")

print("Connecting to Supabase...")
sb = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Supabase OK\n")

# ── Step 1: Fetch from same OCHA source the workers use ──────────────────────
print("── Step 1: Fetching OCHA COD-AB ADM2 polygons ──")
OCHA_ADM2 = ee.FeatureCollection(
    "projects/sat-io/open-datasets/field-maps/edge-matched-humanitarian/adm2_polygons"
)

lango = OCHA_ADM2.filter(
    ee.Filter.And(
        ee.Filter.eq("adm0_name", "Uganda"),
        ee.Filter.inList("adm2_name", LANGO_DISTRICTS),
    )
)

# Sanity check (mirrors the assertion in the workers)
matched = sorted(lango.aggregate_array("adm2_name").getInfo())
print(f"  Districts matched: {matched}")
assert matched == sorted(LANGO_DISTRICTS), \
    f"ABORT: Expected {sorted(LANGO_DISTRICTS)}, got {matched}"
print("  Geometry verified.\n")

# ── Step 2: Load existing DB rows ─────────────────────────────────────────────
print("── Step 2: Loading aeryion.sub_counties rows ──")
existing = sb.schema("aeryion").table("sub_counties").select("id, name").execute()
db_rows = {row["name"]: row["id"] for row in existing.data}
print(f"  Found {len(db_rows)} rows: {list(db_rows.keys())}\n")

# ── Step 3: Update each row's geometry + centroid ────────────────────────────
print("── Step 3: Writing geometries via aeryion.set_sub_county_geometry RPC ──")

features = lango.getInfo()["features"]
loaded = errors = 0

for feat in features:
    props    = feat["properties"]
    geometry = feat["geometry"]
    district = props["adm2_name"]   # lowercase per OCHA dataset

    print(f"  {district:12} ...", end=" ", flush=True)

    if district not in db_rows:
        print(f"SKIP (no DB row named '{district}')")
        continue
    row_id = db_rows[district]

    try:
        # Compute centroid via GEE (same as workers do for clipping)
        ee_geom = ee.Geometry(geometry)
        centroid_geom = ee_geom.centroid(1).getInfo()
        cent_lon = centroid_geom["coordinates"][0]
        cent_lat = centroid_geom["coordinates"][1]

        # Update centroid columns
        sb.schema("aeryion").table("sub_counties") \
            .update({
                "centroid_lon": cent_lon,
                "centroid_lat": cent_lat,
            }) \
            .eq("id", row_id) \
            .execute()

        # Set MultiPolygon geometry via the helper RPC
        geojson_str = json.dumps(geometry)
        sb.schema("aeryion").rpc(
            "set_sub_county_geometry",
            {"p_id": row_id, "p_geojson": geojson_str},
        ).execute()

        print(f"OK  centroid=({cent_lon:.3f}, {cent_lat:.3f})")
        loaded += 1

    except Exception as e:
        print(f"ERROR: {str(e)[:120]}")
        errors += 1

# ── Step 4: Verify by calling resolve_sub_county RPC ──────────────────────────
print(f"\n── Step 4: Verification ──")
print(f"  Loaded: {loaded}  Errors: {errors}")

# Test the RPC for known points in each district
test_points = [
    ("Lira",     32.91, 2.25),
    ("Dokolo",   33.17, 1.91),
    ("Alebtong", 33.22, 2.25),
]

print("\nRPC resolution test:")
for label, lng, lat in test_points:
    r = sb.schema("aeryion").rpc(
        "resolve_sub_county",
        {"plot_lng": lng, "plot_lat": lat},
    ).execute()
    if r.data:
        # Look up name
        nm = sb.schema("aeryion").table("sub_counties").select("name").eq("id", r.data).execute()
        name = nm.data[0]["name"] if nm.data else "?"
        print(f"  {label:12} ({lng}, {lat}) → {name}  [{r.data[:8]}...]")
    else:
        print(f"  {label:12} ({lng}, {lat}) → None")

print("\nDone.")
