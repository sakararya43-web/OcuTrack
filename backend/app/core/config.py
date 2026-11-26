from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = (BACKEND_DIR / "ocutrack.db").as_posix()
DEFAULT_UPLOAD_DIR = str(BACKEND_DIR / "tmp" / "ocutrack")


class Settings(BaseSettings):
    APP_NAME: str = "OcuTrack Backend API"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    
    # CORS Origins
    FRONTEND_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    # Default to canonical backend SQLite database regardless of working directory
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Uploads & Retention
    MAX_UPLOAD_MB: int = 50
    MAX_VIDEO_SECONDS: int = 30
    TEMP_UPLOAD_DIR: str = DEFAULT_UPLOAD_DIR

    # Analysis / Model
    MODEL_CONFIG_PATH: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("FRONTEND_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


settings = Settings()
