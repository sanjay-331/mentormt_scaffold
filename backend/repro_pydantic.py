
import asyncio
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, timezone
import uuid
from typing import Optional, Dict, Any

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

async def test_repro():
    payload_dict = {
        "full_name": "Test User",
        "email": "test@example.com",
        "role": "student",
        "password": "password123"
    }
    
    payload = UserCreate(**payload_dict)
    print("Payload validated")
    
    user_data = payload.model_dump()
    user_data["password_hash"] = "fake_hash"
    user_data.pop("password")
    
    print("Creating User object...")
    new_user = User(**user_data)
    user_dict = new_user.model_dump()
    print("User dict created")
    
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    print("Final dict:", user_dict)

if __name__ == "__main__":
    asyncio.run(test_repro())
