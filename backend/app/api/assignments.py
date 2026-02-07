from fastapi import APIRouter, Depends, HTTPException
from app.db import db
from app.core.auth import get_current_user
from app.core.audit import log_action
from app.models.user import MentorAssignment, AssignmentPayload
from datetime import datetime, timezone

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

@router.post("")
async def create_assignment(
    payload: AssignmentPayload,
    current_user: dict = Depends(get_current_user),
):
    """
    Creates or updates a mentor assignment (Admin only).
    Ensures that a student is assigned to ONLY ONE mentor at a time.
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    mentor_id = payload.mentor_id
    student_ids = payload.student_ids

    # 1. Enforce Uniqueness: Remove these students from ANY existing assignments (for other mentors)
    # We do this for all students in the new list.
    if student_ids:
        await db.assignments.update_many(
            {"student_ids": {"$in": student_ids}, "mentor_id": {"$ne": mentor_id}},
            {"$pull": {"student_ids": {"$in": student_ids}}}
        )

    # 2. Update/Upsert the assignment for the target mentor
    # We replace the list entirely effectively (like the previous logic), 
    # or we can use upsert. The previous logic verified "Set students for mentor".
    
    # Check if assignment exists
    existing = await db.assignments.find_one({"mentor_id": mentor_id})
    
    if existing:
        await db.assignments.update_one(
            {"mentor_id": mentor_id},
            {"$set": {"student_ids": student_ids, "updated_at": datetime.now(timezone.utc)}}
        )
        assignment_data = {**existing, "student_ids": student_ids}
    else:
        assignment = MentorAssignment(mentor_id=mentor_id, student_ids=student_ids)
        assignment_data = assignment.model_dump()
        assignment_data["created_at"] = assignment_data["created_at"].isoformat()
        res = await db.assignments.insert_one(assignment_data)
        assignment_data["mongo_id"] = str(res.inserted_id)
        if "_id" in assignment_data:
            del assignment_data["_id"]

    # 3. Cleanup: Remove any assignments that are now empty (optional, but good for hygiene)
    await db.assignments.delete_many({"student_ids": {"$size": 0}})

    await log_action(current_user["id"], "CREATE", "assignment", {"mentor_id": mentor_id, "student_count": len(student_ids)})

    return assignment_data

@router.get("/mentor/{mentor_id}")
async def get_mentor_students(
    mentor_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets all students assigned to a specific mentor."""
    assignment = await db.assignments.find_one({"mentor_id": mentor_id}, {"_id": 0})
    if not assignment:
        return {"students": []}

    students = await db.users.find(
        {"id": {"$in": assignment["student_ids"]}, "role": "student"},
        {"_id": 0, "password_hash": 0},
    ).to_list(100)

    return {"students": students}

@router.get("/student/{student_id}")
async def get_student_mentor(
    student_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets the mentor assigned to a specific student."""
    assignment = await db.assignments.find_one({"student_ids": student_id}, {"_id": 0})

    if not assignment:
        return {"mentor": None}

    mentor = await db.users.find_one(
        {"id": assignment["mentor_id"]}, {"_id": 0, "password_hash": 0}
    )

    return {"mentor": mentor}

@router.get("/mapping")
async def get_assignment_mapping(current_user: dict = Depends(get_current_user)):
    """
    Returns a mapping of all students who are currently assigned to a mentor.
    Format: { student_id: { mentor_id: str, mentor_name: str } }
    """
    if current_user["role"] not in ["admin", "mentor"]:
         raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch all assignments
    assignments = await db.assignments.find({}, {"_id": 0}).to_list(1000)
    
    mapping = {}
    
    # We need mentor names, so let's fetch all mentors or just the ones needed. 
    # Valid optimization: fetch all mentors in one go.
    mentor_ids = list(set(a["mentor_id"] for a in assignments))
    mentors = await db.users.find(
        {"id": {"$in": mentor_ids}}, 
        {"id": 1, "full_name": 1, "_id": 0}
    ).to_list(1000)
    
    mentor_map = {m["id"]: m["full_name"] for m in mentors}

    for a in assignments:
        m_id = a["mentor_id"]
        m_name = mentor_map.get(m_id, "Unknown Mentor")
        for s_id in a["student_ids"]:
            mapping[s_id] = {
                "mentor_id": m_id,
                "mentor_name": m_name
            }
            
    return mapping
