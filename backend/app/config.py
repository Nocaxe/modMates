'''
Configuration settings and env variables
'''

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = ""
    cors_origins: list[str] = ["http://localhost:5173"] # Default to frontend dev server
    supabase_public_key: dict = {}
    
    model_config = SettingsConfigDict(env_file=".env")

# Instance used across the app
settings = Settings()