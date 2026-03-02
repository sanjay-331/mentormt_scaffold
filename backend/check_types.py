import asyncio
from app.db import db

async def check_types():
    user = await db.users.find_one({"email": "admin@demo.com"})
    if user:
        print(f"Name: {user.get('full_name')}")
        print(f"ID: {user.get('id')} | Type: {type(user.get('id'))}")
        print(f"MongoID: {user.get('_id')} | Type: {type(user.get('_id'))}")
    else:
        print("User not found")

if __name__ == "__main__":
    asyncio.run(check_types())
