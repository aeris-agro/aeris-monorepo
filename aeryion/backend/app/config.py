# FILE: app/config.py
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    GCS_BUCKET_NAME: str
    SENTRY_DSN: str = ""  # optional until Sentry project created
    JWT_SECRET: str = "dev-secret-change-in-production"
    NASA_FIRMS_MAP_KEY: str = ""

    model_config = {"env_file": str(Path(__file__).resolve().parent.parent / ".env")}


settings = Settings()  # type: ignore[call-arg]
