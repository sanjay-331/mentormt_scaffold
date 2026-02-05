"""
Backend API for the E-Mentoring System built with FastAPI and MongoDB.
Handles user authentication, data management, and socket communication.
"""
# --- Standard Library Imports ---
import io
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any

# --- Third-Party Imports ---
import pandas as pd
import socketio
from app.sio_instance import sio, connected_users
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi import Form
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.core.notifications import create_notification, create_broadcast_notification, check_academic_risk
from app.core.analytics import get_system_risk_distribution, get_department_performance, predict_student_outcome
from app.core.reports import generate_attendance_report, generate_marks_report, generate_mentor_summary_report
from app.core.search import global_search
from app.core.recommendations import recommend_mentors
from app.core.audit import log_action
from fastapi.responses import StreamingResponse
from app.api.portfolio import router as portfolio_router
from app.api.stats import router as stats_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Security
# Security & Auth
from app.core.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    security
)

app = FastAPI(title="Student Mentor-Mentee System")
app.include_router(portfolio_router)
app.include_router(stats_router)
socket_app = socketio.ASGIApp(sio, app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,https://mentormt-scaffold.vercel.app").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== Models ====================

from app.models.user import (
    UserBase, UserCreate, User, ForgotPasswordRequest, ResetPasswordRequest, Token,
    MentorAssignment, AssignmentPayload, Rating, Feedback, FeedbackCreate
)

from app.models.academic import (
    AttendanceCreate, AttendanceRecord, MarksRecord, MarksCreate
)


from app.models.communication import Message, Circular, CircularCreate


def remove_mongo_id(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# Auth functions moved to app.core.auth


# ==================== Socket.IO Events ====================

# connected_users is imported from app.sio_instance


@sio.event
async def connect(sid, _environ):  # Fix W0613 (unused-argument)
    """Handles new client connections."""
    logger.info("Client connected: %s", sid)  # Fix W1203 (logging-fstring)


@sio.event
async def disconnect(sid):
    """Handles client disconnections."""
    logger.info("Client disconnected: %s", sid)  # Fix W1203
    # Remove from connected users
    for user_id, user_sid in list(connected_users.items()):
        if user_sid == sid:
            del connected_users[user_id]
            break


@sio.event
async def authenticate(sid, data):
    """Authenticates a user for Socket.IO."""
    user_id = data.get("user_id")
    if user_id:
        connected_users[user_id] = sid
        logger.info(
            "User %s authenticated with sid %s", user_id, sid
        )  # Removed E501 comment fix


@sio.event
async def send_message(sid, data):
    """Handles sending a new chat message."""
    message_data = {
        "id": str(uuid.uuid4()),
        "sender_id": data["sender_id"],
        "receiver_id": data["receiver_id"],
        "content": data["content"],
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Save to database
    await db.messages.insert_one(message_data)

    # Emit to receiver if online
    receiver_sid = connected_users.get(data["receiver_id"])
    if receiver_sid:
        await sio.emit("new_message", message_data, room=receiver_sid)

    # Emit back to sender
    await sio.emit("message_sent", message_data, room=sid)


# ==================== API Routes ====================


@app.get("/api")
async def root():
    """Root route for the API."""
    return {"message": "Student Mentor-Mentee System API"}


# Auth Routes
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    """Registers a new user and returns a JWT token."""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user_dict = user.model_dump()
    password = user_dict.pop("password")
    user_obj = User(**user_dict)
    user_data = user_obj.model_dump()
    user_data["password_hash"] = get_password_hash(password)
    user_data["created_at"] = user_data["created_at"].isoformat()

    await db.users.insert_one(user_data)  # Fix F841 (removed 'result =')

    # Create token
    access_token = create_access_token(
        data={"sub": user_obj.id, "email": user_obj.email, "role": user_obj.role}
    )
    
    # Audit Log
    await log_action(user_obj.id, "REGISTER", "auth", ip_address="127.0.0.1") # Simplification for MVP
    
    user_response = {k: v for k, v in user_data.items() if k not in ["password_hash", "_id"]}
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}


# @app.post("/api/auth/login", response_model=Token)
# async def login(email: EmailStr, password: str):
#     """Logs in an existing user and returns a JWT token."""
#     user = await db.users.find_one({"email": email})
#     if not user or not verify_password(password, user["password_hash"]):
#         raise HTTPException(status_code=400, detail="Incorrect email or password")

#     access_token = create_access_token(data={"sub": user["id"]})
#     user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}

#     return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@app.post("/api/auth/login", response_model=Token)
async def login(email: EmailStr, password: str):
    """Logs in an existing user and returns a JWT token."""
    user = await db.users.find_one({"email": email})

    # If user not found OR no password_hash field -> treat as invalid credentials
    if not user or "password_hash" not in user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # Verify password
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # Create JWT token
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )
    
    # Audit Log
    await log_action(user["id"], "LOGIN", "auth", ip_address="127.0.0.1") # Simplification for MVP
    
    user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

    user_response = {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}


@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Initiates password reset process.
    MOCKS email sending by printing token to console.
    """
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal valid emails for security, or do (for MVP ok)
        # For now, we'll just return success to avoid enumeration, but log internally
        return {"message": "If the email is registered, a password reset link has been sent."}

    # Generate token
    reset_token = str(uuid.uuid4())
    # Expires in 1 hour
    expiry = datetime.now(timezone.utc) + timedelta(hours=1)

    await db.users.update_one(
        {"email": request.email},
        {"$set": {"reset_token": reset_token, "reset_token_expiry": expiry}}
    )

    # MOCK EMAIL SENDING
    print(f"============================================")
    print(f" PASSWORD RESET REQUEST FOR: {request.email}")
    print(f" TOKEN: {reset_token}")
    print(f" LINK: http://localhost:5173/reset-password?token={reset_token}")
    print(f"============================================")

    return {"message": "If the email is registered, a password reset link has been sent."}


@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Resets password using a valid token."""
    user = await db.users.find_one({"reset_token": request.token})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    # Check expiry
    # Ensure expiry is timezone-aware or comparable
    expiry = user.get("reset_token_expiry")
    if not expiry:
         raise HTTPException(status_code=400, detail="Invalid or expired token")
         
    # Handle DB datetime (might be naive if not carefully stored, but we used timezone.utc)
    # If using pymongo, it might return native datetime.
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Token expired")

    # Update password
    new_hash = get_password_hash(request.new_password)
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"password_hash": new_hash},
            "$unset": {"reset_token": "", "reset_token_expiry": ""}
        }
    )
    
    await log_action(user["id"], "RESET_PASSWORD", "auth", ip_address="127.0.0.1")

    return {"message": "Password has been reset successfully. You can now login."}


