import socketio

# Socket.IO setup
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# In-memory store for connected users: user_id -> sid
connected_users = {}
