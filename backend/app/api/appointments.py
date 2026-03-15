from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from app.db import db
from app.core.auth import get_current_user
from app.core.audit import log_action
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.post("")
async def create_appointment(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Book a new appointment."""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can book appointments")

    mentor_id = data.get("mentor_id")
    date = data.get("date")
    reason = data.get("reason", "")
    
    if not mentor_id or not date:
        raise HTTPException(status_code=400, detail="Missing mentor_id or date")
        
    mentor = await db.users.find_one({"id": mentor_id, "role": "mentor"})
    if not mentor:
         # Fallback to name search if mentor_id is actually a name from the free text UI
         mentor = await db.users.find_one({"full_name": mentor_id, "role": "mentor"})
         if not mentor:
             raise HTTPException(status_code=404, detail="Mentor not found")

    appointment = {
        "id": str(uuid.uuid4()),
        "student_id": current_user["id"],
        "mentor_id": mentor["id"],
        "mentor_name": mentor.get("full_name"),
        "student_name": current_user.get("full_name"),
        "date": date,
        "reason": reason,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.appointments.insert_one(appointment)
    if "_id" in appointment:
        del appointment["_id"]
    
    # Notify Mentor
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": mentor["id"],
        "title": "New Appointment Request",
        "message": f"{current_user['full_name']} requested an appointment on {date}",
        "type": "info",
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    }
    await db.notifications.insert_one(notif)
    
    return {"message": "Appointment booked successfully", "appointment": appointment}

@router.get("")
async def list_appointments(current_user: dict = Depends(get_current_user)):
    """List appointments for the current user."""
    query = {}
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    elif current_user["role"] == "mentor":
        query["mentor_id"] = current_user["id"]
    else:
        # Admin sees all or none, let's say all
        pass
        
    apps = await db.appointments.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return apps

@router.put("/{app_id}/status")
async def update_appointment_status(
    app_id: str,
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update status of appointment (approve, reject, etc)"""
    if current_user["role"] not in ["mentor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_status = data.get("status")
    if new_status not in ["approved", "rejected", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    app = await db.appointments.find_one({"id": app_id})
    if not app:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    await db.appointments.update_one({"id": app_id}, {"$set": {"status": new_status, "updated_at": datetime.utcnow().isoformat()}})
    
    # Notify Student
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": app["student_id"],
        "title": "Appointment Update",
        "message": f"Your appointment on {app['date']} was {new_status}",
        "type": "info" if new_status == "approved" else "warning",
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    }
    await db.notifications.insert_one(notif)
    
    return {"message": f"Appointment {new_status}"}
