# backend/app/main.py

"""
Entry point for the new scaffold backend.
We simply reuse the existing server.py (legacy backend)
which defines:
    - FastAPI app
    - Socket.IO ASGI app (socket_app)
All routes like /api/auth/login, /api/attendance, etc. remain the same.
"""

from app.server import socket_app

# Uvicorn will look for a variable called `app`.
# We point it to the Socket.IO ASGI app, which wraps FastAPI.
app = socket_app
