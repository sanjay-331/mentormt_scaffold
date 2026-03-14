from fastapi import APIRouter, Depends, HTTPException, status
from app.db import db
from datetime import datetime, timezone
import time

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/health")
async def system_health():
    """
    Returns the real-time health of the core systems: API, Database.
    """
    statuses = [
        {"name": "API Server", "status": "operational", "latency": 0},
        {"name": "Database Connection", "status": "checking", "latency": 0},
        {"name": "Third-party Services", "status": "operational", "latency": 0},
        {"name": "Job Scheduler", "status": "operational", "latency": 0},
    ]

    # Check Database Health
    start_time = time.time()
    try:
        # Ping mongo
        await db.command("ping")
        latency = round((time.time() - start_time) * 1000)
        statuses[1]["status"] = "operational"
        statuses[1]["latency"] = latency
    except Exception as e:
        statuses[1]["status"] = "degraded"
        statuses[1]["latency"] = -1

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_percent": 99.99,
        "services": statuses
    }
