import asyncio
from app.db import db

async def list_admins():
    cursor = db.users.find({"role": "admin"})
    with open("all_admins.txt", "w", encoding="utf-8") as f:
        async for user in cursor:
            f.write(f"User: {user.get('full_name')} | Email: {user.get('email')} | ID: {user.get('id')}\n")

if __name__ == "__main__":
    asyncio.run(list_admins())
