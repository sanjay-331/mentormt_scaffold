from datetime import datetime, timezone
import uuid
from app.sio_instance import sio, connected_users
from app.db import db

# ==================== Socket.IO Events ====================

@sio.event
async def connect(sid, environ):
    """Handles new client connections."""
    print(f"Client connected: {sid}")
    
    # Extract user_id from query params: /socket.io/?user_id=123
    # Note: Logic here handles the auto-connect if query param is present
    query_string = environ.get("QUERY_STRING", "")
    params = {}
    if query_string:
         params = dict(qs.split("=") for qs in query_string.split("&") if "=" in qs)
    
    user_id = params.get("user_id")
    
    if user_id:
        connected_users[user_id] = sid
        print(f"User {user_id} auto-connected with SID={sid}")
        await sio.emit("connection_ack", {"status": "connected", "sid": sid}, to=sid)


@sio.event
async def disconnect(sid):
    """Handles client disconnections."""
    print(f"Client disconnected: {sid}")
    # Remove from connected users
    for user_id, user_sid in list(connected_users.items()):
        if user_sid == sid:
            del connected_users[user_id]
            print(f"Removed User {user_id} from connected users")
            break


@sio.event
async def authenticate(sid, data):
    """Authenticates a user for Socket.IO (if not done via query param)."""
    user_id = data.get("user_id")
    if user_id:
        connected_users[user_id] = sid
        print(f"User {user_id} authenticated via event with SID {sid}")
        await sio.emit("authenticated", {"status": "ok"}, to=sid)


@sio.event
async def send_message(sid, data):
    """Handles sending a new chat message."""
    # Data validation could be stricter here using Pydantic
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    content = data.get("content")
    
    if not (sender_id and receiver_id and content):
        return # Or emit error
        
    message_data = {
        "id": str(uuid.uuid4()),
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Save to database
    await db.messages.insert_one(message_data)

    # Emit to receiver if online
    receiver_sid = connected_users.get(receiver_id)
    if receiver_sid:
        await sio.emit("new_message", message_data, room=receiver_sid)

    # Emit back to sender (confirmation/update UI)
    await sio.emit("message_sent", message_data, room=sid)
