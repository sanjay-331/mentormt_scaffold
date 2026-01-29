from datetime import datetime
import uuid

async def create_notification(db, user_id: str, title: str, message: str, type: str = "info"):
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
    }

    await db.notifications.insert_one(notification)
