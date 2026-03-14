from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from typing import Optional
from app.core.auth import get_current_user
from app.core.reports import (
    generate_attendance_report, 
    generate_marks_report, 
    generate_mentor_summary_report,
    generate_transcript_report,
    generate_certificate_report
)

router = APIRouter(prefix="/api/reports", tags=["Reporting"])

@router.get("/attendance")
async def download_attendance(
    format: str,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Download attendance report (PDF/Excel)."""
    if current_user["role"] == "student":
        student_id = current_user["id"]
    elif current_user["role"] not in ["admin", "mentor"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    file_content = await generate_attendance_report(format, student_id)
    
    if not file_content:
        raise HTTPException(status_code=404, detail="No attendance data found")

    media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ext = "pdf" if format == "pdf" else "xlsx"
    filename = f"attendance_report_{datetime.now().strftime('%Y%m%d')}.{ext}" if format == "pdf" else f"attendance_report.{ext}"
    
    # Simple static filename for now
    filename = f"attendance_report.{ext}"

    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/marks")
async def download_marks(
    format: str,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Download marks report (PDF/Excel)."""
    if current_user["role"] == "student":
        student_id = current_user["id"]
    elif current_user["role"] not in ["admin", "mentor"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    file_content = await generate_marks_report(format, student_id)
    
    if not file_content:
        raise HTTPException(status_code=404, detail="No marks data found")

    media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ext = "pdf" if format == "pdf" else "xlsx"
    filename = f"marks_report.{ext}"

    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/mentor-summary")
async def download_mentor_summary(
    format: str,
    current_user: dict = Depends(get_current_user)
):
    """(Mentor) Download summary of assigned mentees."""
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    file_content = await generate_mentor_summary_report(format, current_user["id"])
    
    if not file_content:
        raise HTTPException(status_code=404, detail="No mentee data found")

    media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ext = "pdf" if format == "pdf" else "xlsx"
    filename = f"mentor_summary.{ext}"

    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/transcript")
async def download_transcript(
    format: str = "pdf",
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Download student transcript (marks report alias)."""
    if current_user["role"] == "student":
        student_id = current_user["id"]
         
    file_content = await generate_transcript_report(format, student_id)
    
    if not file_content:
        raise HTTPException(status_code=404, detail="No transcript data found")

    media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    filename = f"transcript.{format}"

    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/certificate")
async def download_certificate(
    format: str = "pdf",
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Download student completion certificate."""
    if current_user["role"] == "student":
        student_id = current_user["id"]
         
    file_content = await generate_certificate_report(format, student_id)
    
    if not file_content:
        raise HTTPException(status_code=404, detail="No certificate data found or bad format")

    return StreamingResponse(
        io.BytesIO(file_content),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=certificate.pdf"}
    )
