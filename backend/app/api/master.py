from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.core.master_data import get_branches, get_departments, get_subjects

router = APIRouter(prefix="/api/master", tags=["master-data"])

@router.get("/branches")
def api_get_branches():
    """Get list of all supported branches (Degree Programs) grouped by Category."""
    return get_branches()

@router.get("/departments")
def api_get_departments(branch: str = Query(..., description="Branch/Degree Name (e.g., B.Tech)")):
    """Get departments for a specific branch."""
    depts = get_departments(branch)
    # Return empty list is fine, frontend handles it
    return depts

@router.get("/subjects")
def api_get_subjects(
    branch: str = Query(..., description="Branch Name"),
    department: str = Query(..., description="Department Name")
):
    """
    Get subjects for a specific Branch + Department combination.
    """
    subjects = get_subjects(branch, department)
    return subjects
