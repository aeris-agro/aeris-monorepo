from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "LinkTrade API"
    DEBUG: bool = False

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    MOMO_COLLECTIONS_PRIMARY_KEY: str = ""
    MOMO_COLLECTIONS_API_USER: str = ""
    MOMO_COLLECTIONS_API_KEY: str = ""
    MOMO_DISBURSEMENTS_PRIMARY_KEY: str = ""
    MOMO_DISBURSEMENTS_API_USER: str = ""
    MOMO_DISBURSEMENTS_API_KEY: str = ""
    MOMO_ENVIRONMENT: str = "sandbox"
    MOMO_BASE_URL: str = "https://sandbox.momodeveloper.mtn.com"

    AIRTEL_API_KEY: str = ""
    AIRTEL_API_SECRET: str = ""
    AIRTEL_ENVIRONMENT: str = "sandbox"

    UPSTASH_KAFKA_BOOTSTRAP: str = ""
    UPSTASH_KAFKA_USERNAME: str = ""
    UPSTASH_KAFKA_PASSWORD: str = ""

    UPSTASH_REDIS_URL: str = ""

    AERYION_API_URL: str = "http://localhost:8000"
    COLTIVA_API_URL: str = "http://localhost:8001"

    WFP_VAM_API_KEY: str = ""
    SENTRY_DSN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
