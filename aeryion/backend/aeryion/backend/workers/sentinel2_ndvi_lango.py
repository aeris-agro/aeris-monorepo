import ee
from datetime import datetime

ee.Initialize(project='aeryion')

# ============================================================
# GEOMETRY — OCHA COD-AB via FieldMaps (135 Uganda districts)
# Source: OCHA Common Operational Datasets, UBOS-verified
# Replaces FAO GAUL 2015 which absorbed Alebtong into Dokolo
# Field: adm2_name (lowercase) — exact strings confirmed
# ============================================================

OCHA_ADM2 = ee.FeatureCollection(
    "projects/sat-io/open-datasets/field-maps/edge-matched-humanitarian/adm2_polygons"
)

LANGO_DISTRICTS = ["Lira", "Alebtong", "Dokolo"]

lango = OCHA_ADM2.filter(
    ee.Filter.And(
        ee.Filter.eq("adm0_name", "Uganda"),
        ee.Filter.inList("adm2_name", LANGO_DISTRICTS)
    )
)

# Verify before running any export
matched = sorted(lango.aggregate_array("adm2_name").getInfo())
print(f"Districts matched: {matched}")
assert matched == sorted(LANGO_DISTRICTS), f"ABORT: Expected {sorted(LANGO_DISTRICTS)}, got {matched}"
print("Geometry verified. Proceeding with pipeline.\n")

lango_geom = lango.geometry()

# ============================================================
# SENTINEL-2 NDVI PIPELINE — unchanged from here down
# ============================================================

end   = ee.Date(datetime.now().strftime("%Y-%m-%d"))
start = end.advance(-30, "day")

s2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
      .filterBounds(lango_geom)
      .filterDate(start, end)
      .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
      .median()
      .clip(lango_geom))

# NDVI = (NIR - Red) / (NIR + Red)
# Band 8 = NIR (842nm), Band 4 = Red (665nm)
ndvi = s2.normalizedDifference(["B8", "B4"]).rename("NDVI")
# NDVI guide: < 0.1 = bare/dying, 0.1-0.3 = stressed (ALERT), > 0.3 = healthy

# Red Edge stress — early warning before NDVI drops
# Band 8A = Red Edge NIR (865nm), Band 5 = Red Edge (705nm)
red_edge = s2.normalizedDifference(["B8A", "B5"]).rename("RedEdge")

# Statistics per district — using adm2_name as the district label
stats = ndvi.addBands(red_edge).reduceRegions(
    collection=lango,
    reducer=ee.Reducer.mean().combine(
        ee.Reducer.minMax(), sharedInputs=True),
    scale=10
)

# Export to GCS
task = ee.batch.Export.table.toCloudStorage(
    collection=stats,
    description="lango_ndvi_" + datetime.now().strftime("%Y%m%d"),
    bucket="aeris-satellite-data",
    fileNamePrefix="ndvi/lango_ndvi_" + datetime.now().strftime("%Y%m%d"),
    fileFormat="GeoJSON"
)
task.start()
print(f"Task started: {task.id}")
print("Check: https://code.earthengine.google.com/tasks")