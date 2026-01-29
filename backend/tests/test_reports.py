import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

from app.core.reports import generate_attendance_report, generate_marks_report

class TestReports(unittest.IsolatedAsyncioTestCase):
    
    @patch("app.core.reports.db")
    async def test_generate_attendance_pdf(self, mock_db):
        mock_db.attendance.find.return_value.to_list = AsyncMock(return_value=[
            {"student_id": "s1", "status": "present", "date": "2024-01-01"},
            {"student_id": "s1", "status": "absent",  "date": "2024-01-02"}
        ])
        
        pdf_bytes = await generate_attendance_report("pdf", "s1")
        self.assertTrue(len(pdf_bytes) > 0)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    @patch("app.core.reports.db")
    async def test_generate_marks_excel(self, mock_db):
        mock_db.marks.find.return_value.to_list = AsyncMock(return_value=[
            {"student_id": "s1", "subject": "Math", "marks": 90},
            {"student_id": "s1", "subject": "Science", "marks": 80}
        ])
        
        excel_bytes = await generate_marks_report("excel", "s1")
        self.assertTrue(len(excel_bytes) > 0)
        # Excel files (zip) usually start with PK
        self.assertTrue(excel_bytes.startswith(b"PK"))

if __name__ == "__main__":
    unittest.main()
