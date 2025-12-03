import asyncio, pprint
from app.db import get_db

async def list_users():
    db = get_db()
    cursor = db['users'].find({}, {'email':1,'role':1})
    users = []
    async for u in cursor:
        u['_id'] = str(u['_id'])
        users.append(u)
    pprint.pprint(users)

if __name__ == "__main__":
    asyncio.run(list_users())
