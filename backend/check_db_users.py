import asyncio
from app.db import db

async def check_user():
    user = await db.users.find_one({"full_name": "Sanjay"})
    if user:
        print(f"DEBUG_ROLE: {user.get('role')}")
        print(f"DEBUG_ID: {user.get('id')}")
    else:
        print("DEBUG_USER_NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(check_user())
