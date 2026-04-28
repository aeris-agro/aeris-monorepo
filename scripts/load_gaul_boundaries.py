"""
load_gaul_boundaries.py
=======================
Loads FAO GAUL 2015 level-2 polygon geometries for all sub-counties
in Lira, Alebtong, and Dokolo districts into the Supabase sub_counties table.

Usage:
    source aeris-venv/bin/activate
    python3 scripts/load_gaul_boundaries.py
"""

import ee
import json
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://ldajcrobrzskpzsupjeu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYWpjcm9icnpza3B6c3VwamV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk4Nzk4NCwiZXhwIjoyMDkwNTYzOTg0fQ.a8mHdSg5pozO4dfKOO_GEbCvHN9mXAmCme-wlsAknq4"
GEE_PROJECT  = "aeryion"

TARGET_DISTRICTS = ["Lira", "Alebtong", "Dokolo"]

# ── Init ──────────────────────────────────────────────────────────────────────
print("Initialising GEE...")
ee.Initialize(project=GEE_PROJECT)
print("GEE OK")

print("Connecting to Supabase...")
sb = create_client(SUPABASE_URL, SUPABASE_KEY)
print("Supabase OK")

# ── Step 1: Inspect FAO GAUL to confirm field names ───────────────────────────
print("\n── Step 1: Sampling FAO GAUL level-2 for Uganda ──")
gaul = ee.FeatureCollection("FAO/GAUL/2015/level2")

# Pull one feature from Uganda to confirm field names
sample = gaul.filter(ee.Filter.eq("ADM0_NAME", "Uganda")).limit(1)
info   = sample.getInfo()

if not info["features"]:
    print("ERROR: No Uganda features found. Check GEE auth and project.")
    exit(1)

props = info["features"][0]["properties"]
print("Sample feature properties:", json.dumps({k: props[k] for k in ["ADM0_NAME","ADM1_NAME","ADM2_NAME"] if k in props}, indent=2))

# ── Step 2: Pull all sub-counties for our 3 districts ────────────────────────
print(f"\n── Step 2: Fetching sub-counties for {TARGET_DISTRICTS} ──")

uganda = gaul.filter(ee.Filter.eq("ADM0_NAME", "Uganda"))

# Filter to our target districts
dist_filter = ee.Filter.Or(*[
    ee.Filter.eq("ADM1_NAME", d) for d in TARGET_DISTRICTS
])
target = uganda.filter(dist_filter)

count = target.size().getInfo()
print(f"Found {count} sub-counties across {TARGET_DISTRICTS}")

if count == 0:
    # Try alternative district name spellings
    print("Trying alternative spellings...")
    for alt in ["Lira District", "Alebtong District", "Dokolo District"]:
        test = uganda.filter(ee.Filter.stringContains("ADM1_NAME", alt.split()[0])).limit(3)
        t_info = test.getInfo()
        if t_info["features"]:
            print(f"  Found with ADM1_NAME containing '{alt.split()[0]}':")
            for f in t_info["features"]:
                print(f"    {f['properties'].get('ADM1_NAME')} / {f['properties'].get('ADM2_NAME')}")
    exit(1)

# ── Step 3: Export each feature and load into Supabase ───────────────────────
print("\n── Step 3: Loading geometries into Supabase ──")

features = target.getInfo()["features"]
loaded = 0
skipped = 0
errors = 0

for feat in features:
    props    = feat["properties"]
    geometry = feat["geometry"]

    district_name    = props.get("ADM1_NAME", "").strip()
    sub_county_name  = props.get("ADM2_NAME", "").strip()

    if not sub_county_name or not district_name:
        print(f"  SKIP: missing name fields — {props}")
        skipped += 1
        continue

    # Convert GEE geometry to WKT via coordinate extraction
    # GEE returns GeoJSON geometry — convert to WKT for PostGIS
    geom_type = geometry["type"]
    coords    = geometry["coordinates"]

    def ring_to_wkt(ring):
        return "(" + ", ".join(f"{pt[0]} {pt[1]}" for pt in ring) + ")"

    if geom_type == "Polygon":
        rings = ", ".join(ring_to_wkt(r) for r in coords)
        wkt   = f"MULTIPOLYGON(({rings}))"
    elif geom_type == "MultiPolygon":
        polys = []
        for poly in coords:
            rings = ", ".join(ring_to_wkt(r) for r in poly)
            polys.append(f"({rings})")
        wkt = f"MULTIPOLYGON({', '.join(polys)})"
    else:
        print(f"  SKIP {sub_county_name}: unsupported geometry type {geom_type}")
        skipped += 1
        continue

    # Calculate centroid for quick map display
    try:
        centroid = ee.Feature(feat).geometry().centroid(1).getInfo()
        lon = centroid["coordinates"][0]
        lat = centroid["coordinates"][1]
    except Exception:
        lon, lat = None, None

    print(f"  Loading: {district_name} / {sub_county_name} ({geom_type}) ...", end=" ")

    try:
        # Check if sub-county already exists in the table
        existing = sb.table("sub_counties") \
            .select("id") \
            .ilike("name", sub_county_name) \
            .ilike("district", district_name) \
            .execute()

        if existing.data:
            # Update geometry on existing row
            row_id = existing.data[0]["id"]
            update_data = {"geometry": wkt}
            if lon is not None:
                update_data["centroid_lon"] = lon
                update_data["centroid_lat"] = lat

            sb.table("sub_counties").update(update_data).eq("id", row_id).execute()
            print(f"UPDATED (id={row_id})")
        else:
            # Insert new row
            insert_data = {
                "name":     sub_county_name,
                "district": district_name,
                "geometry": wkt,
            }
            if lon is not None:
                insert_data["centroid_lon"] = lon
                insert_data["centroid_lat"] = lat

            sb.table("sub_counties").insert(insert_data).execute()
            print(f"INSERTED")

        loaded += 1

    except Exception as e:
        print(f"ERROR: {e}")
        errors += 1

# ── Step 4: Verify ────────────────────────────────────────────────────────────
print(f"\n── Step 4: Verification ──")
print(f"  Loaded:  {loaded}")
print(f"  Skipped: {skipped}")
print(f"  Errors:  {errors}")

verify = sb.table("sub_counties") \
    .select("id, name, district, geometry") \
    .in_("district", TARGET_DISTRICTS) \
    .execute()

print(f"\nRows in Supabase for target districts: {len(verify.data)}")
for row in verify.data:
    geom_preview = str(row.get("geometry", ""))[:40]
    empty = "EMPTY" if "EMPTY" in geom_preview or not geom_preview else "OK"
    print(f"  [{empty}] {row['district']:12} / {row['name']:25} {geom_preview}")

print("\nDone.")
