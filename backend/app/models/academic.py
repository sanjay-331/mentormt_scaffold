import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class AttendanceCreate(BaseModel):
    student_id: str
    subject: str
    date: str
    status: str  # present, absent, leave

class AttendanceRecord(BaseModel):
    """Schema for an individual attendance record."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    subject: str
    date: str
    status: str  # present, absent, leave
    recorded_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarksRecord(BaseModel):
    """Schema for an individual marks record."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    subject: str
    semester: int
    marks_type: str  # IA1, IA2, IA3, Assignment, VTU
    marks_obtained: float
    max_marks: float
    recorded_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MarksCreate(BaseModel):
    """Payload schema for creating marks from API."""
    student_id: str
    subject: str
    semester: int
    marks_type: str  # IA1, IA2, IA3, Assignment, VTU
    marks_obtained: float
    max_marks: float
