import socketio
from typing import Dict

# Socket.IO setup
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
sio_app = socketio.ASGIApp(sio)

# In-memory store for connected users: user_id -> sid
connected_users: Dict[str, str] = {}
