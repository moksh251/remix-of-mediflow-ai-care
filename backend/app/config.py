from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "mediflow"

    JWT_SECRET: str = "dev-only-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 720

    AI_API_KEY: str = ""
    AI_BASE_URL: str = "https://ai.gateway.lovable.dev/v1"
    AI_MODEL: str = "google/gemini-3-flash"

    FRONTEND_URL: str = "http://localhost:5173,http://localhost:8080"
    DEMO_PASSWORD: str = "mediflow123"

    DISCLAIMER: str = (
        "Mediflow provides care-navigation assistance and does not provide a medical diagnosis."
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_URL.split(",") if o.strip()]

    @property
    def ai_enabled(self) -> bool:
        return bool(self.AI_API_KEY)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
