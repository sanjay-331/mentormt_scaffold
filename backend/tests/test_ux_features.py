import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

from app.core.search import global_search
from app.core.recommendations import recommend_mentors

class TestUXFeatures(unittest.IsolatedAsyncioTestCase):
    
    @patch("app.core.search.db")
    async def test_global_search(self, mock_db):
        # Mock Users
        mock_db.users.find.return_value.limit.return_value.to_list = AsyncMock(return_value=[
            {"full_name": "John Doe", "email": "john@example.com", "role": "student"}
        ])
        # Mock Circulars
        mock_db.circulars.find.return_value.limit.return_value.to_list = AsyncMock(return_value=[
            {"title": "Holiday", "target_audience": "all"}
        ])
        
        results = await global_search("john", "admin")
        self.assertEqual(len(results["users"]), 1)
        self.assertEqual(results["users"][0]["full_name"], "John Doe")
        self.assertEqual(len(results["circulars"]), 1)

    @patch("app.core.recommendations.db")
    async def test_recommend_mentors(self, mock_db):
        # Mock Student
        mock_db.users.find_one = AsyncMock(return_value={"department": "CS"})
        
        # Mock Mentors in Dept
        mock_db.users.find.return_value.to_list = AsyncMock(return_value=[
            {"id": "m1", "full_name": "Mentor A", "department": "CS"},
            {"id": "m2", "full_name": "Mentor B", "department": "CS"}
        ])
        
        # Mock Assignments (Workload)
        # Mentor 1 has 1 student, Mentor 2 has 0
        mock_db.assignments.find.return_value.to_list = AsyncMock(return_value=[
            {"mentor_id": "m1", "student_ids": ["s1"]}
        ])
        
        recommendations = await recommend_mentors("s_current")
        
        # Expect m2 (load 0) to be before m1 (load 1)
        self.assertEqual(recommendations[0]["id"], "m2")
        self.assertEqual(recommendations[1]["id"], "m1")
        self.assertEqual(recommendations[0]["current_load"], 0)

if __name__ == "__main__":
    unittest.main()
