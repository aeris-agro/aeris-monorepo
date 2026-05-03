# FILE: coltiva/backend/app/db/supabase.py
from functools import lru_cache
from supabase import Client, create_client
from app.config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def coltiva(table: str):
    """Shorthand — always targets the coltiva schema."""
    return get_supabase().schema("coltiva").table(table)


def aeryion(table: str):
    """Shorthand — read-only access to aeryion schema (sub_counties, NDVI, etc)."""
    return get_supabase().schema("aeryion").table(table)


def resolve_sub_county(longitude: float, latitude: float) -> str | None:
    """
    Resolve a GPS point to the sub_county_id whose polygon contains it.
    Falls back to nearest centroid via the coltiva.resolve_sub_county() RPC.
    """
    try:
        result = (
            get_supabase()
            .schema("aeryion")
            .rpc("resolve_sub_county", {"plot_lng": longitude, "plot_lat": latitude})
            .execute()
        )
        return result.data if result.data else None
    except Exception:
        return None

def shared(table: str):
    """Shorthand — targets the shared schema (sub_counties, districts)."""
    return get_supabase().schema("shared").table(table)
