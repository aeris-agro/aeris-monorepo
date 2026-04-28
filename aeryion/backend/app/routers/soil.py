# FILE: app/routers/soil.py
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.db.supabase import aeryion

router = APIRouter()


class SoilBaselineResponse(BaseModel):
    sub_county: str
    district: str
    ph_value: Optional[float]
    nitrogen_pct: Optional[float]
    phosphorous_ppm: Optional[float]
    organic_carbon_pct: Optional[float]
    clay_pct: Optional[float]
    texture_class: Optional[str]
    soil_health: str
    observed_date: str
    data_source: str

    class Config:
        from_attributes = True


def soil_health_score(
    ph: Optional[float],
    nitrogen_pct: Optional[float],
    organic_carbon: Optional[float],
) -> str:
    score = 0
    if ph and 5.5 <= ph <= 7.0:
        score += 1
    if nitrogen_pct and nitrogen_pct > 0.15:
        score += 1
    if organic_carbon and organic_carbon > 0.2:
        score += 1
    return ["POOR", "MODERATE", "GOOD", "EXCELLENT"][score]


@router.get("/latest", response_model=List[SoilBaselineResponse])
def get_soil_latest(
    district: Optional[str] = Query(None, description="Filter by district name"),
    sub_county: Optional[str] = Query(None, description="Filter by sub-county name"),
):
    """
    Latest iSDAsoil baseline readings per sub-county.
    Joins soil_baselines → sub_counties → districts.
    """
    # Get all sub-counties with district names (same pattern as ndvi.py)
    sc_res = aeryion("sub_counties").select("id, name, districts(name)").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    # Build sub-county lookup, applying optional filters
    sc_map = {}
    for sc in sc_res.data:
        dist_name = (sc.get("districts") or {}).get("name", "")
        sc_name = sc["name"]
        if district and dist_name.lower() != district.lower():
            continue
        if sub_county and sub_county.lower() not in sc_name.lower():
            continue
        sc_map[sc["id"]] = {"sc_name": sc_name, "district": dist_name}

    if not sc_map:
        raise HTTPException(status_code=404, detail="No matching sub-counties found")

    results = []
    for sc_id, meta in sc_map.items():
        soil = (
            aeryion("soil_baselines")
            .select(
                "ph_value, nitrogen_pct, phosphorous_ppm, organic_carbon_pct, "
                "clay_pct, texture_class, data_source, observed_date"
            )
            .eq("sub_county_id", sc_id)
            .eq("data_source", "isdasoil")
            .order("observed_date", desc=True)
            .limit(1)
            .execute()
        )

        if not soil.data:
            # Return nulls for sub-counties without soil data yet
            results.append(
                SoilBaselineResponse(
                    sub_county=meta["sc_name"],
                    district=meta["district"],
                    ph_value=None,
                    nitrogen_pct=None,
                    phosphorous_ppm=None,
                    organic_carbon_pct=None,
                    clay_pct=None,
                    texture_class=None,
                    soil_health="NO_DATA",
                    observed_date="",
                    data_source="isdasoil",
                )
            )
            continue

        row = soil.data[0]
        results.append(
            SoilBaselineResponse(
                sub_county=meta["sc_name"],
                district=meta["district"],
                ph_value=row.get("ph_value"),
                nitrogen_pct=row.get("nitrogen_pct"),
                phosphorous_ppm=row.get("phosphorous_ppm"),
                organic_carbon_pct=row.get("organic_carbon_pct"),
                clay_pct=row.get("clay_pct"),
                texture_class=row.get("texture_class"),
                soil_health=soil_health_score(
                    row.get("ph_value"),
                    row.get("nitrogen_pct"),
                    row.get("organic_carbon_pct"),
                ),
                observed_date=str(row.get("observed_date", "")),
                data_source=row.get("data_source", "isdasoil"),
            )
        )

    return results


@router.get("/map")
def get_soil_map():
    """GeoJSON FeatureCollection of soil health zones for map choropleth."""
    sc_res = (
        aeryion("sub_counties").select("id, name, districts(name), geometry").execute()
    )
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    # Fetch all soil baselines in one query
    soil_res = (
        aeryion("soil_baselines")
        .select(
            "sub_county_id, ph_value, nitrogen_pct, organic_carbon_pct, texture_class"
        )
        .eq("data_source", "isdasoil")
        .execute()
    )
    soil_map = {row["sub_county_id"]: row for row in (soil_res.data or [])}

    features = []
    for sc in sc_res.data:
        dist_name = (sc.get("districts") or {}).get("name", "")
        soil = soil_map.get(sc["id"], {})
        props = {
            "sub_county": sc["name"],
            "district": dist_name,
            "ph_value": soil.get("ph_value"),
            "nitrogen_pct": soil.get("nitrogen_pct"),
            "organic_carbon_pct": soil.get("organic_carbon_pct"),
            "texture_class": soil.get("texture_class"),
            "soil_health": soil_health_score(
                soil.get("ph_value"),
                soil.get("nitrogen_pct"),
                soil.get("organic_carbon_pct"),
            )
            if soil
            else "NO_DATA",
        }
        features.append(
            {
                "type": "Feature",
                "geometry": sc.get("geometry"),
                "properties": props,
            }
        )

    return {"type": "FeatureCollection", "features": features}
