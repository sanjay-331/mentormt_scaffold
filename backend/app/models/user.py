import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- User Models ---

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    role: str  # admin, mentor, student

class UserCreate(UserBase):
    """Schema for user registration."""
    password: str
    college: Optional[str] = None
    branch: Optional[str] = None  # NEW
    department: Optional[str] = None
    semester: Optional[int] = None
    usn: Optional[str] = None

class User(UserBase):
    """Database schema for a User."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    phone: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None # NEW
    department: Optional[str] = None
    semester: Optional[int] = None
    usn: Optional[str] = None  # For students
    employee_id: Optional[str] = None  # For mentors
    settings: Dict[str, Any] = Field(default_factory=dict)
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[datetime] = None

class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    """Schema for reset password request."""
    token: str
    new_password: str

class Token(BaseModel):
    """Schema for the returned JWT token."""
    access_token: str
    token_type: str
    user: Dict[str, Any]

# --- Assignment Models ---

class MentorAssignment(BaseModel):
    """Schema for mentor-student assignment records."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_id: str
    student_ids: List[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AssignmentPayload(BaseModel):
    mentor_id: str
    student_ids: List[str]

# --- Feedback & Rating Models ---

class FeedbackCreate(BaseModel):
    student_id: str
    feedback_text: str

class Feedback(BaseModel):
    """Schema for mentor feedback on students."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_id: str
    student_id: str
    feedback_text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Rating(BaseModel):
    """Schema for student performance ratings."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    mentor_id: str
    attendance_rating: float
    marks_rating: float
    overall_rating: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
