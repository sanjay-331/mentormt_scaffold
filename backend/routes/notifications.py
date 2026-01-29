from fastapi import APIRouter, Depends
from app.database import db
from app.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(current_user=Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    return notifications


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user=Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}
