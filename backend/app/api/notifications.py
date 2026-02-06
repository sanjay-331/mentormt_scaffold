from fastapi import APIRouter, Depends, HTTPException, status
from app.db import db
from app.core.auth import get_current_user
from typing import List, Dict, Any

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_notifications(
    limit: int = 20, 
    skip: int = 0, 
    current_user: dict = Depends(get_current_user)
):
    """
    Get notifications for the current user.
    """
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return notifications

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    """
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"message": "Marked as read"}

@router.post("/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user)
):
    """
    Mark all notifications for the user as read.
    """
    await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

@router.delete("/clear-all")
async def clear_all_notifications(
    current_user: dict = Depends(get_current_user)
):
    """
    Delete all notifications for the user.
    """
    await db.notifications.delete_many({"user_id": current_user["id"]})
    return {"message": "All notifications cleared"}
