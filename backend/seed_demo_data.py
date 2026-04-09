import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta
from app.db import db
from app.models.academic import AttendanceRecord, MarksRecord
from app.models.communication import Circular
from app.models.notification import Notification

async def seed_demo_data():
    print("🚀 Starting comprehensive demo data seeding...")
    
    # 1. Fetch Users
    admin = await db.users.find_one({"email": "admin@mentormt.com"})
    mentor = await db.users.find_one({"email": "mentor@mentormt.com"})
    student = await db.users.find_one({"email": "student@mentormt.com"})

    if not all([admin, mentor, student]):
        print("❌ Error: Demo users not found. Please run seed_credentials.py first.")
        return

    admin_id = admin["id"]
    mentor_id = mentor["id"]
    student_id = student["id"]

    # 2. Seed Subjects
    subjects = [
        {"id": str(uuid.uuid4()), "code": "CS601", "name": "Computer Networks", "department": "Computer Science", "semester": 6},
        {"id": str(uuid.uuid4()), "code": "CS602", "name": "Operating Systems", "department": "Computer Science", "semester": 6},
        {"id": str(uuid.uuid4()), "code": "CS603", "name": "Database Management", "department": "Computer Science", "semester": 6},
        {"id": str(uuid.uuid4()), "code": "CS604", "name": "Software Engineering", "department": "Computer Science", "semester": 6},
    ]
    
    await db.subjects.delete_many({"department": "Computer Science", "semester": 6})
    for sub in subjects:
        sub["created_at"] = datetime.now(timezone.utc).isoformat()
        sub["created_by"] = admin_id
        await db.subjects.insert_one(sub)
    print(f"✅ Seeded {len(subjects)} subjects.")

    # 3. Seed Mentor-Student Assignment
    await db.assignments.delete_many({"mentor_id": mentor_id})
    assignment_data = {
        "id": str(uuid.uuid4()),
        "mentor_id": mentor_id,
        "student_ids": [student_id],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.assignments.insert_one(assignment_data)
    print(f"✅ Assigned student {student['full_name']} to mentor {mentor['full_name']}.")

    # 4. Seed Attendance
    await db.attendance.delete_many({"student_id": student_id})
    attendance_records = []
    base_date = datetime.now(timezone.utc) - timedelta(days=14)
    
    for i in range(14):
        date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        for sub in subjects:
            if random.random() > 0.1: # 90% attendance
                status = "present"
            else:
                status = "absent"
            
            record = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "subject": sub["name"],
                "date": date,
                "status": status,
                "recorded_by": mentor_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            attendance_records.append(record)
    
    await db.attendance.insert_many(attendance_records)
    print(f"✅ Seeded {len(attendance_records)} attendance records.")

    # 5. Seed Marks
    await db.marks.delete_many({"student_id": student_id})
    marks_records = []
    for sub in subjects:
        # IA1
        marks_records.append({
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "subject": sub["name"],
            "semester": 6,
            "marks_type": "IA1",
            "marks_obtained": random.randint(15, 20),
            "max_marks": 20,
            "recorded_by": mentor_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        # IA2
        marks_records.append({
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "subject": sub["name"],
            "semester": 6,
            "marks_type": "IA2",
            "marks_obtained": random.randint(12, 19),
            "max_marks": 20,
            "recorded_by": mentor_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        # Assignment
        marks_records.append({
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "subject": sub["name"],
            "semester": 6,
            "marks_type": "Assignment",
            "marks_obtained": random.randint(8, 10),
            "max_marks": 10,
            "recorded_by": mentor_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    await db.marks.insert_many(marks_records)
    print(f"✅ Seeded {len(marks_records)} marks records.")

    # 6. Seed Circulars
    await db.circulars.delete_many({"author_id": admin_id})
    circulars = [
        {
            "id": str(uuid.uuid4()),
            "author_id": admin_id,
            "title": "Internal Assessment - 3 Schedule",
            "content": "The IA-3 for the 6th semester will commence from April 20th, 2026. Please find the detailed timetable on the notice board.",
            "target_audience": "students",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "author_id": admin_id,
            "title": "College Fest - Nirvana 2026",
            "content": "Register now for the upcoming annual college fest Nirvana 2026! Exciting events and prizes await.",
            "target_audience": "all",
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        }
    ]
    await db.circulars.insert_many(circulars)
    print(f"✅ Seeded {len(circulars)} circulars.")

    # 7. Seed Notifications
    await db.notifications.delete_many({"user_id": {"$in": [student_id, mentor_id]}})
    notifications = [
        {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": "New Circular",
            "message": "Internal Assessment - 3 Schedule has been posted.",
            "type": "info",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": "Attendance Alert",
            "message": "Your attendance in Computer Networks is below 75%. Please meet your mentor.",
            "type": "warning",
            "read": False,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
        },
         {
            "id": str(uuid.uuid4()),
            "user_id": mentor_id,
            "title": "New Student Assigned",
            "message": f"Student {student['full_name']} has been assigned to you.",
            "type": "success",
            "read": False,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        }
    ]
    await db.notifications.insert_many(notifications)
    print(f"✅ Seeded {len(notifications)} notifications.")

    print("\n✨ Demo data seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
