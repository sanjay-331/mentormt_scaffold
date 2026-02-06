import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Mock DB globally
sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

try:
    from app.api.activity import get_recent_activity
except Exception as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def test_pagination_and_sorting():
    print("\n[TEST] pagination_and_sorting")
    try:
        user = {"id": "admin1", "role": "admin"}
        limit = 2
        skip = 1
        
        # Mock DB
        db_mock = sys.modules["app.db"].db
        
        # Circulars: C3 (newest), C2, C1
        c1 = {"title": "C1", "created_at": "2024-01-01T12:00:00Z"} 
        c2 = {"title": "C2", "created_at": "2024-01-02T12:00:00Z"}
        c3 = {"title": "C3", "created_at": "2024-01-03T12:00:00Z"}
        
        db_mock.circulars.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[c3, c2, c1])
        
        # Users: U1 (middle)
        u1 = {"full_name": "U1", "role": "student", "created_at": "2024-01-02T15:00:00Z"}
        
        db_mock.users.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[u1])
        
        # Execute
        results = await get_recent_activity(current_user=user, limit=limit, skip=skip)
        
        # Verify
        # Expected fetch_limit = 3
        db_mock.circulars.find.return_value.sort.return_value.limit.assert_called_with(3)
        print("  - Verified: Fetch limit calculation")
        
        # Expected Sort Order: C3, U1, C2, C1
        # Expected Slice [1:3]: U1, C2
        
        assert len(results) == 2
        assert results[0]["type"] == "user"
        assert results[0]["user"] == "U1"
        assert results[1]["type"] == "circular"
        assert results[1]["title"] == "C2"
        print("  - Verified: Sorting and Slicing")
        
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")
        import traceback
        traceback.print_exc()

async def test_pagination_empty_page():
    print("\n[TEST] pagination_empty_page")
    try:
        user = {"id": "admin1", "role": "admin"}
        limit = 10
        skip = 100
        
        db_mock = sys.modules["app.db"].db
        db_mock.circulars.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
        db_mock.users.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
        
        results = await get_recent_activity(current_user=user, limit=limit, skip=skip)
        
        assert results == []
        print("  - Verified: Empty page handling")
        
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")
        import traceback
        traceback.print_exc()

async def run_all():
    await test_pagination_and_sorting()
    await test_pagination_empty_page()

if __name__ == "__main__":
    asyncio.run(run_all())
