from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.db.supabase import coltiva
from app.models.schemas import FarmerCreate, FarmerResponse, CooperativeResponse

router = APIRouter()


# ─── Cooperatives ─────────────────────────────────────────────────────────────
@router.get("/cooperatives", response_model=list[CooperativeResponse])
def list_cooperatives():
    """List all active cooperatives (Coltiva customers)."""
    res = coltiva("cooperatives").select("*").eq("is_active", True).order("name").execute()
    return res.data or []


# ─── Farmers ──────────────────────────────────────────────────────────────────
@router.post("/farmers", response_model=FarmerResponse, status_code=201)
def register_farmer(farmer: FarmerCreate):
    """
    Register a new farmer under a cooperative.
    Phone is normalised to +256 format and must be unique.
    """
    # Verify cooperative exists and quota not exceeded
    coop = (
        coltiva("cooperatives")
        .select("id, name, farmer_quota, is_active")
        .eq("id", farmer.cooperative_id)
        .single()
        .execute()
    )
    if not coop.data:
        raise HTTPException(status_code=404, detail="Cooperative not found")
    if not coop.data["is_active"]:
        raise HTTPException(status_code=403, detail="Cooperative is inactive")

    current = coltiva("farmers").select("id", count="exact").eq("cooperative_id", farmer.cooperative_id).execute()
    if (current.count or 0) >= coop.data["farmer_quota"]:
        raise HTTPException(
            status_code=403,
            detail=f"Cooperative {coop.data['name']} has reached its farmer quota of {coop.data['farmer_quota']}",
        )

    # Check phone uniqueness
    dup = coltiva("farmers").select("id").eq("phone", farmer.phone).execute()
    if dup.data:
        raise HTTPException(status_code=409, detail=f"Phone {farmer.phone} is already registered")

    record = farmer.model_dump(exclude_none=True)
    res = coltiva("farmers").insert(record).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to register farmer")

    return res.data[0]


@router.get("/farmers", response_model=list[FarmerResponse])
def list_farmers(
    cooperative_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
):
    """List farmers, optionally filtered by cooperative."""
    q = coltiva("farmers").select("*").eq("is_active", True).order("registered_at", desc=True).limit(limit)
    if cooperative_id:
        q = q.eq("cooperative_id", cooperative_id)
    res = q.execute()
    return res.data or []


@router.get("/farmers/{farmer_id}", response_model=FarmerResponse)
def get_farmer(farmer_id: str):
    """Get a single farmer by id."""
    res = coltiva("farmers").select("*").eq("id", farmer_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return res.data


@router.get("/farmers/by-phone/{phone}", response_model=FarmerResponse)
def get_farmer_by_phone(phone: str):
    """Look up a farmer by phone number (used by USSD/SMS handlers)."""
    # Normalise like FarmerCreate does
    p = phone.strip().replace(" ", "").replace("-", "")
    if p.startswith("0"):
        p = "+256" + p[1:]
    elif not p.startswith("+"):
        p = "+" + p

    res = coltiva("farmers").select("*").eq("phone", p).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail=f"No farmer registered with phone {p}")
    return res.data[0]
