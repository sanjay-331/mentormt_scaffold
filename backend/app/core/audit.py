from app.db import db
from datetime import datetime, timezone

async def log_action(
    user_id: str,
    action: str,
    resource: str,
    details: dict = None,
    ip_address: str = None
):
    """
    Logs a user action to the database.
    
    Args:
        user_id: ID of the user performing the action.
        action: Type of action (e.g., "LOGIN", "UPLOAD", "CREATE").
        resource: Target resource (e.g., "attendance", "circulars").
        details: Additional context (e.g., {"count": 50}).
        ip_address: IP address of the user.
    """
    log_entry = {
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "details": details or {},
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await db.audit_logs.insert_one(log_entry)
