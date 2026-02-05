from fastapi import APIRouter, Depends, HTTPException
from app.db import db
from app.core.auth import get_current_user
from app.core.analytics import get_department_performance, get_system_risk_distribution
from typing import List, Dict, Any

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("/admin")
async def get_admin_overview(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_students = await db.users.count_documents({"role": "student"})
    total_mentors = await db.users.count_documents({"role": "mentor"})
    total_circulars = await db.circulars.count_documents({})
    total_assignments = await db.assignments.count_documents({})  # Assuming one doc per relationship or group
    
    return {
        "total_students": total_students,
        "total_mentors": total_mentors,
        "total_circulars": total_circulars,
        "total_assignments": total_assignments
    }

@router.get("/admin/mentor-load")
async def get_mentor_load(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Aggregate students per mentor
    pipeline = [
        {"$project": {"mentor_id": 1, "student_count": {"$size": "$student_ids"}}},
        {"$lookup": {
            "from": "users",
            "localField": "mentor_id",
            "foreignField": "id",
            "as": "mentor_info"
        }},
        {"$unwind": "$mentor_info"},
        {"$project": {
            "mentor_name": "$mentor_info.full_name",
            "student_count": 1,
            "_id": 0
        }}
    ]
    
    load = await db.assignments.aggregate(pipeline).to_list(100)
    return load

@router.get("/admin/students-by-department")
async def get_students_by_dept(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    pipeline = [
        {"$match": {"role": "student"}},
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$project": {"department": "$_id", "count": 1, "_id": 0}}
    ]
    
    stats = await db.users.aggregate(pipeline).to_list(100)
    # Handle null departments
    for s in stats:
        if not s.get("department"):
            s["department"] = "Unknown"
            
    return stats

@router.get("/mentor")
async def get_mentor_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assignment = await db.assignments.find_one({"mentor_id": current_user["id"]})
    mentee_count = 0
    student_ids = []
    
    if assignment and "student_ids" in assignment:
        mentee_count = len(assignment["student_ids"])
        student_ids = assignment["student_ids"]
    
    # Calculate pending reviews
    pending_certs = await db.certifications.count_documents({
        "student_id": {"$in": student_ids},
        "is_verified": False
    })
    
    pending_letters = await db.letters.count_documents({
        "student_id": {"$in": student_ids},
        "status": "pending"
    })
    
    return {
        "mentees_count": mentee_count,
        "pending_reviews": pending_certs + pending_letters
    }

@router.get("/student")
async def get_student_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Calculate attendance
    attendance_records = await db.attendance.find({"student_id": current_user["id"]}).to_list(1000)
    total_classes = len(attendance_records)
    present_classes = sum(1 for r in attendance_records if r["status"] == "present")
    attendance_pct = (present_classes / total_classes * 100) if total_classes > 0 else 0
    
    # Calculate Academic Stats (CGPA & Backlogs)
    marks_records = await db.marks.find({"student_id": current_user["id"]}).to_list(1000)
    
    total_obtained = 0
    total_max = 0
    active_backlogs = 0
    
    for m in marks_records:
        if m.get("max_marks", 0) > 0:
            total_obtained += m["marks_obtained"]
            total_max += m["max_marks"]
            
            # Assuming 40% is passing
            if (m["marks_obtained"] / m["max_marks"]) < 0.40:
                active_backlogs += 1
                
    # Simple CGPA approximation: (Percentage / 10)
    cgpa = 0
    if total_max > 0:
        pct = (total_obtained / total_max) * 100
        cgpa = pct / 10
        
    return {
        "attendance": round(attendance_pct, 1),
        "cgpa": round(cgpa, 2),
        "active_backlogs": active_backlogs
    }
