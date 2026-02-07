import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class Subject(BaseModel):
    """
    Database model for Academic Subjects.
    Manages subjects per department and semester.
    """
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # e.g. "CS401"
    name: str  # e.g. "Database Management Systems"
    
    # Context
    department: str # e.g. "Computer Science"
    semester: int   # e.g. 5
    
    # Metadata
    academic_year: Optional[str] = None # e.g. "2023-2024"
    credits: int = Field(default=3)
    
    # Audit
    created_by: str # Mentor ID (User ID)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
