from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Optional, Dict, Any
from app.db import db
from app.core.auth import get_current_user, get_password_hash
from app.core.audit import log_action
import csv
import json
import uuid
from datetime import datetime
from io import StringIO

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return current_user

@router.post("/bulk")
async def bulk_import_users(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Import multiple users from a CSV or JSON file (Admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    content = await file.read()
    users_to_insert = []
    
    try:
        if file.filename.endswith('.csv'):
            decoded = content.decode('utf-8')
            reader = csv.DictReader(StringIO(decoded))
            for row in reader:
                users_to_insert.append(row)
        elif file.filename.endswith('.json'):
            users_to_insert = json.loads(content)
        else:
            raise HTTPException(status_code=400, detail="Invalid file format. Use CSV or JSON.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
        
    if not users_to_insert:
        raise HTTPException(status_code=400, detail="No users found in file")
        
    inserted_count = 0
    errors = []
    
    for user_data in users_to_insert:
        try:
            # Required fields
            email = user_data.get("email")
            full_name = user_data.get("full_name")
            role = user_data.get("role", "student")
            password = user_data.get("password", "password123")
            
            if not email or not full_name:
                errors.append(f"Missing email or full_name for row: {user_data}")
                continue
                
            # Check existing
            existing = await db.users.find_one({"email": email})
            if existing:
                errors.append(f"User with email {email} already exists")
                continue
                
            user_id = str(uuid.uuid4())
            new_user = {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
                "password_hash": get_password_hash(password),
                "created_at": datetime.utcnow().isoformat(),
                "phone": user_data.get("phone", ""),
                "department": user_data.get("department", ""),
                "semester": int(user_data.get("semester", 1)) if user_data.get("semester") else None,
                "usn": user_data.get("usn", ""),
                "settings": {}
            }
            
            await db.users.insert_one(new_user)
            inserted_count += 1
            
        except Exception as e:
            errors.append(f"Error processing {user_data.get('email', 'unknown')}: {str(e)}")
            
    await log_action(current_user["id"], "IMPORT", "users", {"inserted": inserted_count, "errors": len(errors)})
    
    return {
        "message": f"Successfully imported {inserted_count} users",
        "inserted": inserted_count,
        "errors": errors
    }

@router.put("/me/settings")
async def update_my_settings(
    settings: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences (e.g. dark mode, notifications)."""
    updated_settings = current_user.get("settings", {})
    updated_settings.update(settings)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"settings": updated_settings}}
    )
    
    await log_action(current_user["id"], "UPDATE", "settings", {"changes": settings})
    
    return {"message": "Settings updated", "settings": updated_settings}

@router.get("")
async def list_users(
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Retrieves a list of users, filtered by role."""
    # Admins and mentors can see all. Students can only see mentors.
    if current_user["role"] == "student" and role != "mentor":
        raise HTTPException(status_code=403, detail="Students can only fetch mentors")
    elif current_user["role"] not in ["admin", "mentor", "student"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = {"role": role} if role else {}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@router.get("/{user_id}")
async def get_user_by_id(
    user_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Retrieves a user profile by ID."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}")
async def update_user_profile(
    user_id: str, 
    updates: dict, 
    current_user: dict = Depends(get_current_user)
):
    """Updates user details (Admin or self)."""
    if current_user["role"] != "admin" and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Filter sensitive fields
    forbidden = ["password", "password_hash", "email", "role", "id", "created_at", "_id"]
    update_fields = {k: v for k, v in updates.items() if k not in forbidden}

    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields for update")

    # Academic logic cleanup (casting semester etc)
    if "semester" in update_fields:
        try:
            update_fields["semester"] = int(update_fields["semester"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Semester must be an integer")

    await db.users.update_one({"id": user_id}, {"$set": update_fields})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    
    await log_action(current_user["id"], "UPDATE", "user", {"target_id": user_id})
    
    return updated_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Deletes a user (Admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.users.delete_one({"id": user_id})
    await log_action(current_user["id"], "DELETE", "user", {"target_id": user_id})
    
    return {"message": "User deleted successfully"}

@router.get("/student/timeline")
async def get_student_timeline(current_user: dict = Depends(get_current_user)):
    """Get chronological activity timeline (Notifications + Feedback)."""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    notifs = await db.notifications.find(
        {"user_id": current_user["id"]}, 
        {"title": 1, "message": 1, "created_at": 1, "type": 1, "_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    feedbacks = await db.feedback.find(
        {"student_id": current_user["id"]},
        {"feedback_type": 1, "feedback_text": 1, "created_at": 1, "mentor_id": 1, "_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    timeline = []
    for n in notifs:
        timeline.append({
            "type": "notification",
            "title": n.get("title"),
            "description": n.get("message"),
            "timestamp": n["created_at"],
            "meta": {"type": n.get("type")}
        })
    for f in feedbacks:
        timeline.append({
            "type": "feedback",
            "title": "Feedback Received",
            "description": f.get("feedback_text"),
            "timestamp": f["created_at"],
            "meta": {"from": f.get("mentor_id")}
        })
        
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    return timeline[:50]
