from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./db.sqlite3"
    SECRET_KEY: str = "change_me"
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
