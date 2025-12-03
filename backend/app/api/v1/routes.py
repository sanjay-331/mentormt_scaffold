from fastapi import APIRouter
from app.api.v1 import auth as auth_module
from app.api.v1 import items as items_module

router = APIRouter()

@router.get("/ping")
async def ping():
    return {"ping": "pong"}

router.include_router(items_module.router, prefix="/items", tags=["items"])
router.include_router(auth_module.router, prefix="/auth", tags=["auth"])