@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieves the details of the currently authenticated user."""
    return current_user


@app.get("/api/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user


@app.put("/api/users/me/settings")
async def update_user_settings(
    settings: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences (e.g. dark mode)."""
    updated_settings = current_user.get("settings", {})
    updated_settings.update(settings)
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"settings": updated_settings}}
    )
    
    await log_action(current_user["id"], "UPDATE", "settings", {"changes": settings})
    
    return {"message": "Settings updated", "settings": updated_settings}


# User Management Routes
@app.get("/api/users")
async def get_users(
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_user),  # E501 fix
):
    """Retrieves a list of users, optionally filtered by role."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = {"role": role} if role else {}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users


@app.get("/api/users/{user_id}")
async def get_user(
    user_id: str, current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Retrieves a user by ID."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/api/users/{user_id}")
async def update_user(
    user_id: str, updates: dict, current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Updates user details."""
    if current_user["role"] not in ["admin"] and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # --- Start of Robustness Fix ---
    # Filter out invalid or internal keys to prevent unwanted changes or errors
    updates.pop("password", None)
    updates.pop("password_hash", None)
    updates.pop("email", None)
    updates.pop("role", None)

    # Use a clean dictionary for MongoDB $set operation
    update_fields = {}

    # Safely iterate and clean up values.
    # Convert empty strings to None, and integers/floats if possible.
    for key, value in updates.items():
        if key in ["full_name", "phone", "department", "usn", "employee_id"]:
            # Treat empty strings as None to align with Optional[...] models and cleanup
            update_fields[key] = (
                value if value is not None and str(value).strip() != "" else None
            )
        elif key == "semester":
            # Attempt to convert semester to int, otherwise set to None
            try:
                if value is not None and str(value).strip() != "":
                    update_fields[key] = int(value)
                else:
                    update_fields[key] = None
            except ValueError as exc:
                # If conversion fails (e.g., non-numeric input for semester), treat as error
                raise HTTPException(
                    status_code=400, detail="Semester must be an integer."
                ) from exc
        elif key not in ["id", "created_at", "_id"]:
            # Include other fields not explicitly handled,
            # assuming they are clean
            update_fields[key] = value

    if not update_fields:
        raise HTTPException(
            status_code=400, detail="No valid fields provided for update."
        )

    # --- End of Robustness Fix ---

    await db.users.update_one({"id": user_id}, {"$set": update_fields})
    updated_user = await db.users.find_one(
        {"id": user_id}, {"_id": 0, "password_hash": 0}
    )  # E501 fix

    # Ensure updated_user exists before returning
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found after update.")

    await log_action(current_user["id"], "UPDATE", "user", {"user_id": user_id, "changes": update_fields})

    return updated_user


