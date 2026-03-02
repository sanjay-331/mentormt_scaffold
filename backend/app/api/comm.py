from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import List, Optional, Dict, Any
import os
import uuid
import io
from datetime import datetime, timezone
from app.db import db
from app.core.auth import get_current_user
from app.core.notifications import create_notification, create_broadcast_notification
from app.core.audit import log_action
from app.models.user import Feedback, FeedbackCreate, Rating
from app.models.communication import Circular, Message
from app.sio_instance import sio

router = APIRouter(prefix="/api", tags=["Communication"])

# --- Feedback Routes ---

@router.post("/feedback")
async def create_feedback(
    payload: FeedbackCreate,
    current_user: dict = Depends(get_current_user),
):
    """Creates a new feedback record (Mentor or Admin)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    feedback = Feedback(
        mentor_id=current_user["id"],
        student_id=payload.student_id,
        feedback_text=payload.feedback_text,
    )

    feedback_data = feedback.model_dump()
    feedback_data["created_at"] = feedback_data["created_at"].isoformat()

    result = await db.feedback.insert_one(feedback_data)

    feedback_data["mongo_id"] = str(result.inserted_id)
    feedback_data.pop("_id", None)

    # Notify Student
    await create_notification(
        user_id=payload.student_id,
        title="New Feedback Received",
        message="Your mentor has provided new feedback.",
        type="info",
        link="/student/feedback",
        metadata={"feedback_id": feedback_data["mongo_id"]}
    )
    
    await log_action(current_user["id"], "CREATE", "feedback", {"student_id": payload.student_id})

    return feedback_data

@router.get("/feedback/student/{student_id}")
async def get_student_feedback(
    student_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets all feedback records for a specific student."""
    if current_user["role"] != "student" or current_user["id"] != student_id:
        if current_user["role"] not in ["admin", "mentor"]:
            raise HTTPException(status_code=403, detail="Not authorized")

    feedbacks = await db.feedback.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return feedbacks

# --- Message Routes ---

@router.get("/messages")
async def get_messages(
    other_user_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets messages between the current user and another user."""
    messages = (
        await db.messages.find(
            {
                "$or": [
                    {"sender_id": current_user["id"], "receiver_id": other_user_id},
                    {"sender_id": other_user_id, "receiver_id": current_user["id"]},
                ]
            },
            {"_id": 0},
        )
        .sort("created_at", 1)
        .to_list(1000)
    )

    # Mark as read
    await db.messages.update_many(
        {
            "sender_id": other_user_id,
            "receiver_id": current_user["id"],
            "is_read": False,
        },
        {"$set": {"is_read": True}},
    )

    return messages

@router.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Gets a list of users the current user has conversed with."""
    messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": current_user["id"]},
                {"receiver_id": current_user["id"]},
            ]
        },
        {"_id": 0},
    ).to_list(10000)

    user_ids = set()
    for msg in messages:
        if msg["sender_id"] != current_user["id"]:
            user_ids.add(msg["sender_id"])
        if msg["receiver_id"] != current_user["id"]:
            user_ids.add(msg["receiver_id"])

    users = await db.users.find(
        {"id": {"$in": list(user_ids)}}, {"_id": 0, "password_hash": 0}
    ).to_list(1000)

    return users

# --- Circular Routes ---

@router.post("/circulars")
async def create_circular(
    title: str = Form(...),
    content: str = Form(...),
    target_audience: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    file_url = None

    if file:
        folder = "app/uploads/circulars"
        os.makedirs(folder, exist_ok=True)
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = f"{folder}/{filename}"

        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())

        file_url = f"/uploads/circulars/{filename}"

    circular = Circular(
        author_id=current_user["id"],
        title=title,
        content=content,
        target_audience=target_audience,
        file_url=file_url,
    )

    data = circular.model_dump()
    data["created_at"] = data["created_at"].isoformat()

    result = await db.circulars.insert_one(data)

    data.pop("_id", None)
    data["mongo_id"] = str(result.inserted_id)

    # Broadcast Notification
    await create_broadcast_notification(
        target_role=target_audience,
        title=f"New Circular: {title}",
        message=content[:100] + ("..." if len(content) > 100 else ""),
        type="info",
        link="/circulars"
    )
    
    await log_action(current_user["id"], "CREATE", "circular", {"title": title, "audience": target_audience})

    # Emit live notification via Socket.IO
    await sio.emit("notification", {
        "title": f"New Circular: {title}",
        "message": f"New notice for {target_audience}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": "info",
        "link": "/circulars"
    })

    return data

@router.get("/circulars")
async def get_circulars(current_user: dict = Depends(get_current_user)):
    """Gets circulars relevant to the user's role."""
    query = {
        "$or": [
            {"target_audience": "all"},
            {"target_audience": current_user["role"] + "s"},
        ]
    }

    circulars = (
        await db.circulars.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    )
    return circulars

# --- Rating Routes ---

@router.post("/ratings")
async def create_rating(rating: Rating, current_user: dict = Depends(get_current_user)):
    """Creates a student rating (Mentor only)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    rating.mentor_id = current_user["id"]
    rating_data = rating.model_dump()
    rating_data["created_at"] = rating_data["created_at"].isoformat()

    # Clear existing rating for this student-mentor pair for idempotency
    await db.ratings.delete_many(
        {"student_id": rating.student_id, "mentor_id": rating.mentor_id}
    )

    await db.ratings.insert_one(rating_data)
    
    await log_action(current_user["id"], "CREATE", "rating", {"student_id": rating.student_id})

    return rating_data

@router.get("/ratings/student/{student_id}")
async def get_student_rating(
    student_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets the latest rating for a specific student."""
    rating = await db.ratings.find_one(
        {"student_id": student_id},
        {"_id": 0},
        sort=[("created_at", -1)],
    )
    return rating if rating else {}
