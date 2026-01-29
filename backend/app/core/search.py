from app.db import db
from typing import List, Dict, Any
import re

async def global_search(query: str, current_role: str) -> Dict[str, List[Any]]:
    """
    Searches across Users and Circulars.
    """
    if not query:
        return {"users": [], "circulars": []}
        
    regex_query = {"$regex": query, "$options": "i"}
    
    # 1. Search Users (Name, Email, USN)
    # Only Admin/Mentors can see strict details, but for general search:
    # Students can find mentors.
    # Mentors can find students.
    
    user_search_criteria = [
        {"full_name": regex_query},
        {"email": regex_query}
    ]
    if current_role in ["admin", "mentor"]:
        user_search_criteria.append({"usn": regex_query})
        
    users = await db.users.find(
        {"$or": user_search_criteria},
        {"full_name": 1, "email": 1, "role": 1, "usn": 1, "department": 1, "_id": 0}
    ).limit(20).to_list(20)
    
    # Filter visible users based on role?
    # For now, transparency: everyone can see everyone basic info.
    
    # 2. Search Circulars (Title, Content)
    circular_criteria = {
        "$or": [
            {"title": regex_query},
            {"content": regex_query}
        ]
    } 
    
    # Apply Audience Filter
    # If student, only see 'all' or 'students'
    if current_role == "student":
        circular_criteria["$and"] = [
            {"$or": [{"target_audience": "all"}, {"target_audience": "students"}]}
        ]
    elif current_role == "mentor":
        circular_criteria["$and"] = [
            {"$or": [{"target_audience": "all"}, {"target_audience": "mentors"}]}
        ]
        
    circulars = await db.circulars.find(
        circular_criteria,
        {"title": 1, "created_at": 1, "target_audience": 1, "_id": 0}
    ).limit(10).to_list(10)
    
    return {
        "users": users,
        "circulars": circulars
    }
