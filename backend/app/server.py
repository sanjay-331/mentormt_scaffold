"""
E-Mentor Mentee System: Backend Entry Point
Modularized, decentralized architecture.
"""
import os
import uuid
import logging
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import socketio
from app.sio_instance import sio
import app.sio_events # Register Socket.IO handlers

# Import the centralized router
from app.api.v1.routes import router as api_v1_router
from app.core.config import settings

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# Initialize FastAPI app
app = FastAPI(
    title="E-Mentor Mentee System API",
    description="Decentralized API for Student Mentorship Tracking",
    version="2.0.0"
)

# Configure CORS
origins_str = os.environ.get(
    "CORS_ORIGINS", 
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,https://mentormt-scaffold.vercel.app"
)
origins = [origin.strip() for origin in origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Centralized API Router
app.include_router(api_v1_router)

# Mount static files for uploads
uploads_dir = ROOT_DIR / "uploads"
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Wrap with Socket.IO ASGI application
socket_app = socketio.ASGIApp(sio, app)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "E-Mentor Mentee System",
        "version": "2.0.0",
        "docs": "/docs"
    }

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:socket_app", host="0.0.0.0", port=8000, reload=True)
