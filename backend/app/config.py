from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://user:password@localhost:5432/motomec17gb",
        description="PostgreSQL connection URL",
    )

    # Google Sheets
    GOOGLE_SHEETS_ID: str = Field(
        default="1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q",
        description="Google Sheets document ID",
    )
    GOOGLE_CREDENTIALS_PATH: str = Field(
        default="config/credentials.json",
        description="Path to Google service account credentials JSON",
    )

    # Telegram
    TELEGRAM_BOT_TOKEN: str = Field(default="", description="Telegram bot token")
    TELEGRAM_CHAT_ID: str = Field(default="", description="Telegram chat/channel ID")

    # FIPE API
    FIPE_API_URL: str = Field(
        default="https://parallelum.com.br/fipe/api/v1",
        description="FIPE API base URL",
    )

    # JWT / Auth
    SECRET_KEY: str = Field(
        default="changeme_use_openssl_rand_hex_32",
        description="JWT signing secret key",
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, description="JWT access token expiry in minutes"
    )

    # Alert scheduling
    ALERT_CHECK_INTERVAL: int = Field(
        default=1, description="Alert check interval in hours"
    )

    # App
    DEBUG: bool = Field(default=True, description="Debug mode flag")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
