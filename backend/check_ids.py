import asyncio
from app.db import db

async def check_ids():
    cursor = db.users.find().limit(100)
    with open("all_ids.txt", "w", encoding="utf-8") as f:
        async for user in cursor:
            f.write(f"Name: {user.get('full_name')} | ID: {user.get('id')} | MongoID: {user.get('_id')}\n")

if __name__ == "__main__":
    asyncio.run(check_ids())
