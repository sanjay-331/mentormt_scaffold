import asyncio
from app.db import get_db
from app.core.security import get_password_hash

async def create_user():
    db = get_db()
    user = {'email': 'admin@example.com', 'hashed_password': get_password_hash('password123'), 'full_name': 'Admin', 'role': 'admin'}
    existing = await db['users'].find_one({'email': user['email']})
    if existing:
        print('User exists:', existing['_id'])
        return
    res = await db['users'].insert_one(user)
    print('Inserted user id:', res.inserted_id)

if __name__ == '__main__':
    asyncio.run(create_user())
