# backend/app/schemas/item.py
from pydantic import BaseModel, Field
from typing import Optional

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ItemOut(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
