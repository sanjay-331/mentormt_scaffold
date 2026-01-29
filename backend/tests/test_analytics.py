import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

from app.core.analytics import get_system_risk_distribution, get_department_performance, predict_student_outcome

class TestAnalytics(unittest.IsolatedAsyncioTestCase):
    
    @patch("app.core.analytics.db")
    async def test_system_risk_distribution(self, mock_db):
        # Mock Students
        mock_db.users.find.return_value.to_list = AsyncMock(return_value=[
            {"id": "s1", "role": "student"}, 
            {"id": "s2", "role": "student"},
            {"id": "s3", "role": "student"}
        ])
        
        # Mock Attendance (s1=High Risk, s2=Safe, s3=Safe)
        mock_db.attendance.find.return_value.to_list = AsyncMock(return_value=[
            {"student_id": "s1", "status": "absent"}, # 0%
            {"student_id": "s2", "status": "present"}, # 100%
            {"student_id": "s3", "status": "present"}  # 100%
        ])
        
        # Mock Marks
        mock_db.marks.find.return_value.to_list = AsyncMock(return_value=[
            {"student_id": "s1", "marks_obtained": 30, "max_marks": 100}, # 30%
            {"student_id": "s2", "marks_obtained": 85, "max_marks": 100}, # 85%
            {"student_id": "s3", "marks_obtained": 90, "max_marks": 100}  # 90%
        ])
        
        result = await get_system_risk_distribution()
        
        self.assertEqual(result["high"], 1) # s1
        self.assertEqual(result["medium"], 0)
        self.assertEqual(result["low"], 2) # s2, s3
        
    @patch("app.core.analytics.db")
    async def test_predict_student_outcome(self, mock_db):
        student_id = "s1"
        
        # Mock Marks
        mock_db.marks.find.return_value.to_list = AsyncMock(return_value=[
            {"marks_obtained": 80, "max_marks": 100},
            {"marks_obtained": 90, "max_marks": 100}
        ])
        
        result = await predict_student_outcome(student_id)
        
        self.assertEqual(result["prediction"], "Outstanding (Distinction)")
        self.assertAlmostEqual(result["projected_percentage"], 85.0)

if __name__ == "__main__":
    unittest.main()
