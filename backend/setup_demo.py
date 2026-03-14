import asyncio
from app.db import db
from app.api.v1.auth import get_password_hash
import uuid

async def setup_demo_users():
    demo_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@demo.com",
            "full_name": "Demo Admin",
            "role": "admin",
            "password": "pass123",
            "department": "CSE",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "email": "mentor@demo.com",
            "full_name": "Demo Mentor",
            "role": "mentor",
            "password": "pass123",
            "department": "CSE",
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "email": "student@demo.com",
            "full_name": "Demo Student",
            "role": "student",
            "password": "pass123",
            "usn": "1MS20CS001",
            "semester": 6,
            "department": "CSE",
            "branch": "Computer Science",
            "is_active": True
        }
    ]
    
    for u in demo_users:
        # Check if exists
        existing = await db.users.find_one({"email": u["email"]})
        hashed = get_password_hash(u["password"])
        user_data = {
            "id": u.get("id") if not existing else existing["id"],
            "email": u["email"],
            "full_name": u["full_name"],
            "role": u["role"],
            "hashed_password": hashed,
            "department": u.get("department"),
            "usn": u.get("usn"),
            "semester": u.get("semester"),
            "branch": u.get("branch"),
            "is_active": True
        }
        if existing:
            await db.users.replace_one({"email": u["email"]}, user_data)
            print(f"Updated: {u['email']}")
        else:
            await db.users.insert_one(user_data)
            print(f"Created: {u['email']}")

if __name__ == "__main__":
    asyncio.run(setup_demo_users())
