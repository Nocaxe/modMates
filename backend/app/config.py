'''
Configuration settings and env variables
'''

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    cors_origins: list[str] = ["http://localhost:5173"] # Default to frontend dev server
    
    class Config:
        env_file = '.env'

# Instance used across the app
settings = Settings() # type: ignore (fields required but will be loaded from .env)