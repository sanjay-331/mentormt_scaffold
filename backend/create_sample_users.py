import asyncio
from app.db import get_db
from app.core.security import get_password_hash

async def create_users():
    db = get_db()
    users = [
        {'email': 'admin@example.com',  'hashed_password': get_password_hash('password123'), 'full_name': 'Admin',  'role': 'admin'},
        {'email': 'mentor@example.com', 'hashed_password': get_password_hash('password123'), 'full_name': 'Mentor', 'role': 'mentor'},
        {'email': 'student@example.com','hashed_password': get_password_hash('password123'), 'full_name': 'Student','role': 'student'},
    ]
    for u in users:
        existing = await db['users'].find_one({'email': u['email']})
        if existing:
            print('Skipping (exists):', u['email'])
            continue
        res = await db['users'].insert_one(u)
        print('Inserted:', u['email'], res.inserted_id)

if __name__ == '__main__':
    asyncio.run(create_users())
