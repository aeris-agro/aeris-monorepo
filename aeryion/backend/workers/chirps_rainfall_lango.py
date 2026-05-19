# run this weekly

import ee
from datetime import datetime

ee.Initialize(project="aeryion")

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
        ee.Filter.inList("adm2_name", LANGO_DISTRICTS),
    )
)

# Verify before running any export
matched = sorted(lango.aggregate_array("adm2_name").getInfo())
print(f"Districts matched: {matched}")
assert matched == sorted(
    LANGO_DISTRICTS
), f"ABORT: Expected {sorted(LANGO_DISTRICTS)}, got {matched}"
print("Geometry verified. Proceeding with pipeline.\n")

lango_geom = lango.geometry()

# current season rainfall (last 90 days)
end = ee.Date(datetime.now().strftime("%Y-%m-%d"))
start = end.advance(-90, "day")

chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
current_rain = chirps.filterDate(start, end).sum().clip(lango_geom)


# 10-year historicak average for the same calendar window
def historical_season(year):
    yr_end = ee.Date(f"{year}-" + datetime.now().strftime("%m-%d"))
    yr_start = yr_end.advance(-90, "day")
    return chirps.filterDate(yr_start, yr_end).sum()


hist_avg = (
    ee.ImageCollection([historical_season(y) for y in range(2013, 2024)])
    .mean()
    .clip(lango_geom)
)

# rainfall anomaly; positive = wetter, negative = drought
anomaly = (
    current_rain.subtract(hist_avg).divide(hist_avg).multiply(100).rename("anomaly_pct")
)

# flag drought if anomaly < -30% in any district
# this triggers WEATHER_ALERT via Kafka

# export results
combined = current_rain.rename("current_mm").addBands(anomaly)
stats = combined.reduceRegions(
    collection=lango,
    reducer=ee.Reducer.mean(),
    scale=5000,  # CHIRPS is 5km - no need to go finer
)
task = ee.batch.Export.table.toCloudStorage(
    collection=stats,
    description="lango_rainfall_" + datetime.now().strftime("%Y%m%d"),
    bucket="aeris-satellite-data",
    fileNamePrefix="rainfall/lango_" + datetime.now().strftime("%Y%m%d"),
    fileFormat="GeoJSON",
)
task.start()
print(f"Task started: {task.id}")
print("Monitor at: https://code.earthegine.google.com/tasks")