@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: str, current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Deletes a user by ID (Admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.users.delete_one({"id": user_id})
    await log_action(current_user["id"], "DELETE", "user", {"user_id": user_id})
    return {"message": "User deleted successfully"}


# # Mentor Assignment Routes
# @app.post("/api/assignments")
# async def create_assignment(
#     payload: AssignmentPayload,
#     current_user: dict = Depends(get_current_user),
# ):
#     """Creates a new mentor assignment (Admin only)."""
#     if current_user["role"] != "admin":
#         raise HTTPException(status_code=403, detail="Not authorized")

#     mentor_id = payload.mentor_id
#     student_ids = payload.student_ids

#     # Remove existing assignment for this mentor
#     await db.assignments.delete_many({"mentor_id": mentor_id})

#     assignment = MentorAssignment(mentor_id=mentor_id, student_ids=student_ids)
#     assignment_data = assignment.model_dump()
#     assignment_data["created_at"] = assignment_data["created_at"].isoformat()

#     await db.assignments.insert_one(assignment_data)
#     return assignment_data
@app.post("/api/assignments")
async def create_assignment(
    payload: AssignmentPayload,
    current_user: dict = Depends(get_current_user),
):
    """Creates a new mentor assignment (Admin only)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    mentor_id = payload.mentor_id
    student_ids = payload.student_ids

    # Remove existing assignment for this mentor
    await db.assignments.delete_many({"mentor_id": mentor_id})

    # Build assignment using Pydantic model
    assignment = MentorAssignment(mentor_id=mentor_id, student_ids=student_ids)
    assignment_data = assignment.dict()
    assignment_data["created_at"] = assignment_data["created_at"].isoformat()

    # Insert into MongoDB
    result = await db.assignments.insert_one(assignment_data)

    # Add string version of MongoDB ObjectId if needed
    assignment_data["mongo_id"] = str(result.inserted_id)

    # SAFETY: Remove raw ObjectId and DB _id if present
    assignment_data.pop("_id", None)

    await log_action(current_user["id"], "CREATE", "assignment", {"mentor_id": mentor_id, "student_count": len(student_ids)})

    return assignment_data

@app.get("/api/assignments/mentor/{mentor_id}")
async def get_mentor_students(
    mentor_id: str, current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Gets all students assigned to a specific mentor."""
    assignment = await db.assignments.find_one({"mentor_id": mentor_id}, {"_id": 0})
    if not assignment:
        return {"students": []}

    students = await db.users.find(
        {"id": {"$in": assignment["student_ids"]}, "role": "student"},
        {"_id": 0, "password_hash": 0},
    ).to_list(
        100
    )  # E501 fix

    return {"students": students}


@app.get("/api/assignments/student/{student_id}")
async def get_student_mentor(
    student_id: str, current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Gets the mentor assigned to a specific student."""
    assignment = await db.assignments.find_one({"student_ids": student_id}, {"_id": 0})

    if not assignment:
        return {"mentor": None}

    mentor = await db.users.find_one(
        {"id": assignment["mentor_id"]}, {"_id": 0, "password_hash": 0}
    )

    return {"mentor": mentor}


# Attendance Routes
@app.post("/api/attendance")
async def create_attendance(
    payload: AttendanceCreate,
    current_user: dict = Depends(get_current_user),
):
    """Creates a single attendance record (Admin or Mentor)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Build full AttendanceRecord from light payload
    record = AttendanceRecord(
        student_id=payload.student_id,
        subject=payload.subject,
        date=payload.date,
        status=payload.status,
        recorded_by=current_user["id"],
    )

    # Pydantic v1: use dict()
    record_data = record.dict()
    record_data["created_at"] = record_data["created_at"].isoformat()

    result = await db.attendance.insert_one(record_data)

    # Avoid ObjectId issues
    record_data["mongo_id"] = str(result.inserted_id)
    record_data.pop("_id", None)

    # Trigger Risk Check
    await check_academic_risk(str(payload.student_id))
    await log_action(current_user["id"], "CREATE", "attendance", {"student_id": payload.student_id, "subject": payload.subject, "status": payload.status})

    return record_data

@app.post("/api/attendance/upload")
async def upload_attendance(
    file: UploadFile = File(...), current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Uploads attendance records from a CSV or Excel file."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    contents = await file.read()
    df = (
        pd.read_csv(io.BytesIO(contents))
        if file.filename.endswith(".csv")
        else pd.read_excel(io.BytesIO(contents))
    )  # E501 fix

    # Expected columns: student_usn, subject, date, status
    records = []
    for _, row in df.iterrows():
        # Find student by USN
        student = await db.users.find_one(
            {"usn": row["student_usn"], "role": "student"}, {"_id": 0}
        )
        if student:
            record = AttendanceRecord(
                student_id=student["id"],
                subject=row["subject"],
                date=str(row["date"]),
                status=row["status"],
                recorded_by=current_user["id"],
            )
            record_data = record.model_dump()
            record_data["created_at"] = record_data["created_at"].isoformat()
            records.append(record_data)

    if records:
        await db.attendance.insert_many(records)
        # Trigger risk check for unique students involved
        unique_students = set(r["student_id"] for r in records)
        for sid in unique_students:
            await check_academic_risk(str(sid))
            
    await log_action(current_user["id"], "UPLOAD", "attendance", {"count": len(records)})

    return {"message": f"Uploaded {len(records)} attendance records"}


@app.get("/api/attendance/student/{student_id}")
async def get_student_attendance(
    student_id: str, current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Gets all attendance records for a specific student."""
    records = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(
        1000
    )
    return records



@app.post("/api/marks")
async def create_marks(
    payload: MarksCreate,
    current_user: dict = Depends(get_current_user),
):
    """Creates a single marks record (Admin or Mentor)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Build full MarksRecord from the light payload
    record = MarksRecord(
        student_id=payload.student_id,
        subject=payload.subject,
        semester=payload.semester,
        marks_type=payload.marks_type,
        marks_obtained=payload.marks_obtained,
        max_marks=payload.max_marks,
        recorded_by=current_user["id"],
    )

    # Pydantic v1 style
    record_data = record.dict()
    record_data["created_at"] = record_data["created_at"].isoformat()

    result = await db.marks.insert_one(record_data)

    # Avoid returning raw ObjectId
    record_data["mongo_id"] = str(result.inserted_id)
    record_data.pop("_id", None)

    # Trigger Risk Check
    await check_academic_risk(str(payload.student_id))
    await log_action(current_user["id"], "CREATE", "marks", {"student_id": payload.student_id, "subject": payload.subject, "marks_type": payload.marks_type})

    return record_data


# @app.get("/api/marks/student/{student_id}")
# async def get_student_marks(student_id: str, current_user: dict = Depends(get_current_user)):
#     if current_user["role"] not in ["admin", "mentor", "student"]:
#         raise HTTPException(status_code=403, detail="Not authorized")

#     if current_user["role"] == "student" and current_user["id"] != student_id:
#         raise HTTPException(status_code=403, detail="Cannot view other students marks")

#     marks = []
#     async for doc in db.marks.find({"student_id": student_id}):
#         doc["id"] = str(doc["_id"])
#         doc.pop("_id")
#         marks.append(doc)

#     return marks

@app.post("/api/marks/upload")
async def upload_marks(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Uploads marks records from a CSV or Excel file."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    contents = await file.read()
    df = (
        pd.read_csv(io.BytesIO(contents))
        if file.filename.endswith(".csv")
        else pd.read_excel(io.BytesIO(contents))
    )

    # Expected columns: student_usn, subject, semester, marks_type, marks_obtained, max_marks
    records: List[dict] = []
    for _, row in df.iterrows():
        student = await db.users.find_one(
            {"usn": row["student_usn"], "role": "student"}, {"_id": 0}
        )
        if student:
            record = MarksRecord(
                student_id=student["id"],
                subject=row["subject"],
                semester=int(row["semester"]),
                marks_type=row["marks_type"],
                marks_obtained=float(row["marks_obtained"]),
                max_marks=float(row["max_marks"]),
                recorded_by=current_user["id"],
            )
            record_data = record.dict()
            record_data["created_at"] = record_data["created_at"].isoformat()
            records.append(record_data)

    if records:
        await db.marks.insert_many(records)
        # Trigger risk check for unique students
        unique_students = set(r["student_id"] for r in records)
        for sid in unique_students:
            await check_academic_risk(str(sid))
            
    await log_action(current_user["id"], "UPLOAD", "marks", {"count": len(records)})

    return {"message": f"Uploaded {len(records)} marks records"}

@app.get("/api/marks/student/{student_id}")
async def get_student_marks(
    student_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets all marks records for a specific student."""
    records = await db.marks.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    return records


# # Feedback Routes
# @app.post("/api/feedback")
# async def create_feedback(
#     feedback: Feedback, current_user: dict = Depends(get_current_user)
# ):  # E501 fix
#     """Creates a new feedback record (Mentor only)."""
#     if current_user["role"] not in ["admin", "mentor"]:
#         raise HTTPException(status_code=403, detail="Not authorized")

#     feedback.mentor_id = current_user["id"]
#     feedback_data = feedback.model_dump()
#     feedback_data["created_at"] = feedback_data["created_at"].isoformat()

#     await db.feedback.insert_one(feedback_data)
#     return feedback_data
@app.post("/api/feedback")
async def create_feedback(
    payload: FeedbackCreate,
    current_user: dict = Depends(get_current_user),
):
    """Creates a new feedback record (Mentor or Admin)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Build full Feedback object, mentor_id comes from token
    feedback = Feedback(
      mentor_id=current_user["id"],
      student_id=payload.student_id,
      feedback_text=payload.feedback_text,
    )

    feedback_data = feedback.model_dump()
    feedback_data["created_at"] = feedback_data["created_at"].isoformat()

    result = await db.feedback.insert_one(feedback_data)

    # Avoid ObjectId issues in response
    feedback_data["mongo_id"] = str(result.inserted_id)
    feedback_data["mongo_id"] = str(result.inserted_id)
    feedback_data.pop("_id", None)

    # Notify Student
    await create_notification(
        user_id=payload.student_id,
        title="New Feedback Received",
        message="Your mentor has provided new feedback.",
        type="info",
        link="/student/feedback",
        metadata={"feedback_id": feedback_data["mongo_id"]}
    )
    
    await log_action(current_user["id"], "CREATE", "feedback", {"student_id": payload.student_id})

    return feedback_data


@app.get("/api/feedback/student/{student_id}")
async def get_student_feedback(
    student_id: str, current_user: dict = Depends(get_current_user)
):  # E501 fix
    """Gets all feedback records for a specific student."""
    if current_user["role"] != "student" or current_user["id"] != student_id:
        if current_user["role"] not in ["admin", "mentor"]:
            raise HTTPException(status_code=403, detail="Not authorized")

    feedbacks = await db.feedback.find({"student_id": student_id}, {"_id": 0}).to_list(
        1000
    )  # E501 fix
    return feedbacks


# Messages Routes
@app.get("/api/messages")
async def get_messages(
    other_user_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets messages between the current user and another user."""
    messages = (
        await db.messages.find(
            {
                "$or": [
                    {"sender_id": current_user["id"], "receiver_id": other_user_id},
                    {"sender_id": other_user_id, "receiver_id": current_user["id"]},
                ]
            },
            {"_id": 0},
        )
        .sort("created_at", 1)
        .to_list(1000)
    )

    # Mark as read
    await db.messages.update_many(
        {
            "sender_id": other_user_id,
            "receiver_id": current_user["id"],
            "is_read": False,
        },
        {"$set": {"is_read": True}},
    )

    return messages


@app.get("/api/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Gets a list of users the current user has conversed with."""
    # Get all unique user IDs the current user has conversed with
    messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": current_user["id"]},
                {"receiver_id": current_user["id"]},
            ]
        },
        {"_id": 0},
    ).to_list(10000)

    user_ids = set()
    for msg in messages:
        if msg["sender_id"] != current_user["id"]:
            user_ids.add(msg["sender_id"])
        if msg["receiver_id"] != current_user["id"]:
            user_ids.add(msg["receiver_id"])

    users = await db.users.find(
        {"id": {"$in": list(user_ids)}}, {"_id": 0, "password_hash": 0}
    ).to_list(1000)

    return users


# Circulars Routes
from typing import Optional

@app.post("/api/circulars")
async def create_circular(
    title: str = Form(...),
    content: str = Form(...),
    target_audience: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    file_url = None

    if file:
        folder = "app/uploads/circulars"
        os.makedirs(folder, exist_ok=True)
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = f"{folder}/{filename}"

        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())

        file_url = f"/uploads/circulars/{filename}"

    circular = Circular(
        author_id=current_user["id"],
        title=title,
        content=content,
        target_audience=target_audience,
        file_url=file_url,
    )

    data = circular.model_dump()
    data["created_at"] = data["created_at"].isoformat()

    result = await db.circulars.insert_one(data)

    # 🔑 IMPORTANT: remove Mongo's ObjectId before returning
    data.pop("_id", None)
    data["mongo_id"] = str(result.inserted_id)

    # Broadcast Notification
    await create_broadcast_notification(
        target_role=target_audience,
        title=f"New Circular: {title}",
        message=content[:100] + ("..." if len(content) > 100 else ""),
        type="info",
        link="/circulars"
    )
    
    await log_action(current_user["id"], "CREATE", "circular", {"title": title, "audience": target_audience})

    return data


@app.get("/api/circulars")
async def get_circulars(current_user: dict = Depends(get_current_user)):
    """Gets circulars relevant to the user's role."""
    query = {
        "$or": [
            {"target_audience": "all"},
            {"target_audience": current_user["role"] + "s"},
        ]
    }

    circulars = (
        await db.circulars.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    )
    return circulars


# Ratings Routes
@app.post("/api/ratings")
async def create_rating(rating: Rating, current_user: dict = Depends(get_current_user)):
    """Creates a student rating (Mentor only)."""
    if current_user["role"] not in ["admin", "mentor"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # The Mentor ID should always be the ID of the current authenticated user who is submitting the rating.
    rating.mentor_id = current_user["id"]

    rating_data = rating.model_dump()
    rating_data["created_at"] = rating_data["created_at"].isoformat()

    # Remove existing rating by this specific mentor for this student
    # NOTE: The original code removed ALL previous ratings for the student by ANY mentor,
    # which seems odd for tracking history. We will keep the original logic for idempotency
    # (a mentor can only have one rating for a student at a time) but flag it as potential improvement.
    await db.ratings.delete_many(
        {"student_id": rating.student_id, "mentor_id": rating.mentor_id}
    )

    await db.ratings.insert_one(rating_data)
    return rating_data


@app.get("/api/ratings/student/{student_id}")
async def get_student_rating(
    student_id: str, current_user: dict = Depends(get_current_user)
):
    """Gets the latest rating for a specific student."""
    # We should return the MOST RECENT rating from any mentor if multiple ratings exist.
    # The original implementation only returns one arbitrary rating, so we stick to finding one.
    rating = await db.ratings.find_one(
        {"student_id": student_id},
        {"_id": 0},
        sort=[("created_at", -1)],  # Sort by newest first, limiting to one result
    )
    return rating if rating else {}


# Dashboard Statistics
@app.get("/api/stats/admin")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Gets key statistics for the admin dashboard."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    total_students = await db.users.count_documents({"role": "student"})
    total_mentors = await db.users.count_documents({"role": "mentor"})
    total_circulars = await db.circulars.count_documents({})
    total_assignments = await db.assignments.count_documents({})

    return {
        "total_students": total_students,
        "total_mentors": total_mentors,
        "total_circulars": total_circulars,
        "total_assignments": total_assignments,
    }
    
@app.get("/api/stats/admin/mentor-load")
async def get_admin_mentor_load(current_user: dict = Depends(get_current_user)):
    """
    Returns, for each mentor, how many students are assigned.
    Used for admin analytics charts.
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get all assignments
    assignments = await db.assignments.find({}, {"_id": 0}).to_list(1000)

    if not assignments:
        return []

    mentor_ids = list({a["mentor_id"] for a in assignments})

    # Get mentor names
    mentors = await db.users.find(
        {"id": {"$in": mentor_ids}},
        {"_id": 0, "id": 1, "full_name": 0, "email": 1, "full_name": 1},
    ).to_list(1000)

    mentor_map = {m["id"]: m.get("full_name") or m.get("email") for m in mentors}

    data = []
    for a in assignments:
        mid = a["mentor_id"]
        student_count = len(a.get("student_ids", []))
        data.append(
            {
                "mentor_id": mid,
                "mentor_name": mentor_map.get(mid, "Unknown mentor"),
                "student_count": student_count,
            }
        )

    return data

@app.get("/api/stats/admin/students-by-department")
async def get_admin_students_by_department(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns number of students per department for analytics.
    """
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    students = await db.users.find(
        {"role": "student"}, {"_id": 0, "department": 1}
    ).to_list(5000)

    counts = {}
    for s in students:
        dept = s.get("department") or "Unknown"
        counts[dept] = counts.get(dept, 0) + 1

    # Convert to list for charts
    return [
        {"department": dept, "count": count}
        for dept, count in sorted(counts.items(), key=lambda x: x[0])
    ]


@app.get("/api/stats/mentor")
async def get_mentor_stats(current_user: dict = Depends(get_current_user)):
    """Gets key statistics for the mentor dashboard."""
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Not authorized")

    assignment = await db.assignments.find_one(
        {"mentor_id": current_user["id"]}, {"_id": 0}
    )
    assigned_students = len(assignment["student_ids"]) if assignment else 0

    total_feedback = await db.feedback.count_documents(
        {"mentor_id": current_user["id"]}
    )

    return {"assigned_students": assigned_students, "total_feedback": total_feedback}

@app.get("/api/stats/mentor/mentees-performance")
async def get_mentor_mentees_performance(
    current_user: dict = Depends(get_current_user),
):
    """
    For the logged-in mentor, returns performance summary for each mentee:
    - attendance percentage
    - average marks percentage
    - simple risk level
    """
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find students assigned to this mentor
    assignment = await db.assignments.find_one(
        {"mentor_id": current_user["id"]}, {"_id": 0}
    )
    if not assignment or not assignment.get("student_ids"):
        return []

    student_ids = assignment["student_ids"]

    # Get basic student info
    students = await db.users.find(
        {"id": {"$in": student_ids}},
        {"_id": 0, "password_hash": 0},
    ).to_list(1000)

    # Attendance for these students
    attendance_records = await db.attendance.find(
        {"student_id": {"$in": student_ids}}, {"_id": 0}
    ).to_list(10000)

    attendance_stats = {}  # student_id -> {"present": x, "total": y}
    for r in attendance_records:
        sid = r["student_id"]
        if sid not in attendance_stats:
            attendance_stats[sid] = {"present": 0, "total": 0}
        attendance_stats[sid]["total"] += 1
        if r["status"] == "present":
            attendance_stats[sid]["present"] += 1

    # Marks for these students
    marks_records = await db.marks.find(
        {"student_id": {"$in": student_ids}}, {"_id": 0}
    ).to_list(10000)

    marks_stats = {}  # student_id -> {"sum_pct": x, "count": y}
    for r in marks_records:
        sid = r["student_id"]
        if r.get("max_marks") in (0, None):
            continue
        pct = (float(r["marks_obtained"]) / float(r["max_marks"])) * 100.0
        if sid not in marks_stats:
            marks_stats[sid] = {"sum_pct": 0.0, "count": 0}
        marks_stats[sid]["sum_pct"] += pct
        marks_stats[sid]["count"] += 1

    results = []
    for s in students:
        sid = s["id"]

        # Attendance %
        att = attendance_stats.get(sid, {"present": 0, "total": 0})
        if att["total"] > 0:
            attendance_pct = round(att["present"] / att["total"] * 100, 2)
        else:
            attendance_pct = 0.0

        # Marks %
        mk = marks_stats.get(sid, {"sum_pct": 0.0, "count": 0})
        if mk["count"] > 0:
            marks_pct = round(mk["sum_pct"] / mk["count"], 2)
        else:
            marks_pct = 0.0

        # Very simple risk logic
        if attendance_pct < 60 or marks_pct < 40:
            risk = "high"
        elif attendance_pct < 75 or marks_pct < 50:
            risk = "medium"
        else:
            risk = "low"

        results.append(
            {
                "student_id": sid,
                "full_name": s.get("full_name"),
                "usn": s.get("usn"),
                "department": s.get("department"),
                "semester": s.get("semester"),
                "attendance_percentage": attendance_pct,
                "average_marks_percentage": marks_pct,
                "risk_level": risk,
            }
        )

    return results

@app.get("/api/stats/student")
async def get_student_stats(current_user: dict = Depends(get_current_user)):
    """Gets key statistics for the student dashboard."""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Calculate attendance percentage
    attendance_records = await db.attendance.find(
        {"student_id": current_user["id"]}, {"_id": 0}
    ).to_list(1000)
    total_attendance = len(attendance_records)
    present_count = sum(1 for r in attendance_records if r["status"] == "present")
    attendance_percentage = (
        (present_count / total_attendance * 100) if total_attendance > 0 else 0
    )

    # Calculate average marks
    marks_records = await db.marks.find(
        {"student_id": current_user["id"]}, {"_id": 0}
    ).to_list(1000)
    if marks_records:
        avg_percentage = sum(
            (r["marks_obtained"] / r["max_marks"] * 100) for r in marks_records
        ) / len(marks_records)
    else:
        avg_percentage = 0

    return {
        "attendance_percentage": round(attendance_percentage, 2),
        "average_marks_percentage": round(avg_percentage, 2),
        "total_subjects": len(set(r["subject"] for r in marks_records)),
    }


@app.on_event("shutdown")
async def shutdown_db_client():
    """Closes the MongoDB client connection on application shutdown."""
    client.close()


app.mount("/uploads", StaticFiles(directory=str(ROOT_DIR / "uploads")), name="uploads")


# ==================== Notification Routes ====================

@app.get("/api/notifications")
async def get_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get notifications for the current user."""
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return notifications


@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        return {"message": "Notification not found or already read"}
    return {"message": "Marked as read"}


@app.put("/api/notifications/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications for the user as read."""
    await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}


# ==================== Analytics Routes ====================

@app.get("/api/analytics/system-risk")
async def get_system_risk_analytics(
    current_user: dict = Depends(get_current_user)
):
    """(Admin) Get system-wide risk distribution."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return await get_system_risk_distribution()


@app.get("/api/analytics/dept-performance")
async def get_dept_performance_analytics(
    current_user: dict = Depends(get_current_user)
):
    """(Admin) Get average performance by department."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return await get_department_performance()


@app.get("/api/analytics/mentor/predictions")
async def get_mentor_predictions(
    current_user: dict = Depends(get_current_user)
):
    """(Mentor) Get performance predictions for assigned students."""
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assignment = await db.assignments.find_one({"mentor_id": current_user["id"]})
    if not assignment or not assignment.get("student_ids"):
        return []
        
    predictions = []
    # Fetch simple student info
    students_map = {}
    students = await db.users.find(
        {"id": {"$in": assignment["student_ids"]}}, {"full_name": 1, "usn": 1, "id": 1, "_id": 0}
    ).to_list(1000)
    for s in students: students_map[s["id"]] = s
    
    for student_id in assignment["student_ids"]:
        pred = await predict_student_outcome(student_id)
        if pred["prediction"] != "Insufficient Data":
             s_info = students_map.get(student_id, {})
             predictions.append({
                 "student_id": student_id,
                 "full_name": s_info.get("full_name"),
                 "usn": s_info.get("usn"),
                 **pred
             })
             
    return predictions


@app.get("/api/reports/attendance")
async def download_attendance_report(
    format: str,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Download attendance report (PDF/Excel)."""
    if current_user["role"] == "student":
        student_id = current_user["id"]
    elif current_user["role"] not in ["admin", "mentor"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    file_content = await generate_attendance_report(format, student_id)
    
    media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    filename = f"attendance_report.{'pdf' if format == 'pdf' else 'xlsx'}"
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/marks")
async def download_marks_report(
    format: str,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Download marks report (PDF/Excel)."""
    if current_user["role"] == "student":
        student_id = current_user["id"]
    elif current_user["role"] not in ["admin", "mentor"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    file_content = await generate_marks_report(format, student_id)
    
    media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    filename = f"marks_report.{'pdf' if format == 'pdf' else 'xlsx'}"
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/reports/mentor-summary")
async def download_mentor_summary(
    format: str,
    current_user: dict = Depends(get_current_user)
):
    """(Mentor) Download summary of mentees."""
    if current_user["role"] != "mentor":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    file_content = await generate_mentor_summary_report(format, current_user["id"])
    
    media_type = "application/pdf" if format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    filename = f"mentor_summary.{'pdf' if format == 'pdf' else 'xlsx'}"
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )




@app.get("/api/search")
async def search_all(
    q: str,
    current_user: dict = Depends(get_current_user)
):
    """Global search for Users and Circulars."""
    return await global_search(q, current_user["role"])


@app.get("/api/mentors/recommendations/{student_id}")
async def get_recommended_mentors(
    student_id: str,
     current_user: dict = Depends(get_current_user)
):
    """Get recommended mentors for a student."""
    if current_user["role"] not in ["admin", "student"]:
         # Mentors generally don't need to recommend mentors? Actually maybe for re-assignment. 
         # Let's allow admins and the student themselves.
         if current_user["role"] == "mentor":
             pass # Allow mentors too
         else:
             raise HTTPException(status_code=403, detail="Not authorized")
             
    return await recommend_mentors(student_id)


# ==================== Audit Routes ====================

@app.get("/api/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """(Admin) Get system audit logs."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs


@app.get("/api/analytics/student/history")
async def get_academic_history(
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get semester-wise academic history."""
    if current_user["role"] == "student":
        student_id = current_user["id"]
    elif current_user["role"] not in ["admin", "mentor"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    if not student_id:
        return []
        
    marks = await db.marks.find({"student_id": student_id}, {"_id": 0}).to_list(10000)
    
    # Aggregate by semester
    history = {} # sem -> {total_marks: 0, max_marks: 0, subjects: set()}
    
    for m in marks:
        sem = m.get("semester", 1) # Default to 1 if missing
        if sem not in history:
            history[sem] = {"total_marks": 0, "max_marks": 0, "subjects": set()}
            
        history[sem]["total_marks"] += m["marks_obtained"]
        history[sem]["max_marks"] += m["max_marks"]
        history[sem]["subjects"].add(m["subject"])
        
    result = []
    for sem, data in history.items():
        avg = (data["total_marks"] / data["max_marks"] * 100) if data["max_marks"] > 0 else 0
        result.append({
            "semester": sem,
            "average_percentage": round(avg, 2),
            "subjects_count": len(data["subjects"])
        })
        
    return sorted(result, key=lambda x: x["semester"])


@app.get("/api/student/timeline")
async def get_student_timeline(
    current_user: dict = Depends(get_current_user)
):
    """Get chronological activity timeline for student."""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # 1. Notifications
    notifs = await db.notifications.find(
        {"user_id": current_user["id"]}, 
        {"title": 1, "message": 1, "created_at": 1, "type": 1, "_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    # 2. Feedback
    feedbacks = await db.feedback.find(
        {"student_id": current_user["id"]},
        {"feedback_type": 1, "comments": 1, "created_at": 1, "mentor_name": 1, "_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    # Merge and Sort
    timeline = []
    
    for n in notifs:
        timeline.append({
            "type": "notification",
            "title": n.get("title"),
            "description": n.get("message"),
            "timestamp": n["created_at"],
            "meta": {"type": n.get("type")}
        })
        
    for f in feedbacks:
        timeline.append({
            "type": "feedback",
            "title": f"Feedback: {f.get('feedback_type', 'General')}",
            "description": f.get("comments"),
            "timestamp": f["created_at"],
            "meta": {"mentor": f.get("mentor_name")}
        })
        
    # Sort descending by timestamp
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return timeline[:50]
