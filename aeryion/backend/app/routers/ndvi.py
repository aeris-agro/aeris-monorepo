# FILE: app/routers/ndvi.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import NDVIResponse
from app.db.supabase import aeryion

router = APIRouter()

def vegetation_status(ndvi: float) -> str:
    if ndvi >= 0.3:
        return "HEALTHY"
    elif ndvi >= 0.1:
        return "STRESSED"
    return "CRITICAL"

@router.get("/latest", response_model=List[NDVIResponse])
def get_ndvi_latest(district: Optional[str] = Query(None)):
    """
    Latest NDVI reading per sub-county.
    Optionally filter by district name e.g. ?district=Lira
    """
    # Get all sub-counties with their district names
    sc_res = aeryion("sub_counties").select("id, name, districts(name)").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    # Build lookup: sub_county_id -> {sc_name, district_name}
    sc_map = {}
    for sc in sc_res.data:
        dist_name = sc.get("districts", {}).get("name", "") if sc.get("districts") else ""
        if district and dist_name.lower() != district.lower():
            continue
        sc_map[sc["id"]] = {"sc_name": sc["name"], "district": dist_name}

    if not sc_map:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found")

    results = []
    for sc_id, meta in sc_map.items():
        obs = (aeryion("ndvi_observations")
               .select("*")
               .eq("sub_county_id", sc_id)
               .order("observed_date", desc=True)
               .limit(1)
               .execute())

        if not obs.data:
            continue

        row = obs.data[0]
        results.append(NDVIResponse(
            sub_county        = meta["sc_name"],
            observed_date     = row["observed_date"],
            ndvi_mean         = row["ndvi_mean"],
            ndvi_min          = row.get("ndvi_min"),
            ndvi_max          = row.get("ndvi_max"),
            red_edge_mean     = row.get("red_edge_mean"),
            vegetation_status = vegetation_status(row["ndvi_mean"]),
            data_source       = row.get("data_source", "sentinel2")
        ))

    return results


@router.get("/history", response_model=List[NDVIResponse])
def get_ndvi_history(
    sub_county_name: str = Query(..., description="Sub-county name e.g. Lira"),
    days: int = Query(90, ge=7, le=365)
):
    """NDVI time series for the last N days for a given sub-county."""
    sc_res = (aeryion("sub_counties")
              .select("id, name")
              .ilike("name", sub_county_name)
              .limit(1)
              .execute())

    if not sc_res.data:
        raise HTTPException(status_code=404, detail=f"Sub-county '{sub_county_name}' not found")

    sc_id   = sc_res.data[0]["id"]
    sc_name = sc_res.data[0]["name"]

    obs = (aeryion("ndvi_observations")
           .select("*")
           .eq("sub_county_id", sc_id)
           .order("observed_date", desc=True)
           .limit(days // 5 + 1)   # NDVI updates every ~5 days
           .execute())

    return [
        NDVIResponse(
            sub_county        = sc_name,
            observed_date     = row["observed_date"],
            ndvi_mean         = row["ndvi_mean"],
            ndvi_min          = row.get("ndvi_min"),
            ndvi_max          = row.get("ndvi_max"),
            red_edge_mean     = row.get("red_edge_mean"),
            vegetation_status = vegetation_status(row["ndvi_mean"]),
            data_source       = row.get("data_source", "sentinel2")
        )
        for row in obs.data
    ]
