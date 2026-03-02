from fastapi import APIRouter, Depends, HTTPException, status, Body
from datetime import timedelta
from typing import Optional
from app.db import db
from app.core.auth import (
    create_access_token, 
    get_current_user,
    get_password_hash,
    verify_password
)
from app.models.user import UserCreate, User
from app.core.audit import log_action

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
async def register(payload: UserCreate):
    """Registers a new user."""
    existing_user = await db.users.find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    user_data = payload.model_dump()
    user_data["password_hash"] = get_password_hash(user_data.pop("password"))
    
    # Create the User object to generate UUID and timestamp
    new_user = User(**user_data)
    user_dict = new_user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()

    await db.users.insert_one(user_dict)
    
    # Remove password hash before returning
    user_dict.pop("password_hash", None)
    
    await log_action(user_dict["id"], "REGISTER", "user", {"email": payload.email})
    
    return user_dict

@router.post("/login")
async def login(
    email: Optional[str] = None,
    password: Optional[str] = None,
    payload: dict = Body(None)
):
    """
    Logs in a user and returns a JWT token.
    Supports email/password from either query parameters or JSON body.
    """
    # 1. Try to get credentials from payload (JSON body)
    if payload:
        email = email or payload.get("email")
        password = password or payload.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Check for both password_hash and legacy fields
    password_hash = user.get("password_hash") or user.get("password")
    
    if not password_hash or not verify_password(password, password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    await log_action(user["id"], "LOGIN", "session")
    
    # Prepare non-sensitive user data for frontend
    user_info = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "college": user.get("college"),
        "branch": user.get("branch"),
        "department": user.get("department"),
        "semester": user.get("semester"),
        "year": user.get("year"),
        "usn": user.get("usn"),
        "employee_id": user.get("employee_id"),
        "settings": user.get("settings", {})
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the current user profile."""
    # current_user is already cleaned of sensitive fields in the dependency
    return current_user
