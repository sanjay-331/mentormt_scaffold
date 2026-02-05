from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.db import db
from app.core.auth import get_current_user
from app.models.portfolio import (
    StudentCertification, CertificationCreate,
    StudentProject, ProjectCreate,
    StudentLetter, LetterCreate,
    SportsActivity, SportsCreate,
    CulturalActivity, CulturalCreate,
    PlacementPrediction
)
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])

# --- Certifications ---
@router.post("/certifications", response_model=StudentCertification)
async def add_certification(
    cert: CertificationCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can add certifications")

    new_cert = StudentCertification(
        student_id=current_user["id"],
        **cert.dict()
    )
    
    cert_data = new_cert.dict()
    cert_data["created_at"] = cert_data["created_at"].isoformat()
    
    await db.certifications.insert_one(cert_data)
    
    # Cleanup for response
    if "_id" in cert_data: del cert_data["_id"]
    return cert_data

@router.get("/certifications/{student_id}", response_model=List[StudentCertification])
async def get_certifications(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Students can view their own, Mentors/Admin can view all
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    certs = await db.certifications.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return certs

@router.patch("/certifications/{cert_id}/verify")
async def verify_certification(
    cert_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["mentor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.certifications.update_one(
        {"id": cert_id},
        {"$set": {"is_verified": True, "verified_by": current_user["full_name"]}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Certification not found")
        
    return {"message": "Certification verified"}

# --- Projects ---
@router.post("/projects", response_model=StudentProject)
async def add_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can add projects")

    new_project = StudentProject(
        student_id=current_user["id"],
        **project.dict()
    )
    
    proj_data = new_project.dict()
    proj_data["created_at"] = proj_data["created_at"].isoformat()
    
    await db.projects.insert_one(proj_data)
    if "_id" in proj_data: del proj_data["_id"]
    return proj_data

@router.get("/projects/{student_id}", response_model=List[StudentProject])
async def get_projects(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    projs = await db.projects.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return projs

# --- Letters ---
@router.post("/letters", response_model=StudentLetter)
async def submit_letter(
    letter: LetterCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit letters")

    new_letter = StudentLetter(
        student_id=current_user["id"],
        **letter.dict()
    )
    
    letter_data = new_letter.dict()
    letter_data["created_at"] = letter_data["created_at"].isoformat()
    letter_data["submitted_date"] = letter_data["submitted_date"].isoformat()
    
    await db.letters.insert_one(letter_data)
    if "_id" in letter_data: del letter_data["_id"]
    return letter_data

@router.get("/letters/{student_id}", response_model=List[StudentLetter])
async def get_letters(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    letters = await db.letters.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return letters

class LetterReply(BaseModel):
    response: str
    status: str # accepted, rejected



@router.patch("/letters/{letter_id}/reply")
async def reply_letter(
    letter_id: str,
    reply: LetterReply,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["mentor", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.letters.update_one(
        {"id": letter_id},
        {"$set": {
            "mentor_response": reply.response,
            "status": reply.status
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Letter not found")
        
    return {"message": "Reply submitted"}

# --- Sports ---
@router.post("/sports", response_model=SportsActivity)
async def add_sports(
    sport: SportsCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can add sports activities")

    new_sport = SportsActivity(
        student_id=current_user["id"],
        **sport.dict()
    )
    
    sport_data = new_sport.dict()
    sport_data["created_at"] = sport_data["created_at"].isoformat()
    
    await db.sports.insert_one(sport_data)
    if "_id" in sport_data: del sport_data["_id"]
    return sport_data

@router.get("/sports/{student_id}", response_model=List[SportsActivity])
async def get_sports(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    sports = await db.sports.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return sports

# --- Cultural ---
@router.post("/cultural", response_model=CulturalActivity)
async def add_cultural(
    activity: CulturalCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can add cultural activities")

    new_activity = CulturalActivity(
        student_id=current_user["id"],
        **activity.dict()
    )
    
    act_data = new_activity.dict()
    act_data["created_at"] = act_data["created_at"].isoformat()
    
    await db.cultural.insert_one(act_data)
    if "_id" in act_data: del act_data["_id"]
    return act_data

@router.get("/cultural/{student_id}", response_model=List[CulturalActivity])
async def get_cultural(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    acts = await db.cultural.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return acts


# --- Placement Prediction (Phase 1: Rule Based) ---
@router.get("/analysis/{student_id}", response_model=PlacementPrediction)
async def get_placement_analysis(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "student" and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return await calculate_student_analysis(student_id)

@router.get("/analysis/batch/all")
async def get_all_students_analysis(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Get all students
    students = await db.users.find({"role": "student"}).to_list(1000)
    
    results = []
    for s in students:
        # Re-using the logic manually or calling a helper function would be better.
        # calling the endpoint function directly is tricky due to dependency injection.
        # I'll just clone the simple logic here for speed, or refactor to a helper.
        # Refactoring to helper is safer.
        analysis = await calculate_student_analysis(s["id"])
        
        # Add student details to the response
        res_dict = analysis.dict()
        res_dict["student_name"] = s.get("full_name", "Unknown")
        res_dict["usn"] = s.get("usn", "Unknown")
        res_dict["department"] = s.get("department", "Unknown")
        results.append(res_dict)
        
    return results

async def calculate_student_analysis(student_id: str) -> PlacementPrediction:
    # 1. Attendance
    att_records = await db.attendance.find({"student_id": student_id}).to_list(1000)
    total_classes = len(att_records)
    present_classes = sum(1 for r in att_records if r["status"] == "present")
    att_pct = (present_classes / total_classes * 100) if total_classes > 0 else 0
    
    # 2. Marks
    marks_records = await db.marks.find({"student_id": student_id}).to_list(1000)
    total_marks_pct = 0
    valid_marks_count = 0
    for m in marks_records:
        if m.get("max_marks", 0) > 0:
            total_marks_pct += (m["marks_obtained"] / m["max_marks"] * 100)
            valid_marks_count += 1
    avg_marks = (total_marks_pct / valid_marks_count) if valid_marks_count > 0 else 0
    
    # 3. Portfolio Counts
    cert_count = await db.certifications.count_documents({"student_id": student_id})
    project_count = await db.projects.count_documents({"student_id": student_id})
    sports_count = await db.sports.count_documents({"student_id": student_id})
    cultural_count = await db.cultural.count_documents({"student_id": student_id})
    
    # --- Prediction Logic (Rule Based) ---
    eligibility = "Not Eligible"
    risk_factors = []
    improvement_areas = []
    prob = 30.0 
    
    if att_pct >= 75: prob += 20
    elif att_pct < 60:
        risk_factors.append("Critical Low Attendance")
        improvement_areas.append("Improve Attendance")
    else: improvement_areas.append("Improve Attendance")
        
    if avg_marks >= 60: prob += 20
    elif avg_marks < 50:
        risk_factors.append("Low Academic Performance")
        improvement_areas.append("Focus on Academics")
        
    if cert_count > 0: prob += 10
    else: improvement_areas.append("Get Certified")
        
    if project_count > 0: prob += 15
    else: improvement_areas.append("Do Projects")
        
    if sports_count > 0 or cultural_count > 0: prob += 5
        
    prob = min(prob, 99.9)
    if att_pct >= 60 and avg_marks >= 50 and (cert_count > 0 or project_count > 0):
        eligibility = "Eligible"
    else: eligibility = "Not Eligible / At Risk"

    s_att = min(att_pct, 100)
    s_marks = min(avg_marks, 100)
    s_certs = min(cert_count * 25, 100)
    s_proj = min(project_count * 30, 100)
    s_act = min((sports_count + cultural_count) * 20, 100)
    
    composite = (s_att * 0.20) + (s_marks * 0.25) + (s_certs * 0.15) + (s_proj * 0.15) + (s_act * 0.10) + 15
    composite = min(composite, 100)

    return PlacementPrediction(
        student_id=student_id,
        eligibility_status=eligibility,
        placement_probability=round(prob, 1),
        predicted_role="Software Engineer" if prob > 80 else "Trainee",
        risk_factors=risk_factors,
        improvement_areas=improvement_areas,
        composite_score=round(composite, 1)
    )
