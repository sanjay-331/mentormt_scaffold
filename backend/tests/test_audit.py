import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

sys.modules["app.db"] = MagicMock()
sys.modules["app.db"].db = MagicMock()

from app.core.audit import log_action

class TestAuditLogs(unittest.IsolatedAsyncioTestCase):
    
    @patch("app.core.audit.db")
    async def test_log_action(self, mock_db):
        mock_db.audit_logs.insert_one = AsyncMock()
        
        await log_action("u1", "LOGIN", "auth", ip_address="1.2.3.4")
        
        mock_db.audit_logs.insert_one.assert_called_once()
        call_args = mock_db.audit_logs.insert_one.call_args[0][0]
        
        self.assertEqual(call_args["user_id"], "u1")
        self.assertEqual(call_args["action"], "LOGIN")
        self.assertEqual(call_args["resource"], "auth")
        self.assertEqual(call_args["ip_address"], "1.2.3.4")
        self.assertIn("timestamp", call_args)

if __name__ == "__main__":
    unittest.main()
