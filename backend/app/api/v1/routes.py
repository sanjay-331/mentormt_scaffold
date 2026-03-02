from fastapi import APIRouter
from app.api.v1 import auth as auth_router
from app.api.v1 import global_router
from app.api import academic, comm, user, reporting, stats, portfolio, activity, master, assignments, notifications, subjects

router = APIRouter()

# Authentication
router.include_router(auth_router.router, tags=["Authentication"])

# Core Modules
router.include_router(academic.router)
router.include_router(comm.router)
router.include_router(user.router)
router.include_router(reporting.router)

# Pre-existing Routers (Legacy/Compatibility)
router.include_router(stats.router)
router.include_router(portfolio.router)
router.include_router(activity.router)
router.include_router(master.router)
router.include_router(assignments.router)
router.include_router(notifications.router)
router.include_router(subjects.router)

# Global Services (Search, Audit, Recs)
router.include_router(global_router.router)