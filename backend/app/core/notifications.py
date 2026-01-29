from datetime import datetime, timezone
from typing import List, Optional
import uuid
from app.models.notification import Notification
from app.db import db
from app.sio_instance import sio, connected_users

async def create_notification(
    user_id: str,
    title: str,
    message: str,
    type: str = "info",
    link: Optional[str] = None,
    metadata: Optional[dict] = None
) -> dict:
    """Creates a notification for a single user and emits a socket event."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        link=link,
        metadata=metadata or {}
    )
    
    data = notification.model_dump()
    data["created_at"] = data["created_at"].isoformat()
    
    # Save to DB
    result = await db.notifications.insert_one(data)
    data["mongo_id"] = str(result.inserted_id)
    data.pop("_id", None)
    
    # Real-time alert via Socket.IO
    sid = connected_users.get(user_id)
    if sid:
        await sio.emit("new_notification", data, room=sid)
        
    return data

async def create_broadcast_notification(
    target_role: str, # 'student', 'mentor', 'all'
    title: str,
    message: str,
    type: str = "info",
    link: Optional[str] = None
):
    """Creates notifications for multiple users based on role."""
    query = {}
    if target_role != "all":
        query["role"] = target_role
        
    users = await db.users.find(query, {"id": 1}).to_list(10000)
    
    notifications = []
    created_at = datetime.now(timezone.utc).isoformat()
    
    for user in users:
        ntf = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": title,
            "message": message,
            "type": type,
            "link": link,
            "read": False,
            "created_at": created_at,
            "metadata": {"broadcast": True}
        }
        notifications.append(ntf)
        
        # Real-time (best effort loop)
        sid = connected_users.get(user["id"])
        if sid:
            await sio.emit("new_notification", ntf, room=sid)
            
    if notifications:
        await db.notifications.insert_many(notifications)
        
    return len(notifications)

async def check_academic_risk(student_id: str):
    """
    Analyzes student performance and triggers risk alerts if needed.
    Called after attendance or marks updates.
    """
    # 1. Calculate Attendance %
    attendance_records = await db.attendance.find(
        {"student_id": student_id}
    ).to_list(1000)
    
    total = len(attendance_records)
    present = sum(1 for r in attendance_records if r["status"] == "present")
    att_pct = (present / total * 100) if total > 0 else 100
    
    # 2. Calculate Marks Average %
    marks_records = await db.marks.find(
        {"student_id": student_id}
    ).to_list(1000)
    
    if marks_records:
        valid_marks = [m for m in marks_records if m.get("max_marks", 0) > 0]
        if valid_marks:
            avg_pct = sum((m["marks_obtained"] / m["max_marks"] * 100) for m in valid_marks) / len(valid_marks)
        else:
            avg_pct = 0 # No valid marks data yet
    else:
        avg_pct = 100 # Default to safe if no data
        
    # 3. Determine Risk
    risk_level = "low"
    reasons = []
    
    if att_pct < 65:
        risk_level = "critical"
        reasons.append(f"Low Attendance ({att_pct:.1f}%)")
    elif att_pct < 75:
        risk_level = "warning"
        reasons.append(f"Borderline Attendance ({att_pct:.1f}%)")
        
    if avg_pct < 40:
        if risk_level != "critical": risk_level = "critical"
        reasons.append(f"Failing Marks ({avg_pct:.1f}%)")
    elif avg_pct < 50:
        if risk_level != "critical": risk_level = "warning"
        reasons.append(f"Low Marks ({avg_pct:.1f}%)")
        
    # 4. Notify Mentor if Risk Detected
    if risk_level in ["warning", "critical"]:
        # Find Mentor
        assignment = await db.assignments.find_one({"student_ids": student_id})
        if assignment:
            mentor_id = assignment["mentor_id"]
            
            # Check if we already alerted recently? (Skipped for simplicity, maybe add cooldown in future)
            
            student = await db.users.find_one({"id": student_id}, {"full_name": 1, "usn": 1})
            s_name = student.get("full_name", "Student")
            
            title = f"Risk Alert: {s_name}"
            msg = f"{s_name} is at {risk_level.upper()} risk due to: {', '.join(reasons)}."
            type_ = "critical" if risk_level == "critical" else "warning"
            
            await create_notification(
                user_id=mentor_id,
                title=title,
                message=msg,
                type=type_,
                link=f"/mentor/student/{student_id}",
                metadata={"student_id": student_id, "risk_level": risk_level}
            )
