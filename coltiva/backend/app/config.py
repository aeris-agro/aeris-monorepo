from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "Coltiva API"
    DEBUG: bool = False

    CORS_ORIGINS: list[str] = ["*"]

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    UPSTASH_KAFKA_BOOTSTRAP: str = ""
    UPSTASH_KAFKA_USERNAME: str = ""
    UPSTASH_KAFKA_PASSWORD: str = ""

    UPSTASH_REDIS_URL: str = ""

    SMS_PROVIDER: str = "africastalking"
    AT_API_KEY: str = ""
    AT_USERNAME: str = ""
    AT_SHORTCODE: str = ""

    USSD_SERVICE_CODE: str = ""

    AERYION_API_URL: str = "http://localhost:8000"
    LINKTRADE_API_URL: str = "http://localhost:8002"

    SENTRY_DSN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
