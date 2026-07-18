"""
Centralized application configuration.

Reads from environment variables (and a local .env file, if present) so that
secrets like the Gemini API key are never hard-coded.
"""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    google_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    database_url: str = f"sqlite:///{BACKEND_ROOT / 'database' / 'app.db'}"

    document_storage_path: str = str(BACKEND_ROOT / "storage" / "documents")
    dataset_path: str = str(BACKEND_ROOT / "datasets" / "scholarships.json")

    demo_portal_url: str = "http://localhost:5173/demo-portal"
    frontend_origin: str = "http://localhost:5173"


settings = Settings()

# Ensure required directories always exist.
Path(settings.document_storage_path).mkdir(parents=True, exist_ok=True)
Path(BACKEND_ROOT / "database").mkdir(parents=True, exist_ok=True)
