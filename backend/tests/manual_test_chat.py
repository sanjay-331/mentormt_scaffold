import asyncio
import socketio
import sys

# Create two clients: Sender and Receiver
sio_sender = socketio.AsyncClient(logger=True, engineio_logger=True)
sio_receiver = socketio.AsyncClient(logger=True, engineio_logger=True)

SERVER_URL = "http://localhost:8000"

@sio_receiver.event
async def connect():
    print("Receiver Connected")

@sio_receiver.event
async def new_message(data):
    print(f"Receiver got message: {data['content']} from {data['sender_id']}")
    # Assertions in a script like this are manual checks
    if data['content'] == "Hello World":
        print("PASS: Message content received correctly")
    else:
        print("FAIL: Content mismatch")

@sio_sender.event
async def connect():
    print("Sender Connected")

@sio_sender.event
async def message_sent(data):
    print(f"Sender got ack: {data['content']}")

async def main():
    try:
        print("Attempting Anonymous Connection...")
        # Simple connect, no params
        await sio_sender.connect(SERVER_URL, transports=['websocket', 'polling'])
        print("PASS: Anonymous Connected")
        await sio_sender.disconnect()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
