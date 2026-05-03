"""
load_gaul_boundaries_v2.py
==========================
Reloads FAO GAUL 2015 level-2 polygon geometries for sub-counties
in the aeryion schema using ST_GeomFromGeoJSON via Postgres RPC.

Fixes the empty-geometry bug from v1 where WKT conversion produced
MULTIPOLYGON EMPTY values.
"""

import json
import os

from dotenv import load_dotenv

load_dotenv()

import ee
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
GEE_PROJECT = "aeryion"

TARGET_DISTRICTS = ["Lira", "Alebtong", "Dokolo"]

# ── Init ──────────────────────────────────────────────────────────────────────
print("Initialising GEE...")
ee.Initialize(project=GEE_PROJECT)
print("GEE OK")

print("Connecting to Supabase...")
sb = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Supabase OK\n")

# ── Step 1: Fetch FAO GAUL features ──────────────────────────────────────────
print(f"── Step 1: Fetching FAO GAUL features for {TARGET_DISTRICTS} ──")
gaul = ee.FeatureCollection("FAO/GAUL/2015/level2")
uganda = gaul.filter(ee.Filter.eq("ADM0_NAME", "Uganda"))
target = uganda.filter(
    ee.Filter.Or(*[ee.Filter.eq("ADM1_NAME", d) for d in TARGET_DISTRICTS])
)

features = target.getInfo()["features"]
print(f"Found {len(features)} sub-counties\n")

# ── Step 2: Update each row using ST_GeomFromGeoJSON ─────────────────────────
print("── Step 2: Updating geometries via raw GeoJSON ──")

loaded = errors = 0

for feat in features:
    props = feat["properties"]
    geometry = feat["geometry"]

    district_name = props.get("ADM1_NAME", "").strip()
    sub_county_name = props.get("ADM2_NAME", "").strip()

    print(f"  {district_name:12} / {sub_county_name:25} ...", end=" ", flush=True)

    try:
        # Find the existing row
        existing = (
            sb.schema("aeryion")
            .table("sub_counties")
            .select("id")
            .ilike("name", sub_county_name)
            .execute()
        )

        if not existing.data:
            print("SKIP (no matching row in DB)")
            continue

        row_id = existing.data[0]["id"]

        # Compute centroid via GEE (since PostGIS conversion is what's failing)
        ee_geom = ee.Geometry(geometry)
        centroid = ee_geom.centroid(1).getInfo()
        cent_lon = centroid["coordinates"][0]
        cent_lat = centroid["coordinates"][1]

        # Update centroid first (always works)
        sb.schema("shared").table("sub_counties").update(
            {
                "centroid_lon": cent_lon,
                "centroid_lat": cent_lat,
            }
        ).eq("id", row_id).execute()

        # Now update geometry via RPC that calls ST_GeomFromGeoJSON
        # We'll create this RPC in SQL
        geojson_str = json.dumps(geometry)

        result = (
            sb.schema("aeryion")
            .rpc(
                "set_sub_county_geometry",
                {
                    "p_id": row_id,
                    "p_geojson": geojson_str,
                },
            )
            .execute()
        )

        print(f"OK  centroid=({cent_lon:.3f}, {cent_lat:.3f})")
        loaded += 1

    except Exception as e:
        print(f"ERROR: {str(e)[:80]}")
        errors += 1

# ── Step 3: Verify ────────────────────────────────────────────────────────────
print("\n── Step 3: Verification ──")
print(f"  Loaded: {loaded}  Errors: {errors}")

verify = (
    sb.schema("aeryion")
    .table("sub_counties")
    .select("id, name, district, centroid_lon, centroid_lat")
    .execute()
)

print("\nRows in aeryion.sub_counties:")
for row in verify.data:
    cent = f"({row.get('centroid_lon')}, {row.get('centroid_lat')})"
    print(f"  {row['name']:25} centroid={cent}")

print("\nDone.")
