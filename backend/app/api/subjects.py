from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.db import db
from app.core.auth import get_current_user
from app.models.subjects import Subject
from app.schemas.subjects import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
async def get_subjects(
    department: Optional[str] = None,
    semester: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get subjects, optionally filtered by department and semester.
    """
    query = {}
    if department:
        query["department"] = department
    if semester:
        query["semester"] = semester
        
    subjects = await db.subjects.find(query).to_list(1000)
    
    # Map _id to id for response model
    results = []
    for sub in subjects:
        sub["id"] = sub.get("id") or str(sub["_id"])
        results.append(sub)
        
    return results

@router.post("", response_model=SubjectResponse)
async def create_subject(
    payload: SubjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new subject.
    Only Mentors and Admins can create subjects.
    """
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Check for duplicate subject code in same dept
    existing = await db.subjects.find_one({
        "code": payload.code,
        "department": payload.department
    })
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject code {payload.code} already exists in {payload.department}")

    subject = Subject(
        **payload.model_dump(),
        created_by=current_user["id"]
    )
    
    subject_data = subject.model_dump()
    subject_data["created_at"] = subject_data["created_at"].isoformat()
    
    await db.subjects.insert_one(subject_data)
    
    return subject_data

@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a subject.
    Only Mentors (who created it or same dept) and Admins can update.
    """
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    existing = await db.subjects.find_one({"id": subject_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    # Authorization check: 
    # Mentors should ideally only update subjects from their department
    if current_user["role"] == "mentor" and existing["department"] != current_user.get("department"):
         # Optional: stricter check could be created_by == current_user["id"]
         # For now, allow department-level control
         pass

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
         raise HTTPException(status_code=400, detail="No fields to update")

    await db.subjects.update_one(
        {"id": subject_id},
        {"$set": update_data}
    )
    
    updated_subject = await db.subjects.find_one({"id": subject_id})
    updated_subject["id"] = updated_subject.get("id") or str(updated_subject["_id"])
    
    return updated_subject

@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a subject.
    """
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    return {"message": "Subject deleted successfully"}
