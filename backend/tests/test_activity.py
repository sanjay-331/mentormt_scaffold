import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os
from datetime import datetime, timezone

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Mock DB
sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

from app.api.activity import get_recent_activity

class TestActivity(unittest.IsolatedAsyncioTestCase):
    
    @patch("app.api.activity.db")
    async def test_pagination_and_sorting(self, mock_db):
        """
        Verify that:
        1. It fetches sufficient items from each source (skip + limit).
        2. It sorts mixed types (Circulars vs Users) by time properly.
        3. It slices the final result correctly based on skip/limit.
        """
        user = {"id": "admin1", "role": "admin"}
        limit = 2
        skip = 1
        # Expectation: fetch_limit = 1 + 2 = 3.
        # It should fetch 3 circulars and 3 users, sort them (6 total), and return items at index [1:3] (2 items).
        
        # Mock Circulars (Assume 3 recent circulars)
        # Use simple ISO strings for dates
        c1 = {"title": "C1", "created_at": "2024-01-01T12:00:00Z"} # Oldest
        c2 = {"title": "C2", "created_at": "2024-01-02T12:00:00Z"}
        c3 = {"title": "C3", "created_at": "2024-01-03T12:00:00Z"} # Newest
        
        mock_db.circulars.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[c3, c2, c1])
        
        # Mock New Users (Assume 1 recent user)
        u1 = {"full_name": "U1", "role": "student", "created_at": "2024-01-02T15:00:00Z"} # Newer than C2, older than C3
        
        mock_db.users.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[u1])
        
        # Execute
        results = await get_recent_activity(current_user=user, limit=limit, skip=skip)
        
        # Verification
        
        # 1. Check fetch_limit usage
        # circulars.limit(fetch_limit) -> limit(3)
        mock_db.circulars.find.return_value.sort.return_value.limit.assert_called_with(3)
        
        # 2. Check Order
        # Merged pool of 4 items sorted desc by time:
        # 1. C3 (Jan 3 12:00)
        # 2. U1 (Jan 2 15:00) 
        # 3. C2 (Jan 2 12:00)
        # 4. C1 (Jan 1 12:00)
        
        # 3. Check Slice [skip=1 : skip+limit=3]
        # Should return indices 1 and 2 -> [U1, C2]
        
        self.assertEqual(len(results), 2)
        
        self.assertEqual(results[0]["type"], "user")
        self.assertEqual(results[0]["user"], "U1")
        
        self.assertEqual(results[1]["type"], "circular")
        self.assertEqual(results[1]["title"], "C2")

    @patch("app.api.activity.db")
    async def test_pagination_empty_page(self, mock_db):
        """
        Verify empty result if skip is beyond range.
        """
        user = {"id": "admin1", "role": "admin"}
        limit = 10
        skip = 100
        
        # Return empty lists
        mock_db.circulars.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
        mock_db.users.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
        
        results = await get_recent_activity(current_user=user, limit=limit, skip=skip)
        
        self.assertEqual(results, [])

if __name__ == "__main__":
    unittest.main()
