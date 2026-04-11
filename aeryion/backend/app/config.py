from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "Aeryion API"
    DEBUG: bool = False

    CORS_ORIGINS: list[str] = [
        "http://localhost:3001",
    ]

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    GEE_SERVICE_ACCOUNT_EMAIL: str = ""
    GEE_PRIVATE_KEY_PATH: str = ""

    INFLUXDB_URL: str = ""
    INFLUXDB_TOKEN: str = ""
    INFLUXDB_ORG: str = ""
    INFLUXDB_BUCKET: str = "aeryion"

    UPSTASH_KAFKA_BOOTSTRAP: str = ""
    UPSTASH_KAFKA_USERNAME: str = ""
    UPSTASH_KAFKA_PASSWORD: str = ""

    UPSTASH_REDIS_URL: str = ""

    NASA_FIRMS_API_KEY: str = ""

    SENTRY_DSN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
