from app.db import db
from app.models.portfolio import PlacementPrediction, PeerComparisonStats
from typing import List

async def calculate_student_analysis(student_id: str) -> PlacementPrediction:
    # 1. Attendance (15%)
    att_records = await db.attendance.find({"student_id": student_id}).to_list(1000)
    total_classes = len(att_records)
    present_classes = sum(1 for r in att_records if r["status"] == "present")
    att_pct = (present_classes / total_classes * 100) if total_classes > 0 else 0
    score_att = min(att_pct, 100) * 0.15

    # 2. Marks (25%)
    marks_records = await db.marks.find({"student_id": student_id}).to_list(1000)
    total_marks_pct = 0
    valid_marks_count = 0
    for m in marks_records:
        if m.get("max_marks", 0) > 0:
            total_marks_pct += (m["marks_obtained"] / m["max_marks"] * 100)
            valid_marks_count += 1
    avg_marks = (total_marks_pct / valid_marks_count) if valid_marks_count > 0 else 0
    score_marks = min(avg_marks, 100) * 0.25

    # 3. Certifications (20%) - Quality Based
    # Only verified certifications count
    verified_certs = await db.certifications.find({"student_id": student_id, "is_verified": True}).to_list(100)
    cert_count = len(verified_certs)
    score_certs = min(cert_count * 20, 100) * 0.20
    
    # Collect skills for role prediction
    skills_list = []
    for c in verified_certs:
        if c.get("skill_category"): skills_list.append(c["skill_category"])
        if c.get("certificate_name"): skills_list.append(c["certificate_name"])


    # 4. Projects (20%) - Quality Based
    # Base 15 points per project + Bonus based on Mentor Score (0-10)
    projects = await db.projects.find({"student_id": student_id}).to_list(100)
    project_count = len(projects)
    
    raw_proj_score = 0
    for p in projects:
        base = 15
        mentor_bonus = (p.get("mentor_score", 0) or 0) * 1.5 # Max 15 bonus
        raw_proj_score += (base + mentor_bonus)
        
    score_proj = min(raw_proj_score, 100) * 0.20

    # 5. Activities (10%) - 25 points per activity
    sports_count = await db.sports.count_documents({"student_id": student_id})
    cultural_count = await db.cultural.count_documents({"student_id": student_id})
    total_activities = sports_count + cultural_count
    score_act = min(total_activities * 25, 100) * 0.10

    # 6. Discipline & Trend (10%)
    # Base 10.0
    # Penalize rejected/pending apology letters
    letters = await db.letters.find({"student_id": student_id}).to_list(100)
    
    score_trend = 10.0
    for l in letters:
        status = l.get("status", "pending")
        l_type = l.get("letter_type", "Apology")
        
        if l_type == "Apology":
            if status == "rejected": score_trend -= 5.0
            elif status == "pending": score_trend -= 2.0
            # accepted apology is neutral/forgiven
        elif l_type == "Improvement" and status == "accepted":
            score_trend += 2.0
            
    score_trend = max(0.0, min(score_trend, 10.0)) # Clamp between 0 and 10

    # --- 7. Confidence & Growth Logic ---
    
    # Growth Index (Trend Analysis)
    # Group marks by semester
    sem_marks = {}
    for m in marks_records:
        if m.get("max_marks", 0) > 0:
            sem = m.get("semester", 1)
            if sem not in sem_marks: sem_marks[sem] = []
            sem_marks[sem].append(m["marks_obtained"] / m["max_marks"] * 100)
            
    sem_avgs = {k: sum(v)/len(v) for k,v in sem_marks.items() if v}
    sorted_sems = sorted(sem_avgs.keys())
    
    growth_index = "Stagnant"
    if len(sorted_sems) >= 2:
        latest = sem_avgs[sorted_sems[-1]]
        prev = sem_avgs[sorted_sems[-2]]
        if latest > prev + 2.0: growth_index = "Improving"
        elif latest < prev - 5.0: growth_index = "Declining"
    elif len(sorted_sems) == 1:
        growth_index = "New Student"

    # Confidence Score
    # High: >1 Verified Cert AND >1 Rated Project AND >2 Semesters Marks
    # Medium: Has Marks + Attendance
    # Low: Missing core data
    confidence = "Low"
    has_academics = (len(marks_records) > 0 and len(att_records) > 0)
    has_portfolio = (cert_count > 0 and project_count > 0)
    
    if has_academics:
        confidence = "Medium"
        if len(verified_certs) >= 1 and project_count >= 1 and len(sorted_sems) >= 2:
            confidence = "High"

    # --- Total Score ---
    total_score = score_att + score_marks + score_certs + score_proj + score_act + score_trend
    total_score = min(round(total_score, 1), 100.0)
    
    # Scaled Probability (Sigmoid-like mapping)
    # 60 score -> ~60% prob
    # 90 score -> ~95% prob
    # 40 score -> ~30% prob
    real_prob = min(99.9, (total_score * 0.9) + 5) if total_score > 20 else total_score

    # --- Outcomes ---
    eligibility = "Low Probability"
    predicted_role = "Needs Improvement"
    
    if total_score >= 85:
        eligibility = "High Probability"
        # Smart Role Prediction
        skills_text = " ".join(skills_list).lower()
        if "react" in skills_text or "node" in skills_text or "web" in skills_text:
            predicted_role = "Full Stack Developer"
        elif "python" in skills_text or "data" in skills_text or "ai" in skills_text:
            predicted_role = "Data Scientist / AI Engineer"
        elif "aws" in skills_text or "cloud" in skills_text:
            predicted_role = "Cloud Engineer"
        else:
            predicted_role = "Product Engineer"
            
    elif total_score >= 60:
        eligibility = "Medium Probability"
        predicted_role = "Software Trainee / Analyst"

    # --- Recommendations Logic ---
    risk_factors = []
    improvement_areas = []

    if att_pct < 75:
        risk_factors.append(f"Low Attendance ({round(att_pct)}%)")
        improvement_areas.append("Maintain >75% Attendance")
    
    if avg_marks < 60:
        risk_factors.append(f"Low Academics ({round(avg_marks)}%)")
        improvement_areas.append("Improve Internal Marks")
        
    if growth_index == "Declining":
        risk_factors.append("Declining Academic Trend")
        improvement_areas.append("Reverse Negative Grade Trend")

    if cert_count == 0:
        improvement_areas.append("Complete 1 Verified Certification")
    
    if project_count == 0:
        improvement_areas.append("Build a Personal Project")
    elif project_count == 1:
        improvement_areas.append("Add one more Major Project")

    if total_activities == 0:
        improvement_areas.append("Participate in Sports/Cultural events")
        
    score_breakdown = {
        "attendance": round(score_att, 1),
        "academics": round(score_marks, 1),
        "certifications": round(score_certs, 1),
        "projects": round(score_proj, 1),
        "activities": round(score_act, 1),
        "discipline_trend": round(score_trend, 1)
    }

    return PlacementPrediction(
        student_id=student_id,
        eligibility_status=eligibility,
        placement_probability=round(real_prob, 1), 
        predicted_role=predicted_role,
        risk_factors=risk_factors,
        improvement_areas=improvement_areas,
        composite_score=total_score,
        prediction_confidence=confidence,
        growth_index=growth_index,
        score_breakdown=score_breakdown
    )

