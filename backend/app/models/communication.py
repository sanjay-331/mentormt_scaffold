import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class Message(BaseModel):
    """Schema for chat messages."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Circular(BaseModel):
    """Schema for college circulars/notices."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    title: str
    content: str
    file_url: Optional[str] = None
    target_audience: str  # all, students, mentors, specific
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CircularCreate(BaseModel):
    title: str
    content: str
    target_audience: str  # all, students, mentors, specific
