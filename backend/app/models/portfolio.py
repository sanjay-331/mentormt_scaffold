from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
from datetime import datetime, timezone
import uuid

# --- Certifications ---
class StudentCertification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    certificate_name: str
    platform: str # Coursera, Udemy, etc.
    completion_date: str
    skill_category: str # Cloud, AI, Web, etc.
    proof_url: Optional[str] = None
    is_verified: bool = False
    verified_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CertificationCreate(BaseModel):
    certificate_name: str
    platform: str
    completion_date: str
    skill_category: str
    proof_url: Optional[str] = None

# --- Student Projects ---
class StudentProject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    title: str
    description: str
    tech_stack: List[str]
    role: str # Team Lead, Developer, etc.
    project_link: Optional[str] = None # GitHub/Demo
    project_type: str # Mini, Major, Hackathon, Personal
    mentor_score: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str
    tech_stack: List[str]
    role: str
    project_link: Optional[str] = None
    project_type: str

# --- Apology / Improvement Letters ---
class StudentLetter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    letter_type: str # Apology, Improvement, Explanation
    reason: str
    content: str
    submitted_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    mentor_response: Optional[str] = None
    status: str = "pending" # pending, accepted, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LetterCreate(BaseModel):
    letter_type: str
    reason: str
    content: str

# --- Sports Activity ---
class SportsActivity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    sport_name: str
    level: str # College, District, State, National
    role: Optional[str] = None # Captain, Player
    achievements: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SportsCreate(BaseModel):
    sport_name: str
    level: str
    role: Optional[str] = None
    achievements: Optional[str] = None

# --- Cultural Activity ---
class CulturalActivity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    activity_name: str
    activity_type: str # Dance, Music, Drama, etc.
    role: Optional[str] = None # Organizer, Participant
    achievements: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CulturalCreate(BaseModel):
    activity_name: str
    activity_type: str
    role: Optional[str] = None
    achievements: Optional[str] = None

# --- Placement Prediction & Stats ---
class PlacementPrediction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_id: str
    eligibility_status: str # Eligible, Not Eligible, At Risk
    placement_probability: float # 0-100
    predicted_role: Optional[str] = None
    risk_factors: List[str] = []
    improvement_areas: List[str] = []
    composite_score: float = 0.0
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
