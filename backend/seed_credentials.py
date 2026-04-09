import asyncio
import uuid
from datetime import datetime, timezone
from app.db import db
from app.core.auth import get_password_hash

async def seed_users():
    print("Starting user seeding...")
    
    users_to_seed = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@mentormt.com",
            "full_name": "System Admin",
            "role": "admin",
            "password": "adminpassword123",
            "department": "Administration"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "mentor@mentormt.com",
            "full_name": "Jodie Mentor",
            "role": "mentor",
            "password": "mentorpassword123",
            "department": "Computer Science",
            "employee_id": "M001"
        },
        {
            "id": str(uuid.uuid4()),
            "email": "student@mentormt.com",
            "full_name": "Alex Student",
            "role": "student",
            "password": "studentpassword123",
            "department": "Computer Science",
            "usn": "1MS20CS001",
            "semester": 6
        }
    ]
    
    for user_data in users_to_seed:
        password = user_data.pop("password")
        email = user_data["email"]
        
        # Check if user already exists
        existing = await db.users.find_one({"email": email})
        
        user_data["password_hash"] = get_password_hash(password)
        user_data["created_at"] = datetime.now(timezone.utc)
        
        if existing:
            await db.users.update_one({"email": email}, {"$set": user_data})
            print(f"Updated existing user: {email} (Password: {password})")
        else:
            await db.users.insert_one(user_data)
            print(f"Created new user: {email} (Password: {password})")

    print("\nSeeding complete!")
    print("-" * 30)
    print("CREDENTIALS:")
    for u in users_to_seed:
        # Note: we need to retrieve the password from a temporary storage if we want to print it again, 
        # but I've already printed it in the loop.
        pass

if __name__ == "__main__":
    asyncio.run(seed_users())
