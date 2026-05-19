# FILE: app/models/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import date


class NDVIResponse(BaseModel):
    sub_county: str
    observed_date: date
    ndvi_mean: float
    ndvi_min: Optional[float]
    ndvi_max: Optional[float]
    red_edge_mean: Optional[float]
    vegetation_status: str  # HEALTHY / STRESSED / CRITICAL
    data_source: str


class RainfallResponse(BaseModel):
    sub_county: str
    observation_date: date
    period_days: int
    rainfall_mm: float
    anomaly_pct: Optional[float]
    drought_flag: bool
    flood_flag: bool


class HealthResponse(BaseModel):
    status: str
    version: str
