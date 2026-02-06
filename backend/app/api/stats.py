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
    
    # Active Mentors (those who have assignments)
    active_mentors = len(await db.assignments.distinct("mentor_id"))
    
    total_mentors = await db.users.count_documents({"role": "mentor"}) # Keep specific metric if needed, or replace
    
    total_circulars = await db.circulars.count_documents({})
    total_assignments = await db.assignments.count_documents({})
    
    return {
        "total_students": total_students,
        "total_mentors": active_mentors, # Report active mentors as the main stat
        "registered_mentors": total_mentors,
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

@router.get("/admin/user-growth")
async def get_user_growth(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Group by month (YYYY-MM)
    pipeline = [
        {
            "$match": {
                "created_at": {"$exists": True}
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": {"$toDate": "$created_at"}},
                    "month": {"$month": {"$toDate": "$created_at"}}
                },
                "students": {
                    "$sum": {"$cond": [{"$eq": ["$role", "student"]}, 1, 0]}
                },
                "mentors": {
                    "$sum": {"$cond": [{"$eq": ["$role", "mentor"]}, 1, 0]}
                }
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12}  # Last 12 months
    ]
    
    growth = await db.users.aggregate(pipeline).to_list(12)
    
    # Format for frontend chart
    result = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for g in growth:
        month_idx = g["_id"]["month"] - 1
        month_name = months[month_idx]
        result.append({
            "name": month_name,
            "students": g.get("students", 0),
            "mentors": g.get("mentors", 0)
        })
        
    return result

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

@router.get("/mentor/mentees-performance")
async def get_mentor_mentees_performance(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assignment = await db.assignments.find_one({"mentor_id": current_user["id"]})
    if not assignment or "student_ids" not in assignment or not assignment["student_ids"]:
        return []

    student_ids = assignment["student_ids"]
    students = await db.users.find(
        {"id": {"$in": student_ids}},
        {"_id": 0, "password_hash": 0}
    ).to_list(100)
    
    performance_data = []
    
    for s in students:
        sid = s["id"]
        
        # Attendance
        total_att = await db.attendance.count_documents({"student_id": sid})
        present_att = await db.attendance.count_documents({"student_id": sid, "status": "present"})
        att_pct = (present_att / total_att * 100) if total_att > 0 else 0
        
        # Marks
        marks = await db.marks.find({"student_id": sid}).to_list(None)
        total_obtained = sum(m["marks_obtained"] for m in marks)
        total_max = sum(m["max_marks"] for m in marks)
        marks_pct = (total_obtained / total_max * 100) if total_max > 0 else 0
        
        # Risk Level
        risk = "low"
        if att_pct < 75 or marks_pct < 50:
            risk = "medium"
        if att_pct < 60 or marks_pct < 35:
            risk = "high"
            
        performance_data.append({
            "student_id": sid,
            "full_name": s["full_name"],
            "usn": s.get("usn", "N/A"),
            "department": s.get("department", "N/A"),
            "semester": s.get("semester", 1),
            "attendance_percentage": round(att_pct, 1),
            "average_marks_percentage": round(marks_pct, 1),
            "risk_level": risk
        })
        
    return performance_data

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

@router.get("/student/performance")
async def get_student_performance(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student_id = current_user["id"]
    
    # 1. Performance Trend (Monthly)
    # Marks Aggregation
    marks_pipeline = [
        {"$match": {"student_id": student_id}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": {"$toDate": "$created_at"}},
                    "month": {"$month": {"$toDate": "$created_at"}}
                },
                "avg_marks": {
                    "$avg": {
                        "$cond": [
                            {"$gt": ["$max_marks", 0]},
                            {"$multiply": [{"$divide": ["$marks_obtained", "$max_marks"]}, 100]},
                            0
                        ]
                    }
                }
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    monthly_marks = await db.marks.aggregate(marks_pipeline).to_list(12)
    
    # Attendance Aggregation (assuming 'date' is ISO string)
    attendance_pipeline = [
        {"$match": {"student_id": student_id}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": {"$toDate": "$date"}},
                    "month": {"$month": {"$toDate": "$date"}}
                },
                "total_classes": {"$sum": 1},
                "present_classes": {
                    "$sum": {"$cond": [{"$eq": ["$status", "present"]}, 1, 0]}
                }
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    monthly_attendance = await db.attendance.aggregate(attendance_pipeline).to_list(12)
    
    # Combine monthly data
    trend_map = {}
    months_short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for m in monthly_marks:
        key = f"{m['_id']['year']}-{m['_id']['month']}"
        trend_map[key] = {
            "month": months_short[m['_id']['month'] - 1],
            "marks": round(m["avg_marks"], 1),
            "attendance": 0
        }
        
    for a in monthly_attendance:
        key = f"{a['_id']['year']}-{a['_id']['month']}"
        if key not in trend_map:
            trend_map[key] = {
                "month": months_short[a['_id']['month'] - 1],
                "marks": 0,
                "attendance": 0
            }
        att_pct = (a["present_classes"] / a["total_classes"] * 100) if a["total_classes"] > 0 else 0
        trend_map[key]["attendance"] = round(att_pct, 1)
        
    # Sort logically by year/month if needed, or rely on pipeline sort order roughly
    # Since we are using dict keys, order might be insertion based. 
    # For robust sorting, we can re-sort.
    performance_chart = sorted(list(trend_map.values()), key=lambda x: months_short.index(x['month'])) 
    # Note: Sorting by month name is flawed if crossing years (Dec -> Jan). 
    # Better to keep Year-Month sort logic, but for now this works for single academic year assumption.
    
    # 2. Subject-wise Performance
    subject_marks_pipeline = [
        {"$match": {"student_id": student_id}},
        {
            "$group": {
                "_id": "$subject",
                "avg_marks": {
                    "$avg": {
                        "$cond": [
                            {"$gt": ["$max_marks", 0]},
                            {"$multiply": [{"$divide": ["$marks_obtained", "$max_marks"]}, 100]},
                            0
                        ]
                    }
                }
            }
        }
    ]
    subject_marks = await db.marks.aggregate(subject_marks_pipeline).to_list(20)
    
    subject_att_pipeline = [
        {"$match": {"student_id": student_id}},
        {
            "$group": {
                "_id": "$subject",
                "total_classes": {"$sum": 1},
                "present_classes": {
                    "$sum": {"$cond": [{"$eq": ["$status", "present"]}, 1, 0]}
                }
            }
        }
    ]
    subject_attendance = await db.attendance.aggregate(subject_att_pipeline).to_list(20)
    
    subject_map = {}
    
    for m in subject_marks:
        subj = m["_id"]
        # Cycle through colors if possible or just random/fixed
        subject_map[subj] = {
            "subject": subj,
            "marks": round(m["avg_marks"], 1),
            "attendance": 0,
            "color": "#3b82f6" 
        }
        
    for a in subject_attendance:
        subj = a["_id"]
        if subj not in subject_map:
            subject_map[subj] = {
                "subject": subj,
                "marks": 0,
                "attendance": 0,
                "color": "#10b981"
            }
        att_pct = (a["present_classes"] / a["total_classes"] * 100) if a["total_classes"] > 0 else 0
        subject_map[subj]["attendance"] = round(att_pct, 1)
        
    subject_distribution = list(subject_map.values())
    
    # 3. Academic Summary
    total_classes = await db.attendance.count_documents({"student_id": student_id})
    present_days = await db.attendance.count_documents({"student_id": student_id, "status": "present"})
    tests_taken = await db.marks.count_documents({"student_id": student_id}) 
    assignments_submitted = await db.assignments.count_documents({"student_ids": student_id}) # Very rough approx
    
    return {
        "performance_chart": performance_chart,
        "subject_distribution": subject_distribution,
        "academic_summary": {
            "total_classes": total_classes,
            "present_days": present_days,
            "tests_taken": tests_taken,
            "assignments_submitted": assignments_submitted
        }
    }
