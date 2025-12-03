
import json
from typing import List, Union
from pydantic import BaseSettings, validator, Field

class Settings(BaseSettings):
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./db.sqlite3"
    SECRET_KEY: str = "change_me"
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # Add Mongo settings so they are parsed from .env
    MONGO_URL: str | None = Field(None, env="MONGO_URL")
    DB_NAME: str = Field("testdb", env="DB_NAME")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if v is None or (isinstance(v, str) and v.strip() == ""):
            return ["*"]
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            val = v.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    pass
            if "," in val:
                return [x.strip() for x in val.split(",") if x.strip()]
            return [val]
        return ["*"]

settings = Settings()

