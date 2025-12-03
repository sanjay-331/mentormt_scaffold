import asyncio
from app.db import get_db
from app.core.security import verify_password

async def check(email='admin@example.com', pwd='password123'):
    db = get_db()
    user = await db['users'].find_one({'email': email})
    if not user:
        print('USER NOT FOUND')
        return
    hashed = user.get('hashed_password') or user.get('password')
    ok = verify_password(pwd, hashed)
    print('verify_password result:', ok)

if __name__ == "__main__":
    asyncio.run(check())
