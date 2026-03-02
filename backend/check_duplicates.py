import asyncio
from app.db import db

async def check_duplicates():
    pipeline = [
        {"$group": {"_id": "$email", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}}
    ]
    duplicates = await db.users.aggregate(pipeline).to_list(100)
    print(f"Duplicate emails found: {duplicates}")
    
    # Also check all Sanjays again
    print("\nAll users named Sanjay:")
    cursor = db.users.find({"full_name": {"$regex": "Sanjay", "$options": "i"}})
    async for u in cursor:
        print(f"Name: {u.get('full_name')} | Email: {u.get('email')} | Role: {u.get('role')} | ID: {u.get('id')}")

if __name__ == "__main__":
    asyncio.run(check_duplicates())
