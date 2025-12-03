from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Use pbkdf2_sha256 to avoid bcrypt 72-byte issues on some platforms.
# pbkdf2_sha256 is secure and easy for development/testing.
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# JWT creation / verification
SECRET_KEY = getattr(settings, 'SECRET_KEY', 'change_me')
ALGORITHM = getattr(settings, 'ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(getattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES', 60))

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(subject), "exp": datetime.utcnow() + expires_delta}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
