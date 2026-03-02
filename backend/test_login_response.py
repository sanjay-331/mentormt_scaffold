import asyncio
from app.db import db
from app.core.auth import verify_password, create_access_token

async def test_login():
    email = "admin@demo.com"
    password = "pass123"
    
    with open("login_test_result.txt", "w", encoding="utf-8") as f:
        user = await db.users.find_one({"email": email})
        if not user:
            f.write(f"User {email} not found\n")
            return

        f.write(f"Found user: {user.get('full_name')} | Role: {user.get('role')} | ID: {user.get('id')}\n")
        
        password_hash = user.get("password_hash") or user.get("password")
        if verify_password(password, password_hash):
            f.write("Password verified!\n")
            token = create_access_token(data={"sub": user["id"]})
            f.write(f"Generated Token for sub: {user['id']}\n")
        else:
            f.write("Password verification failed\n")

if __name__ == "__main__":
    asyncio.run(test_login())
