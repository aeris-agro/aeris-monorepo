# FILE: coltiva/backend/app/models/schemas.py
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# ─── Cooperative ──────────────────────────────────────────────────────────────
class CooperativeResponse(BaseModel):
    id: str
    name: str
    district: str
    contact_name: Optional[str]
    contact_phone: Optional[str]
    plan_tier: str
    plan_price_ugx: int
    farmer_quota: int
    is_active: bool


# ─── Farmer ───────────────────────────────────────────────────────────────────
class FarmerCreate(BaseModel):
    cooperative_id: str
    full_name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., min_length=10, max_length=20)
    gender: str = Field("U", pattern="^[MFU]$")
    village: Optional[str] = None
    sub_county_id: Optional[str] = None  # auto-resolved if omitted

    @field_validator("phone")
    @classmethod
    def normalise_phone(cls, v: str) -> str:
        v = v.strip().replace(" ", "").replace("-", "")
        if v.startswith("0"):
            v = "+256" + v[1:]
        elif not v.startswith("+"):
            v = "+" + v
        return v


class FarmerResponse(BaseModel):
    id: str
    cooperative_id: Optional[str]
    sub_county_id: Optional[str]
    full_name: str
    phone: str
    gender: str
    village: Optional[str]
    is_active: bool
    registered_at: datetime


# ─── Plot ─────────────────────────────────────────────────────────────────────
CROP_TYPES = {"maize", "sorghum", "cassava", "beans", "groundnut", "sunflower", "rice", "millet"}


class PlotCreate(BaseModel):
    farmer_id: str
    longitude: float = Field(..., ge=-180, le=180)
    latitude: float = Field(..., ge=-90, le=90)
    area_acres: Optional[float] = Field(None, gt=0, le=1000)
    crop_type: str
    planted_at: Optional[date] = None
    expected_harvest: Optional[date] = None
    notes: Optional[str] = None

    @field_validator("crop_type")
    @classmethod
    def validate_crop(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in CROP_TYPES:
            raise ValueError(f"crop_type must be one of: {sorted(CROP_TYPES)}")
        return v


class PlotResponse(BaseModel):
    id: str
    farmer_id: str
    sub_county_id: Optional[str]
    longitude: float
    latitude: float
    area_acres: Optional[float]
    crop_type: str
    planted_at: Optional[date]
    expected_harvest: Optional[date]
    notes: Optional[str]
    created_at: datetime


# ─── Advisory ─────────────────────────────────────────────────────────────────
class AdvisoryItem(BaseModel):
    category: str  # vegetation | rainfall | soil | pest | harvest
    severity: str  # info | warning | critical
    title: str
    body: str
    action: Optional[str] = None


class PlotAdvisoryResponse(BaseModel):
    plot_id: str
    farmer_id: str
    sub_county: str
    crop_type: str
    days_planted: Optional[int]
    ndvi_mean: Optional[float]
    soil_ph: Optional[float]
    forecast_7d_mm: Optional[float]
    advisories: list[AdvisoryItem]
    generated_at: datetime
