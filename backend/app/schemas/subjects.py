from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class SubjectBase(BaseModel):
    code: str
    name: str
    department: str
    semester: int
    academic_year: Optional[str] = None
    credits: int = 3

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None
    credits: Optional[int] = None

class SubjectResponse(SubjectBase):
    id: str
    created_by: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
