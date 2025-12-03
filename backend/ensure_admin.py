import asyncio
from app.db import get_db
from app.core.security import get_password_hash

async def ensure_admin(email='admin@example.com', pwd='password123'):
    db = get_db()
    hashed = get_password_hash(pwd)
    existing = await db['users'].find_one({'email': email})
    if existing:
        await db['users'].update_one({'email': email}, {'$set': {'hashed_password': hashed, 'role': 'admin', 'full_name': 'Admin'}})
        print('Updated existing user password.')
    else:
        user = {'email': email, 'hashed_password': hashed, 'full_name': 'Admin', 'role': 'admin'}
        res = await db['users'].insert_one(user)
        print('Inserted user id:', res.inserted_id)

if __name__ == "__main__":
    asyncio.run(ensure_admin())
