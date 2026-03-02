import asyncio
from app.db import db

async def list_all():
    cursor = db.users.find().limit(50)
    with open("all_users_full.txt", "w", encoding="utf-8") as f:
        async for user in cursor:
            f.write(f"User: {user.get('full_name')} | Email: {user.get('email')} | Role: {user.get('role')} | ID: {user.get('id')}\n")

if __name__ == "__main__":
    asyncio.run(list_all())
