'''
Configuration settings and env variables
'''

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    
    class Config:
        env_file = '.env'

# Instance used across the app
settings = Settings()