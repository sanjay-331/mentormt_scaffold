from fastapi import APIRouter, Depends
from typing import List
from app.db import db
from app.core.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])

class CalendarEvent(BaseModel):
    title: str
    date: str
    type: str # holiday, exam, event, deadline
    description: str = ""

@router.get("/events", response_model=List[CalendarEvent])
async def get_calendar_events(current_user: dict = Depends(get_current_user)):
    """Fetch upcoming academic events."""
    events = await db.calendar_events.find({}, {"_id": 0}).to_list(100)
    
    # If no events, provide some defaults for the demo
    if not events:
        events = [
            {"title": "Internal Assessment 1", "date": "2024-04-10", "type": "exam", "description": "First IA for all departments"},
            {"title": "Project Phase 1 Submission", "date": "2024-04-15", "type": "deadline", "description": "Final year project abstracts"},
            {"title": "College Fest - Revelations", "date": "2024-04-20", "type": "event", "description": "Annual cultural extravaganza"},
            {"title": "Labor Day", "date": "2024-05-01", "type": "holiday", "description": "General Holiday"},
        ]
        # Optionally insert them if you want persistence
        # await db.calendar_events.insert_many(events)
        
    return events
