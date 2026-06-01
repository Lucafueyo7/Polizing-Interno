from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "WhatsApp Insurance Chatbot"
    app_env: str = "local"
    database_url: str = "sqlite:///./data/chatbot.db"

    whatsapp_verify_token: str = "change-me"
    whatsapp_access_token: str = "change-me"
    whatsapp_phone_number_id: str = "change-me"
    whatsapp_api_version: str = "v21.0"

    main_system_base_url: str = "mock"
    main_system_api_key: str = "change-me"
    outbound_api_key: str = "change-me"

    admin_username: str = "admin"
    admin_password: str = "admin123"
    session_secret_key: str = "change-me-session-secret"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
