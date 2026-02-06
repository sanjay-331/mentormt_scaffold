import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Mock DB before importing app modules
sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

print("DEBUG: Attempting imports in test_assignments.py")
try:
    from app.api.assignments import create_assignment
    from app.models.user import AssignmentPayload
    print("DEBUG: Imports successful")
except Exception as e:
    print(f"DEBUG: Import Failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

class TestAssignments(unittest.IsolatedAsyncioTestCase):
    
    async def test_assign_students_unique_constraint(self):
        try:
            """
            Test that assigning students to a new mentor removes them from old mentors
            and assigns them to the new one.
            """
            # Input payload
            payload = AssignmentPayload(
                mentor_id="m_new",
                student_ids=["s1", "s2"]
            )
            current_user = {"id": "admin1", "role": "admin"}

            # Manual Patching
            with patch("app.api.assignments.db") as mock_db, \
                 patch("app.api.assignments.log_action", new_callable=AsyncMock) as mock_log:
                
                print("DEBUG: Inside test patch context")
                
                # Mock DB behaviors
                mock_db.assignments.find_one.return_value = None
                mock_db.assignments.insert_one.return_value.inserted_id = "new_assign_id"
                
                # Execute
                result = await create_assignment(payload, current_user)
                print("DEBUG: create_assignment returned")
                
                # Verification 1: Update Many (Pull)
                mock_db.assignments.update_many.assert_called()
                
                # Verification 2: Insert One (New Assignment)
                mock_db.assignments.insert_one.assert_called_once()
                insert_args = mock_db.assignments.insert_one.call_args[0][0]
                self.assertEqual(insert_args["mentor_id"], "m_new")
                self.assertEqual(insert_args["student_ids"], ["s1", "s2"])
                
                # Verification 3: Audit Log
                mock_log.assert_called_once()
                print("DEBUG: Test passed")
        except Exception as e:
            print(f"DEBUG: TEST FAILED with error: {e}")
            import traceback
            traceback.print_exc()
            raise e

    async def test_update_existing_assignment(self):
        """
        Test updating an existing mentor's student list.
        """
        payload = AssignmentPayload(
            mentor_id="m_existing",
            student_ids=["s3"]
        )
        current_user = {"id": "admin1", "role": "admin"}
        
        with patch("app.api.assignments.db") as mock_db, \
             patch("app.api.assignments.log_action", new_callable=AsyncMock) as mock_log:
             
            # 1. update_many (cleanup)
            mock_db.assignments.update_many = AsyncMock()
            
            # 2. find_one (exists)
            mock_db.assignments.find_one.return_value = {
                "mentor_id": "m_existing", 
                "student_ids": ["s1"] # Was assigned s1 before
            }
            
            # 3. update_one (replace list)
            mock_db.assignments.update_one = AsyncMock()
            mock_db.assignments.delete_many = AsyncMock()

            # Execute
            await create_assignment(payload, current_user)
            
            # Verification
            mock_db.assignments.update_one.assert_called_once()
            update_args = mock_db.assignments.update_one.call_args
            
            # Should update mentor_id=m_existing
            self.assertEqual(update_args[0][0]["mentor_id"], "m_existing")
            
            # Should set student_ids to ["s3"]
            self.assertEqual(update_args[0][1]["$set"]["student_ids"], ["s3"])

if __name__ == "__main__":
    unittest.main()
