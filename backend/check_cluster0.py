import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_cluster0():
    url = "mongodb+srv://root:12345@cluster0.yoy9wjb.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(url)
    db = client["Cluster0"]
    
    print("Checking Cluster0 database...")
    cursor = db.users.find({"full_name": {"$regex": "Sanjay", "$options": "i"}})
    async for u in cursor:
        print(f"Name: {u.get('full_name')} | Email: {u.get('email')} | Role: {u.get('role')} | ID: {u.get('id')}")

if __name__ == "__main__":
    asyncio.run(check_cluster0())
