
from motor.motor_asyncio import AsyncIOMotorClient
from .core.config import settings

# Use settings parsed by pydantic (from .env)
MONGO_URL = settings.MONGO_URL
DB_NAME = settings.DB_NAME or "testdb"

if not MONGO_URL:
    raise RuntimeError("MONGO_URL not set in environment (.env) or Settings")

_client: AsyncIOMotorClient | None = None

def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URL)
    return _client

def get_db():
    return get_client()[DB_NAME]
