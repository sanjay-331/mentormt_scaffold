
import asyncio
from app.models.user import UserCreate, User
from app.db import db
from datetime import datetime, timezone

async def test_register_logic():
    print("Testing registration logic...")
    try:
        payload = UserCreate(
            full_name="Repro User",
            email="repro@demo.com",
            role="student",
            password="pass123"
        )
        print("Payload created")
        
        user_data = payload.model_dump()
        user_data["password_hash"] = "fake_hash"
        user_data.pop("password")
        
        print("Creating User model...")
        new_user = User(**user_data)
        user_dict = new_user.model_dump()
        
        # This isoformat() part matches auth.py
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        
        print("User dict prepared:", user_dict)
        print("Attempting DB insert (this might fail if no mongo, but we want to see Pydantic/logic errors first)...")
        # await db.users.insert_one(user_dict) # Commented to avoid side effects if not needed
        print("Logic seems OK if it reached here.")
        
    except Exception as e:
        print("CAUGHT ERROR:", type(e), e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_register_logic())
