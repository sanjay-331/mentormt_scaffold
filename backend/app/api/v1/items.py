from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId
from app.db import get_db
from app.schemas.item import ItemCreate, ItemUpdate, ItemOut

router = APIRouter()


@router.post("/", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate):
    db = get_db()
    doc = item.dict()
    result = await db["items"].insert_one(doc)
    created = await db["items"].find_one({"_id": result.inserted_id})
    # convert _id to str for response (ItemOut expects alias "_id")
    created["_id"] = str(created["_id"])
    return created


@router.get("/", response_model=List[ItemOut])
async def list_items():
    db = get_db()
    items = []
    cursor = db["items"].find({})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    return items


@router.get("/{item_id}", response_model=ItemOut)
async def get_item(item_id: str):
    db = get_db()
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    doc = await db["items"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")
    doc["_id"] = str(doc["_id"])
    return doc


@router.put("/{item_id}", response_model=ItemOut)
async def update_item(item_id: str, item: ItemUpdate):
    db = get_db()
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")

    update_doc = {k: v for k, v in item.dict().items() if v is not None}
    if not update_doc:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db["items"].update_one({"_id": oid}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    doc = await db["items"].find_one({"_id": oid})
    doc["_id"] = str(doc["_id"])
    return doc


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: str):
    db = get_db()
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    result = await db["items"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return None
