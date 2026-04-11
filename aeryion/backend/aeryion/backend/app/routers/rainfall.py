# FILE: app/routers/rainfall.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import RainfallResponse
from app.db.supabase import aeryion

router = APIRouter()

@router.get("/current", response_model=List[RainfallResponse])
def get_rainfall_current(district: Optional[str] = Query(None)):
    """
    Latest 90-day rainfall reading per sub-county.
    Optionally filter by district name e.g. ?district=Alebtong
    """
    sc_res = aeryion("sub_counties").select("id, name, districts(name)").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

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
        obs = (aeryion("rainfall_observations")
               .select("*")
               .eq("sub_county_id", sc_id)
               .eq("period_days", 90)
               .order("observation_date", desc=True)
               .limit(1)
               .execute())

        if not obs.data:
            continue

        row = obs.data[0]
        results.append(RainfallResponse(
            sub_county       = meta["sc_name"],
            observation_date = row["observation_date"],
            period_days      = row["period_days"],
            rainfall_mm      = row["rainfall_mm"],
            anomaly_pct      = row.get("anomaly_pct"),
            drought_flag     = row.get("drought_flag", False),
            flood_flag       = row.get("flood_flag", False)
        ))

    return results
