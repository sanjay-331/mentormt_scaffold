import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Mock global db before importing app modules that might use it
sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

# Mock socketio
sys.modules["app.server"] = MagicMock()
sys.modules["app.server"].sio = AsyncMock()
sys.modules["app.server"].connected_users = {}

from app.core.notifications import check_academic_risk

class TestNotificationLogic(unittest.IsolatedAsyncioTestCase):
    
    @patch("app.core.notifications.db")
    @patch("app.core.notifications.create_notification")
    async def test_risk_critical(self, mock_create_notify, mock_db):
        # Setup Mocks
        student_id = "student_123"
        
        # Mock Attendance (High risk: 50%)
        mock_db.attendance.find.return_value.to_list = AsyncMock(return_value=[
            {"status": "present"}, {"status": "absent"}
        ])
        
        # Mock Marks (High risk: 30%)
        mock_db.marks.find.return_value.to_list = AsyncMock(return_value=[
            {"marks_obtained": 30, "max_marks": 100}
        ])
        
        # Mock Mentor Assignment
        mock_db.assignments.find_one = AsyncMock(return_value={
            "mentor_id": "mentor_456",
            "student_ids": [student_id]
        })
        
        # Mock Student User
        mock_db.users.find_one = AsyncMock(return_value={
            "full_name": "John Doe",
            "usn": "1NT18CS001"
        })
        
        # Execute
        await check_academic_risk(student_id)
        
        # Verify Notification Created
        mock_create_notify.assert_called_once()
        args, kwargs = mock_create_notify.call_args
        self.assertEqual(kwargs["user_id"], "mentor_456")
        self.assertEqual(kwargs["type"], "critical")
        self.assertIn("John Doe", kwargs["title"])
        self.assertIn("CRITICAL", kwargs["message"])

    @patch("app.core.notifications.db")
    @patch("app.core.notifications.create_notification")
    async def test_risk_low(self, mock_create_notify, mock_db):
        # Setup Mocks
        student_id = "student_safe"
        
        # Mock Attendance (Safe: 100%)
        mock_db.attendance.find.return_value.to_list = AsyncMock(return_value=[
            {"status": "present"}
        ])
        
        # Mock Marks (Safe: 80%)
        mock_db.marks.find.return_value.to_list = AsyncMock(return_value=[
            {"marks_obtained": 80, "max_marks": 100}
        ])
        
        # Execute
        await check_academic_risk(student_id)
        
        # Verify NO Notification
        mock_create_notify.assert_not_called()

if __name__ == "__main__":
    unittest.main()
