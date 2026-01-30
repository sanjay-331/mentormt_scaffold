
# from motor.motor_asyncio import AsyncIOMotorClient
# from .core.config import settings

# # Use settings parsed by pydantic (from .env)
# MONGO_URL = settings.MONGO_URL
# DB_NAME = settings.DB_NAME or "testdb"

# if not MONGO_URL:
#     raise RuntimeError("MONGO_URL not set in environment (.env) or Settings")

# _client: AsyncIOMotorClient | None = None

# def get_client() -> AsyncIOMotorClient:
#     global _client
#     if _client is None:
#         _client = AsyncIOMotorClient(MONGO_URL)
#     return _client

# def get_db():
#     return get_client()[DB_NAME]



import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load env HERE (central place)
# Load .env ONLY for local development
if os.getenv("ENV") != "production":
    ROOT_DIR = Path(__file__).resolve().parent.parent
    load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "testdb")

if not MONGO_URL:
    raise RuntimeError("MONGO_URL not set in environment (.env)")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
