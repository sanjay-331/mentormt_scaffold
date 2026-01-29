from datetime import datetime, timezone
import statistics
from typing import List, Dict, Any
from app.db import db

async def get_system_risk_distribution() -> Dict[str, int]:
    """
    Calculates the count of students in each risk category (High, Medium, Low).
    This iterates over all students (expensive for large datasets, okay for MVP).
    """
    students = await db.users.find({"role": "student"}, {"id": 1}).to_list(10000)
    
    risk_counts = {"high": 0, "medium": 0, "low": 0}
    
    # Pre-fetch all data to minimize queries (optimization)
    all_attendance = await db.attendance.find({}, {"student_id": 1, "status": 1, "_id": 0}).to_list(100000)
    all_marks = await db.marks.find({}, {"student_id": 1, "marks_obtained": 1, "max_marks": 1, "_id": 0}).to_list(100000)
    
    # Process in memory
    att_map = {} # student_id -> {present: 0, total: 0}
    for r in all_attendance:
        sid = r["student_id"]
        if sid not in att_map: att_map[sid] = {"present": 0, "total": 0}
        att_map[sid]["total"] += 1
        if r["status"] == "present":
            att_map[sid]["present"] += 1
            
    marks_map = {} # student_id -> {sum_pct: 0, count: 0}
    for r in all_marks:
        sid = r["student_id"]
        if r.get("max_marks", 0) <= 0: continue
        pct = (r["marks_obtained"] / r["max_marks"]) * 100
        if sid not in marks_map: marks_map[sid] = {"sum_pct": 0, "count": 0}
        marks_map[sid]["sum_pct"] += pct
        marks_map[sid]["count"] += 1
        
    for s in students:
        sid = s["id"]
        
        # Risk Logic (Duplicated from notifications/server for now to keep independent)
        # Attendance Risk
        att = att_map.get(sid, {"present": 0, "total": 0})
        att_pct = (att["present"] / att["total"] * 100) if att["total"] > 0 else 100
        
        # Marks Risk
        mk = marks_map.get(sid, {"sum_pct": 0, "count": 0})
        marks_pct = (mk["sum_pct"] / mk["count"]) if mk["count"] > 0 else 100 # Assume good if no marks
        
        if att_pct < 60 or marks_pct < 40:
            risk_counts["high"] += 1
        elif att_pct < 75 or marks_pct < 50:
            risk_counts["medium"] += 1
        else:
            risk_counts["low"] += 1
            
    return risk_counts

async def get_department_performance() -> List[Dict[str, Any]]:
    """
    Returns average marks percentage per department.
    """
    students = await db.users.find({"role": "student"}, {"id": 1, "department": 1}).to_list(10000)
    
    # Map student to department
    student_dept = {s["id"]: s.get("department", "Unknown") for s in students}
    
    all_marks = await db.marks.find({}, {"student_id": 1, "marks_obtained": 1, "max_marks": 1, "_id": 0}).to_list(100000)
    
    dept_stats = {} # dept -> {sum_pct: 0, count: 0}
    
    for r in all_marks:
        sid = r["student_id"]
        dept = student_dept.get(sid)
        if not dept: continue
        
        if r.get("max_marks", 0) <= 0: continue
        pct = (r["marks_obtained"] / r["max_marks"]) * 100
        
        if dept not in dept_stats: dept_stats[dept] = {"sum_pct": 0, "count": 0}
        dept_stats[dept]["sum_pct"] += pct
        dept_stats[dept]["count"] += 1
        
    results = []
    for dept, stats in dept_stats.items():
        avg = stats["sum_pct"] / stats["count"] if stats["count"] > 0 else 0
        results.append({"department": dept, "average_performance": round(avg, 2)})
        
    return sorted(results, key=lambda x: x["average_performance"], reverse=True)

async def predict_student_outcome(student_id: str) -> Dict[str, Any]:
    """
    Predicts final outcome based on current marks trajectory.
    Uses simple linear extrapolation or average.
    """
    marks = await db.marks.find(
        {"student_id": student_id}, 
        {"marks_obtained": 1, "max_marks": 1, "marks_type": 1, "_id": 0}
    ).to_list(1000)
    
    if not marks:
        return {"prediction": "Insufficient Data", "confidence": "Low", "projected_score": 0}
        
    # Calculate percentage for each record
    pcts = []
    for m in marks:
        if m.get("max_marks", 0) > 0:
            pcts.append((m["marks_obtained"] / m["max_marks"]) * 100)
            
    if not pcts:
        return {"prediction": "Insufficient Data", "confidence": "Low", "projected_score": 0}

    current_avg = statistics.mean(pcts)
    
    # Simple Heuristic Prediction
    if current_avg >= 85:
        prediction = "Outstanding (Distinction)"
    elif current_avg >= 70:
        prediction = "Good (First Class)"
    elif current_avg >= 60:
        prediction = "Average (Second Class)"
    elif current_avg >= 40:
        prediction = "At Risk of Failure"
    else:
        prediction = "High Chance of Failure"
        
    # Trend (if we had dates, we could do better. For now, just randomness check)
    # If standard deviation is high, confidence is low
    confidence = "High"
    if len(pcts) > 2 and statistics.stdev(pcts) > 15:
        confidence = "Medium"
        
    return {
        "prediction": prediction,
        "confidence": confidence,
        "projected_percentage": round(current_avg, 2)
    }
