# FILE: app/routers/soil.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from app.db.supabase import aeryion

router = APIRouter()

class SoilBaselineResponse(BaseModel):
    sub_county:         str
    ph_value:           Optional[float]
    nitrogen_pct:       Optional[float]
    phosphorous_ppm:    Optional[float]
    organic_carbon_pct: Optional[float]
    clay_pct:           Optional[float]
    texture_class:      Optional[str]
    data_source:        str

    class Config:
        from_attributes = True

def soil_health_score(ph: float, nitrogen: float, organic_carbon: float) -> str:
    """Simple composite score for dashboard colour coding."""
    score = 0
    if ph and 5.5 <= ph <= 7.0:   score += 1
    if nitrogen and nitrogen > 0.2: score += 1
    if organic_carbon and organic_carbon > 1.5: score += 1
    return ["POOR", "MODERATE", "GOOD", "EXCELLENT"][score]

@router.get("/baseline", response_model=List[SoilBaselineResponse])
def get_soil_baseline(
    sub_county: Optional[str] = Query(None, description="Filter by sub-county name")
):
    """
    Soil baseline properties per sub-county from iSDAsoil.
    Averaged across all 30m grid cells within each sub-county.
    """
    sc_res = aeryion("sub_counties").select("id, name").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    results = []
    for sc in sc_res.data:
        if sub_county and sc["name"].lower() != sub_county.lower():
            continue

        soil = (aeryion("soil_baselines")
                .select("ph_value, nitrogen_pct, phosphorous_ppm, organic_carbon_pct, clay_pct, texture_class, data_source")
                .eq("sub_county_id", sc["id"])
                .limit(1)
                .execute())

        if not soil.data:
            # Return nulls if iSDAsoil not yet loaded for this sub-county
            results.append(SoilBaselineResponse(
                sub_county         = sc["name"],
                ph_value           = None,
                nitrogen_pct       = None,
                phosphorous_ppm    = None,
                organic_carbon_pct = None,
                clay_pct           = None,
                texture_class      = None,
                data_source        = "isdasoil"
            ))
            continue

        row = soil.data[0]
        results.append(SoilBaselineResponse(
            sub_county         = sc["name"],
            ph_value           = row.get("ph_value"),
            nitrogen_pct       = row.get("nitrogen_pct"),
            phosphorous_ppm    = row.get("phosphorous_ppm"),
            organic_carbon_pct = row.get("organic_carbon_pct"),
            clay_pct           = row.get("clay_pct"),
            texture_class      = row.get("texture_class"),
            data_source        = row.get("data_source", "isdasoil")
        ))

    if not results:
        raise HTTPException(status_code=404, detail=f"Sub-county '{sub_county}' not found")

    return results


@router.get("/map")
def get_soil_map():
    """
    GeoJSON FeatureCollection of soil health zones for Mapbox choropleth layer.
    Returns averaged soil properties per sub-county with geometry.
    """
    sc_res = aeryion("sub_counties").select("id, name, geometry").execute()
    if not sc_res.data:
        raise HTTPException(status_code=404, detail="No sub-counties found")

    features = []
    for sc in sc_res.data:
        soil = (aeryion("soil_baselines")
                .select("ph_value, nitrogen_pct, organic_carbon_pct, texture_class")
                .eq("sub_county_id", sc["id"])
                .limit(1)
                .execute())

        props = {
            "sub_county":  sc["name"],
            "ph_value":    None,
            "nitrogen_pct": None,
            "organic_carbon_pct": None,
            "texture_class": None,
            "soil_health": "NO_DATA"
        }

        if soil.data:
            row = soil.data[0]
            props.update({
                "ph_value":           row.get("ph_value"),
                "nitrogen_pct":       row.get("nitrogen_pct"),
                "organic_carbon_pct": row.get("organic_carbon_pct"),
                "texture_class":      row.get("texture_class"),
                "soil_health":        soil_health_score(
                    row.get("ph_value", 0),
                    row.get("nitrogen_pct", 0),
                    row.get("organic_carbon_pct", 0)
                )
            })

        features.append({
            "type":       "Feature",
            "geometry":   sc.get("geometry"),
            "properties": props
        })

    return {"type": "FeatureCollection", "features": features}