from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Any
from datetime import datetime, timezone
from app.db import db
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/activity", tags=["activity"])

@router.get("/recent")
async def get_recent_activity(
    current_user: dict = Depends(get_current_user),
    limit: int = 10,
    skip: int = 0
):
    """
    Get a unified feed of recent activities based on the user's role.
    """
    activities = []
    
    # Calculate effective fetch limit
    fetch_limit = skip + limit
    
    # Common: Circulars
    # Admins see all, others see 'all' + their role
    circular_query = {"target_audience": "all"}
    if current_user["role"] != "admin":
        circular_query = {
            "$or": [
                {"target_audience": "all"},
                {"target_audience": current_user["role"] + "s"} # e.g. 'students', 'mentors'
            ]
        }
    else:
        circular_query = {} # Admin sees everything
        
    circulars = await db.circulars.find(circular_query).sort("created_at", -1).limit(fetch_limit).to_list(fetch_limit)
    for c in circulars:
        activities.append({
            "type": "circular",
            "title": c.get("title", "Circular Published"),
            "description": c.get("title"), # Short description
            "user": "Administration", # Static for now, or fetch author if needed
            "time": c.get("created_at"),
            "sort_time": c.get("created_at")
        })

    # Admin Specific: New Users
    if current_user["role"] == "admin":
        new_users = await db.users.find().sort("created_at", -1).limit(fetch_limit).to_list(fetch_limit)
        for u in new_users:
            activities.append({
                "type": "user",
                "title": f"New {u['role'].capitalize()} Registered",
                "description": u.get("full_name", "Unknown User"),
                "user": u.get("full_name"),
                "time": u.get("created_at"),
                "sort_time": u.get("created_at")
            })
            
    # Mentor Specific: Mentee Risks & Portfolio
    if current_user["role"] == "mentor":
        # Get Assigned Students
        assignment = await db.assignments.find_one({"mentor_id": current_user["id"]})
        if assignment:
            student_ids = assignment.get("student_ids", [])
            
            # Risk Notifications for these students
            notifications = await db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(fetch_limit).to_list(fetch_limit)
            
            for n in notifications:
                activities.append({
                    "type": "alert" if n.get("type") in ["warning", "critical"] else "info",
                    "title": n.get("title"),
                    "description": n.get("message"),
                    "user": "System",
                    "time": n.get("created_at"),
                     "sort_time": n.get("created_at")
                })
                
    # Student Specific: My Notifications
    if current_user["role"] == "student":
        notifications = await db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(fetch_limit).to_list(fetch_limit)
        for n in notifications:
             activities.append({
                "type": "alert" if n.get("type") in ["warning", "critical"] else "info",
                "title": n.get("title"),
                "description": n.get("message"),
                "user": "System",
                "time": n.get("created_at"),
                "sort_time": n.get("created_at")
            })

    # Sort combined list by time descending
    # Handle string ISO dates
    def parse_time(item):
        t = item.get("sort_time")
        if isinstance(t, str):
            try:
                return datetime.fromisoformat(t.replace('Z', '+00:00'))
            except:
                return datetime.min.replace(tzinfo=timezone.utc)
        return t or datetime.min.replace(tzinfo=timezone.utc)

    activities.sort(key=parse_time, reverse=True)
    
    # Return correct page slice
    if skip >= len(activities):
        return []
        
    return activities[skip : skip + limit]
