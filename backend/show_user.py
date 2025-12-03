import asyncio, pprint
from app.db import get_db

async def show_admin(email='admin@example.com'):
    db = get_db()
    user = await db['users'].find_one({'email': email})
    if not user:
        print('USER NOT FOUND')
        return
    user['_id'] = str(user['_id'])
    # remove hashed_password before printing for safety
    if 'hashed_password' in user:
        user_copy = dict(user)
        user_copy['hashed_password'] = '<REDACTED>'
        pprint.pprint(user_copy)
    else:
        pprint.pprint(user)

if __name__ == "__main__":
    asyncio.run(show_admin())
