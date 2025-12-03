
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = 'mentee'  # or 'mentor' or 'admin'

class UserInDB(BaseModel):
    id: str = Field(..., alias='_id')
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    role: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        orm_mode = True

class UserOut(BaseModel):
    id: str = Field(..., alias='_id')
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = None

    class Config:
        allow_population_by_field_name = True

