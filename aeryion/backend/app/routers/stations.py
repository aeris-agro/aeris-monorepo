# FILE: app/routers/stations.py
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.db.supabase import aeryion

router = APIRouter()

class StationResponse(BaseModel):
    id:              str
    station_code:    str
    name:            str
    sub_county:      str
    status:          str
    last_reading_at: Optional[str]
    deployed_at:     Optional[str]
    hardware_model:  Optional[str]

class StationReading(BaseModel):
    reading_hour:      str
    temp_c_avg:        Optional[float]
    temp_c_min:        Optional[float]
    temp_c_max:        Optional[float]
    humidity_pct:      Optional[float]
    rainfall_mm:       Optional[float]
    soil_moisture_pct: Optional[float]
    battery_voltage:   Optional[float]

@router.get("", response_model=List[StationResponse])
def get_stations():
    """
    All IoT station statuses and last reading times.
    Returns empty list until hardware is deployed (Month 2).
    """
    res = (aeryion("iot_stations")
           .select("*, sub_counties(name)")
           .order("station_code")
           .execute())

    if not res.data:
        return []

    return [
        StationResponse(
            id              = str(row["id"]),
            station_code    = row["station_code"],
            name            = row["name"],
            sub_county      = row.get("sub_counties", {}).get("name", "Unknown")
                              if row.get("sub_counties") else "Unknown",
            status          = row.get("status", "active"),
            last_reading_at = str(row["last_reading_at"]) if row.get("last_reading_at") else None,
            deployed_at     = str(row["deployed_at"]) if row.get("deployed_at") else None,
            hardware_model  = row.get("hardware_model")
        )
        for row in res.data
    ]


@router.get("/{station_id}/readings", response_model=List[StationReading])
def get_station_readings(
    station_id: str,
    hours: int = Query(24, ge=1, le=168, description="Hours of history to return (max 168 = 7 days)")
):
    """Last N hours of hourly readings from one station."""
    # Verify station exists
    station = (aeryion("iot_stations")
               .select("id, name")
               .eq("id", station_id)
               .limit(1)
               .execute())

    if not station.data:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found")

    readings = (aeryion("station_readings_hourly")
                .select("*")
                .eq("station_id", station_id)
                .order("reading_hour", desc=True)
                .limit(hours)
                .execute())

    if not readings.data:
        return []

    return [
        StationReading(
            reading_hour      = str(row["reading_hour"]),
            temp_c_avg        = row.get("temp_c_avg"),
            temp_c_min        = row.get("temp_c_min"),
            temp_c_max        = row.get("temp_c_max"),
            humidity_pct      = row.get("humidity_pct"),
            rainfall_mm       = row.get("rainfall_mm"),
            soil_moisture_pct = row.get("soil_moisture_pct"),
            battery_voltage   = row.get("battery_voltage")
        )
        for row in readings.data
    ]
