from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from typing import Optional
from app.core.auth import get_current_user
from app.core.reports import (
    generate_attendance_report, 
    generate_marks_report, 
    generate_mentor_summary_report
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
