from app.db import db
from typing import List, Dict, Any

async def recommend_mentors(student_id: str) -> List[Dict[str, Any]]:
    """
    Recommends mentors for a student.
    Logic:
    1. Match Department.
    2. Sort by lowest workload (number of assigned students).
    """
    student = await db.users.find_one({"id": student_id}, {"department": 1})
    if not student:
        return []
        
    dept = student.get("department")
    
    # Find mentors in same department
    query = {"role": "mentor"}
    if dept:
        query["department"] = dept
        
    mentors = await db.users.find(query, {"id": 1, "full_name": 1, "email": 1, "department": 1, "_id": 0}).to_list(1000)
    
    if not mentors:
        # Fallback: find any mentor if no dept match
        mentors = await db.users.find({"role": "mentor"}, {"id": 1, "full_name": 1, "email": 1, "department": 1, "_id": 0}).to_list(1000)
        
    # Calculate Workload
    # Fetch all assignments
    assignments = await db.assignments.find({}, {"mentor_id": 1, "student_ids": 1}).to_list(10000)
    
    workload_map = {m["id"]: 0 for m in mentors} # Initialize with 0
    
    for a in assignments:
        mid = a["mentor_id"]
        if mid in workload_map:
            workload_map[mid] = len(a.get("student_ids", []))
            
    # Decorate mentors with workload
    scored_mentors = []
    for m in mentors:
        load = workload_map.get(m["id"], 0)
        m["current_load"] = load
        scored_mentors.append(m)
        
    # Sort: Ascending load
    scored_mentors.sort(key=lambda x: x["current_load"])
    
    # Return top 5
    return scored_mentors[:5]
