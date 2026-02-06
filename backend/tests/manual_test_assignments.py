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
    from app.api.assignments import create_assignment
    from app.models.user import AssignmentPayload
    # Import log_action to patch it if needed, or we patch via monkeypatching app.api.assignments.log_action
    import app.api.assignments
except Exception as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def test_assign_students_unique_constraint():
    print("\n[TEST] assign_students_unique_constraint")
    try:
        # Input
        payload = AssignmentPayload(mentor_id="m_new", student_ids=["s1", "s2"])
        current_user = {"id": "admin1", "role": "admin"}

        # Mocks
        mock_log = AsyncMock()
        app.api.assignments.log_action = mock_log
        
        db_mock = sys.modules["app.db"].db
        db_mock.assignments.find_one = AsyncMock(return_value=None)
        db_mock.assignments.insert_one = AsyncMock()
        db_mock.assignments.insert_one.return_value.inserted_id = "new_assign_id"
        db_mock.assignments.update_many = AsyncMock()
        db_mock.assignments.delete_many = AsyncMock()
        
        # Execute
        result = await create_assignment(payload, current_user)
        
        # Verify
        db_mock.assignments.update_many.assert_called()
        print("  - Verified: Students removed from old mentors")
        
        db_mock.assignments.insert_one.assert_called_once()
        insert_args = db_mock.assignments.insert_one.call_args[0][0]
        assert insert_args["mentor_id"] == "m_new"
        assert insert_args["student_ids"] == ["s1", "s2"]
        print("  - Verified: New assignment created correctly")
        
        mock_log.assert_called_once()
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")
        import traceback
        traceback.print_exc()

async def test_update_existing_assignment():
    print("\n[TEST] update_existing_assignment")
    try:
        # Input
        payload = AssignmentPayload(mentor_id="m_existing", student_ids=["s3"])
        current_user = {"id": "admin1", "role": "admin"}
        
        # Mocks
        mock_log = AsyncMock()
        app.api.assignments.log_action = mock_log
        
        db_mock = sys.modules["app.db"].db
        db_mock.assignments.update_many = AsyncMock()
        db_mock.assignments.find_one = AsyncMock(return_value={
            "mentor_id": "m_existing",
            "student_ids": ["s1"]
        })
        db_mock.assignments.update_one = AsyncMock()
        db_mock.assignments.delete_many = AsyncMock()
        
        # Execute
        await create_assignment(payload, current_user)
        
        # Verify
        db_mock.assignments.update_one.assert_called_once()
        update_args = db_mock.assignments.update_one.call_args
        assert update_args[0][0]["mentor_id"] == "m_existing"
        assert update_args[0][1]["$set"]["student_ids"] == ["s3"]
        print("  - Verified: Existing assignment updated correctly")
        
        print("PASS")
    except Exception as e:
        print(f"FAIL: {e}")
        import traceback
        traceback.print_exc()

async def run_all():
    await test_assign_students_unique_constraint()
    await test_update_existing_assignment()

if __name__ == "__main__":
    asyncio.run(run_all())
