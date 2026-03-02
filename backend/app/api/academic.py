from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import List, Optional
import io
import pandas as pd
from app.db import db
from app.core.auth import get_current_user
from app.core.notifications import check_academic_risk
from app.core.audit import log_action
from app.models.academic import AttendanceCreate, AttendanceRecord, MarksCreate, MarksRecord

router = APIRouter(prefix="/api", tags=["Academic"])

# --- Attendance Routes ---

@router.post("/attendance")
async def create_attendance(
    payload: AttendanceCreate,
    current_user: dict = Depends(get_current_user),
):
    """Creates a single attendance record (Admin or Mentor)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    record = AttendanceRecord(
        student_id=payload.student_id,
        subject=payload.subject,
        date=payload.date,
        status=payload.status,
        recorded_by=current_user["id"],
    )

    record_data = record.model_dump()
    record_data["created_at"] = record_data["created_at"].isoformat()

    result = await db.attendance.insert_one(record_data)

    record_data["mongo_id"] = str(result.inserted_id)
    record_data.pop("_id", None)

    await check_academic_risk(str(payload.student_id))
    await log_action(current_user["id"], "CREATE", "attendance", {
        "student_id": payload.student_id, 
        "subject": payload.subject, 
        "status": payload.status
    })

    return record_data

@router.post("/attendance/upload")
async def upload_attendance(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
):
    """Uploads attendance records from a CSV or Excel file."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    contents = await file.read()
    df = (
        pd.read_csv(io.BytesIO(contents))
        if file.filename.endswith(".csv")
        else pd.read_excel(io.BytesIO(contents))
    )

    records = []
    for _, row in df.iterrows():
        student = await db.users.find_one(
            {"usn": row["student_usn"], "role": "student"}, {"_id": 0}
        )
        if student:
            record = AttendanceRecord(
                student_id=student["id"],
                subject=row["subject"],
                date=str(row["date"]),
                status=row["status"],
                recorded_by=current_user["id"],
            )
            record_data = record.model_dump()
            record_data["created_at"] = record_data["created_at"].isoformat()
            records.append(record_data)

    if records:
        await db.attendance.insert_many(records)
        unique_students = set(r["student_id"] for r in records)
        for sid in unique_students:
            await check_academic_risk(str(sid))
            
    await log_action(current_user["id"], "UPLOAD", "attendance", {"count": len(records)})

    return {"message": f"Uploaded {len(records)} attendance records"}

@router.get("/attendance/student/{student_id}")
async def get_student_attendance(
    student_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets all attendance records for a specific student."""
    records = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return records

# --- Marks Routes ---

@router.post("/marks")
async def create_marks(
    payload: MarksCreate,
    current_user: dict = Depends(get_current_user),
):
    """Creates a single marks record (Admin or Mentor)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    record = MarksRecord(
        student_id=payload.student_id,
        subject=payload.subject,
        semester=payload.semester,
        marks_type=payload.marks_type,
        marks_obtained=payload.marks_obtained,
        max_marks=payload.max_marks,
        recorded_by=current_user["id"],
    )

    record_data = record.model_dump()
    record_data["created_at"] = record_data["created_at"].isoformat()

    result = await db.marks.insert_one(record_data)

    record_data["mongo_id"] = str(result.inserted_id)
    record_data.pop("_id", None)

    await check_academic_risk(str(payload.student_id))
    await log_action(current_user["id"], "CREATE", "marks", {
        "student_id": payload.student_id, 
        "subject": payload.subject, 
        "marks_type": payload.marks_type
    })

    return record_data

@router.post("/marks/upload")
async def upload_marks(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Uploads marks records from a CSV or Excel file."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    contents = await file.read()
    df = (
        pd.read_csv(io.BytesIO(contents))
        if file.filename.endswith(".csv")
        else pd.read_excel(io.BytesIO(contents))
    )

    records: List[dict] = []
    for _, row in df.iterrows():
        student = await db.users.find_one(
            {"usn": row["student_usn"], "role": "student"}, {"_id": 0}
        )
        if student:
            record = MarksRecord(
                student_id=student["id"],
                subject=row["subject"],
                semester=int(row["semester"]),
                marks_type=row["marks_type"],
                marks_obtained=float(row["marks_obtained"]),
                max_marks=float(row["max_marks"]),
                recorded_by=current_user["id"],
            )
            record_data = record.model_dump()
            record_data["created_at"] = record_data["created_at"].isoformat()
            records.append(record_data)

    if records:
        await db.marks.insert_many(records)
        unique_students = set(r["student_id"] for r in records)
        for sid in unique_students:
            await check_academic_risk(str(sid))
            
    await log_action(current_user["id"], "UPLOAD", "marks", {"count": len(records)})

    return {"message": f"Uploaded {len(records)} marks records"}

@router.get("/marks/student/{student_id}")
async def get_student_marks(
    student_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets all marks records for a specific student."""
    records = await db.marks.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return records
