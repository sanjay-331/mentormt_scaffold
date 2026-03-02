import asyncio
from app.db import db

async def check_users():
    cursor = db.users.find({"full_name": {"$regex": "Sanjay", "$options": "i"}})
    async for user in cursor:
        print(f"Match: {user.get('full_name')} | Role: {user.get('role')} | ID: {user.get('id')}")

if __name__ == "__main__":
    asyncio.run(check_users())