async def calculate_peer_stats(student_id: str) -> List[PeerComparisonStats]:
    # --- 1. Attendance Stats ---
    # Student
    s_att = await db.attendance.find({"student_id": student_id, "status": "present"}).to_list(1000)
    s_total = await db.attendance.count_documents({"student_id": student_id})
    student_att_pct = (len(s_att) / s_total * 100) if s_total > 0 else 0
    
    # Class
    all_att = await db.attendance.find({}).to_list(10000)
    student_attendance_map = {}
    for r in all_att:
        sid = r["student_id"]
        if sid not in student_attendance_map: student_attendance_map[sid] = {"present": 0, "total": 0}
        student_attendance_map[sid]["total"] += 1
        if r["status"] == "present": student_attendance_map[sid]["present"] += 1
        
    att_pcts = []
    for data in student_attendance_map.values():
        val = (data["present"] / data["total"] * 100) if data["total"] > 0 else 0
        att_pcts.append(val)
        
    att_avg = sum(att_pcts) / len(att_pcts) if att_pcts else 0
    att_pcts.sort(reverse=True)
    top_10_count = max(1, int(len(att_pcts) * 0.1))
    att_top_10 = sum(att_pcts[:top_10_count]) / top_10_count if att_pcts else 0
    
    # --- 2. Marks Stats ---
    # Student
    s_marks = await db.marks.find({"student_id": student_id}).to_list(1000)
    s_marks_list = [(m["marks_obtained"]/m["max_marks"]*100) for m in s_marks if m.get("max_marks", 0) > 0]
    student_marks_avg = sum(s_marks_list)/len(s_marks_list) if s_marks_list else 0
    
    # Class
    all_marks = await db.marks.find({}).to_list(10000)
    student_marks_map = {} # sid -> [pct, pct]
    for m in all_marks:
        if m.get("max_marks", 0) > 0:
            sid = m["student_id"]
            if sid not in student_marks_map: student_marks_map[sid] = []
            student_marks_map[sid].append(m["marks_obtained"]/m["max_marks"]*100)
            
    marks_avgs = []
    for m_list in student_marks_map.values():
        if m_list: marks_avgs.append(sum(m_list)/len(m_list))
        
    marks_class_avg = sum(marks_avgs)/len(marks_avgs) if marks_avgs else 0
    marks_avgs.sort(reverse=True)
    top_10_marks_count = max(1, int(len(marks_avgs) * 0.1))
    marks_top_10 = sum(marks_avgs[:top_10_marks_count]) / top_10_marks_count if marks_avgs else 0
    
    # --- 3. Projects Stats ---
    # Student
    student_projects = await db.projects.count_documents({"student_id": student_id})
    
    # Class
    all_projects = await db.projects.find({}).to_list(10000)
    proj_counts = {}
    for p in all_projects:
        sid = p["student_id"]
        proj_counts[sid] = proj_counts.get(sid, 0) + 1
    
    proj_vals = list(proj_counts.values()) if proj_counts else [0]
    
    # FIX: Correctly count total students
    total_students = await db.users.count_documents({"role": "student"})
    proj_avg = sum(proj_vals) / max(1, total_students) 
    
    proj_vals.sort(reverse=True)
    top_10_proj_count = max(1, int(len(proj_vals) * 0.1))
    proj_top_10 = sum(proj_vals[:top_10_proj_count]) / top_10_proj_count if proj_vals else 0

    return [
        PeerComparisonStats(
            category="Attendance",
            student_score=round(student_att_pct, 1),
            class_average=round(att_avg, 1),
            top_10_percent_average=round(att_top_10, 1)
        ),
        PeerComparisonStats(
            category="Marks",
            student_score=round(student_marks_avg, 1),
            class_average=round(marks_class_avg, 1),
            top_10_percent_average=round(marks_top_10, 1)
        ),
        PeerComparisonStats(
            category="Projects",
            student_score=float(student_projects),
            class_average=round(proj_avg, 1),
            top_10_percent_average=round(proj_top_10, 1)
        )
    ]
