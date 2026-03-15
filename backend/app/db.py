def get_db():
    return db



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
