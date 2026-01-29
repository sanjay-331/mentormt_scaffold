from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid



class Notification(BaseModel):
    """Schema for user notifications."""

    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str = "info"  # info | warning | critical | success
    link: Optional[str] = None  # Frontend route to redirect to
    read: bool = False
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
