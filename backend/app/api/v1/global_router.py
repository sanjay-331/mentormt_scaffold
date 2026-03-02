from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from app.db import db
from app.core.auth import get_current_user
from app.core.search import global_search
from app.core.recommendations import recommend_mentors
from app.core.audit import log_action

router = APIRouter(prefix="/api/v1", tags=["Global Services"])

@router.get("/search")
async def search(q: str, current_user: dict = Depends(get_current_user)):
    """Global search for Users and Circulars."""
    return await global_search(q, current_user["role"])

@router.get("/mentors/recommendations/{student_id}")
async def get_recommendations(
    student_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get recommended mentors based on department and load."""
    if current_user["role"] not in ["admin", "student", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await recommend_mentors(student_id)

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """(Admin) Get system audit logs."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs
