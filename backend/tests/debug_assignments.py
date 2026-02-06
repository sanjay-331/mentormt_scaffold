import sys
import os
import asyncio
from unittest.mock import MagicMock

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Mock DB
sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

print("Attempting imports...")
try:
    from app.api.assignments import create_assignment
    from app.models.user import AssignmentPayload
    print("Imports successful")
except Exception as e:
    print(f"Import Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

async def run():
    print("Running test flow...")
    try:
        # Test Payload creation
        payload = AssignmentPayload(mentor_id="m1", student_ids=["s1"])
        print(f"Payload created: {payload}")
        
        # Call create_assignment
        current_user = {"id": "admin", "role": "admin"}
        
        # Mocking
        async def mock_log(*args, **kwargs):
            print("Log action called")
        
        import app.api.assignments
        app.api.assignments.log_action = mock_log
        
        # Mock db calls
        sys.modules["app.db"].db.assignments.find_one = AsyncMock(return_value=None)
        sys.modules["app.db"].db.assignments.insert_one = AsyncMock()
        sys.modules["app.db"].db.assignments.update_many = AsyncMock()
        sys.modules["app.db"].db.assignments.delete_many = AsyncMock()
        
        print("Calling create_assignment...")
        result = await create_assignment(payload, current_user)
        print("Success:", result)
        
    except Exception as e:
        print(f"Runtime Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    from unittest.mock import AsyncMock
    asyncio.run(run())
