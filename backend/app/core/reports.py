import io
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from app.db import db
from datetime import datetime

async def generate_attendance_report(format: str, student_id: str = None) -> bytes:
    """Generates attendance report in PDF or Excel."""
    query = {}
    if student_id:
        query["student_id"] = student_id
        
    records = await db.attendance.find(query, {"_id": 0}).to_list(10000)
    
    if not records:
        return b""
        
    df = pd.DataFrame(records)
    
    if format == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Attendance")
        return output.getvalue()
        
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        elements.append(Paragraph("Attendance Report", styles["Title"]))
        elements.append(Spacer(1, 12))
        
        # Table Data
        data = [df.columns.tolist()] + df.values.tolist()
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(table)
        doc.build(elements)
        return buffer.getvalue()
        
    return b""

async def generate_marks_report(format: str, student_id: str = None) -> bytes:
    """Generates marks report in PDF or Excel."""
    query = {}
    if student_id:
        query["student_id"] = student_id

    records = await db.marks.find(query, {"_id": 0}).to_list(10000)

    if not records:
        return b""

    df = pd.DataFrame(records)

    if format == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Marks")
        return output.getvalue()

    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        elements.append(Paragraph("Marks Report", styles["Title"]))
        elements.append(Spacer(1, 12))

        data = [df.columns.tolist()] + df.values.tolist()
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.blue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))

        elements.append(table)
        doc.build(elements)
        return buffer.getvalue()

    return b""

async def generate_mentor_summary_report(format: str, mentor_id: str) -> bytes:
    """Generates a summary report for a mentor's mentees."""
    # ... logic (fetch students, aggregations) ...
    # For MVP, let's just dump the list of assigned students
    assignment = await db.assignments.find_one({"mentor_id": mentor_id})
    if not assignment:
        return b""
        
    students = await db.users.find(
        {"id": {"$in": assignment["student_ids"]}}, 
        {"full_name": 1, "usn": 1, "department": 1, "_id": 0}
    ).to_list(1000)
    
    if not students:
        return b""
        
    df = pd.DataFrame(students)
    
    if format == "excel":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Mentees")
        return output.getvalue()
        
    elif format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        elements.append(Paragraph("Mentor Summary: Mentees List", styles["Title"]))
        elements.append(Spacer(1, 12))
        
        data = [df.columns.tolist()] + df.values.tolist()
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(table)
        doc.build(elements)
        return buffer.getvalue()
        
    return b""
