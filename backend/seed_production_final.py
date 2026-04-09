import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Configuration
# Note: Ensure IP is whitelisted on Atlas.
MONGO_URL = "mongodb+srv://root:12345@cluster0.yoy9wjb.mongodb.net/?appName=Cluster0"
DB_NAME = "mentormt_prod"
COMMON_PASSWORD = "pass123"

# Match backend's auth scheme: pbkdf2_sha256
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def slugify(name):
    return name.lower().replace(" ", "")

async def seed_production():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🚀 Connecting to production database...")
    try:
        # Check connectivity
        await client.admin.command('ping')
        print("✅ Connection successful.")
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    # Clear existing session-related data for fresh start
    print("🧹 Clearing old demo data (users, assignments, marks, attendance)...")
    cols = ["users", "assignments", "attendance", "marks", "circulars", "notifications", "subjects"]
    for c in cols:
        await db[c].delete_many({})

    # Password hash for everyone
    hashed_pass = get_password_hash(COMMON_PASSWORD)

    # 1. Create Admin
    admin_id = str(uuid.uuid4())
    admin_user = {
        "id": admin_id,
        "email": "admin@mentormt.com",
        "full_name": "System Admin",
        "role": "admin",
        "password_hash": hashed_pass,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "department": "Administration"
    }
    await db.users.insert_one(admin_user)
    print("✅ Admin created: admin@mentormt.com")

    # 2. Create Mentors
    mentor_names = ["Naveenkumar", "Shanthakumar", "Nagaraj", "Debby", "Malathy"]
    mentors = []
    for name in mentor_names:
        m_id = str(uuid.uuid4())
        email = f"{slugify(name)}.mentor@mentormt.com"
        mentor = {
            "id": m_id,
            "email": email,
            "full_name": name,
            "role": "mentor",
            "password_hash": hashed_pass,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "department": "Computer Science",
            "employee_id": f"MEN-{random.randint(100,999)}"
        }
        await db.users.insert_one(mentor)
        mentors.append(mentor)
        print(f"✅ Mentor created: {email}")

    # 3. Create Students
    student_names = [
        "ARIHARASUDHAN B", "ASHVIN RAM S", "BALAJI P", "BAVAN PRASAD C", "DEEPIKA R",
        "DIVYADHARSHINI T", "ESWAR A", "GNANESHWARAN S", "GOKUL RAJA G", "HIRTHIK ROSAN S",
        "JAYASURYA S", "JELINARANI R", "JYOTI KUMARI R", "KISORTH KUMAR S", "KOWSIKAN K",
        "MOHAMMED MUZZAMMIL A", "NANDHINI S", "NAVEENKUMAR R", "NITHISH KUMAR T", "PUJA SETHY N",
        "SANJAY S", "SARAVANA KUMAR B", "SASI K", "SIVA S", "STANDLY V", "SURADHISH R",
        "SURENDHAR K", "VARSHINI A N", "Vengateshan"
    ]
    
    students = []
    for name in student_names:
        s_id = str(uuid.uuid4())
        email = f"{slugify(name)}.student@mentormt.com"
        student = {
            "id": s_id,
            "email": email,
            "full_name": name,
            "role": "student",
            "password_hash": hashed_pass,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "department": "Computer Science",
            "usn": f"1MS20CS{random.randint(100,500)}",
            "semester": 6
        }
        await db.users.insert_one(student)
        students.append(student)
    print(f"✅ Created {len(students)} students.")

    # 4. Seed Subjects
    subjects = [
        {"id": str(uuid.uuid4()), "code": "CS601", "name": "Computer Networks"},
        {"id": str(uuid.uuid4()), "code": "CS602", "name": "Operating Systems"},
        {"id": str(uuid.uuid4()), "code": "CS603", "name": "Database Management"},
        {"id": str(uuid.uuid4()), "code": "CS604", "name": "Software Engineering"},
    ]
    for s in subjects:
        s.update({
            "department": "Computer Science", 
            "semester": 6, 
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": admin_id
        })
        await db.subjects.insert_one(s)

    # 5. Assignments (Divide students by mentors)
    student_assignments = {m["id"]: [] for m in mentors}
    for idx, student in enumerate(students):
        mentor = mentors[idx % len(mentors)]
        student_assignments[mentor["id"]].append(student["id"])
    
    for m_id, s_ids in student_assignments.items():
        await db.assignments.insert_one({
            "id": str(uuid.uuid4()),
            "mentor_id": m_id,
            "student_ids": s_ids,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    print("✅ Mentor-Student assignments completed.")

    # 6. Academic Demo Data
    print("📈 Generating academic performance records (attendance and marks)...")
    attendance_records = []
    marks_records = []
    base_date = datetime.now(timezone.utc) - timedelta(days=20)
    
    for student in students:
        # Find mentor for this student (for recorded_by field)
        mentor_id = "System"
        for mid, sids in student_assignments.items():
            if student["id"] in sids:
                mentor_id = mid
                break

        # Attendance for last 14 days
        for i in range(14):
            dt = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            for sub in subjects:
                status = "present" if random.random() > 0.15 else "absent"
                attendance_records.append({
                    "id": str(uuid.uuid4()),
                    "student_id": student["id"],
                    "subject": sub["name"],
                    "date": dt,
                    "status": status,
                    "recorded_by": mentor_id,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        
        # Marks for IA1 & IA2
        for sub in subjects:
            marks_records.append({
                "id": str(uuid.uuid4()),
                "student_id": student["id"],
                "subject": sub["name"],
                "semester": 6,
                "marks_type": "IA1",
                "marks_obtained": random.randint(12, 20),
                "max_marks": 20,
                "recorded_by": mentor_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            marks_records.append({
                "id": str(uuid.uuid4()),
                "student_id": student["id"],
                "subject": sub["name"],
                "semester": 6,
                "marks_type": "IA2",
                "marks_obtained": random.randint(10, 19),
                "max_marks": 20,
                "recorded_by": mentor_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

    if attendance_records:
        await db.attendance.insert_many(attendance_records)
    if marks_records:
        await db.marks.insert_many(marks_records)
    
    print(f"✅ Seeding finished successfully. Records added: {len(attendance_records)} attendance, {len(marks_records)} marks.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_production())
