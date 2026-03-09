from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/motomec"
    SECRET_KEY: str = "secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    GOOGLE_SHEETS_ID: str = ""
    GOOGLE_CREDENTIALS_PATH: str = "config/credentials.json"

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    FIPE_API_URL: str = "https://parallelum.com.br/fipe/api/v1"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
