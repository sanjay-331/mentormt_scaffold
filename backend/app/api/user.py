from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from app.db import db
from app.core.auth import get_current_user
from app.core.audit import log_action

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return current_user

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
    """Retrieves a list of users, filtered by role (Admin/Mentor only)."""
    if current_user["role"] not in ["admin", "mentor"]:
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
