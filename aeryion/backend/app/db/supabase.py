# FILE: app/db/supabase.py
from supabase import create_client, Client
from app.config import settings

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client

def aeryion(table: str):
    """Shorthand — always targets the aeryion schema."""
    return get_supabase().schema("aeryion").table(table)

def shared(table: str):
    """Shorthand — targets the shared schema (sub_counties, districts, event_outbox)."""
    return get_supabase().schema("shared").table(table)
