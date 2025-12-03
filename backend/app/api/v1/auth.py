from fastapi import APIRouter, HTTPException, Depends, status, Header, Body
from typing import Optional
from datetime import timedelta
from app.db import get_db
from app.models.user import UserCreate, UserOut
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from bson import ObjectId
import traceback

router = APIRouter()

@router.post('/register', response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    db = get_db()
    existing = await db['users'].find_one({'email': user.email})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    doc = user.dict()
    doc['hashed_password'] = get_password_hash(doc.pop('password'))
    res = await db['users'].insert_one(doc)
    created = await db['users'].find_one({'_id': res.inserted_id})
    created['_id'] = str(created['_id'])
    if 'hashed_password' in created:
        del created['hashed_password']
    return created

@router.post('/login')
async def login(payload: dict = Body(...)):
    """
    Accepts JSON body: { "email": "you@x.com", "password": "secret" }
    This version prefers documents that already have 'hashed_password' and
    falls back to legacy fields like 'password' or 'password_hash'.
    """
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        raise HTTPException(status_code=400, detail='Missing email or password')

    db = get_db()

    # Prefer a user document that already contains a modern 'hashed_password' field
    user = await db['users'].find_one({'email': email, 'hashed_password': {'': True}})
    if not user:
        # fallback to any user with that email (legacy documents)
        user = await db['users'].find_one({'email': email})

    if not user:
        print(f'[AUTH DEBUG] login attempt for email={email} -> user NOT FOUND')
        raise HTTPException(status_code=400, detail='Incorrect email or password')

    stored_keys = list(user.keys())
    # support multiple legacy field names
    stored = user.get('hashed_password') or user.get('password') or user.get('password_hash')
    print(f'[AUTH DEBUG] login attempt for email={email} -> user found, keys={stored_keys}')
    # indicate which field we're using
    if 'hashed_password' in user:
        used = 'hashed_password'
    elif 'password' in user:
        used = 'password'
    elif 'password_hash' in user:
        used = 'password_hash'
    else:
        used = 'none'
    print(f'[AUTH DEBUG] using stored field type: {used}')

    if not stored:
        print(f'[AUTH DEBUG] no stored credential for user {email}')
        raise HTTPException(status_code=400, detail='Incorrect email or password')

    # verify password (compatible with passlib context)
    try:
        ok = verify_password(password, stored)
    except Exception as e:
        ok = False
        print(f'[AUTH DEBUG] verify_password raised: {repr(e)}')

    print(f'[AUTH DEBUG] verify result for email={email}: {ok}')

    if not ok:
        # If verification failed for a legacy 'password_hash' format, we could migrate here
        # but for safety we simply return a generic error and log.
        raise HTTPException(status_code=400, detail='Incorrect email or password')

    token = create_access_token(subject=str(user.get('_id')), expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    print(f'[AUTH DEBUG] login successful for email={email}, issuing token (len={len(token)})')
    return {'access_token': token, 'token_type': 'bearer'}

# helper dependency to get current user
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing authorization header')
    scheme, _, token = authorization.partition(' ')
    if scheme.lower() != 'bearer' or not token:
        raise HTTPException(status_code=401, detail='Invalid authorization header')
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    user_id = payload.get('sub')
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid token payload')
    user = await db['users'].find_one({'_id': oid})
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    user['_id'] = str(user['_id'])
    if 'hashed_password' in user:
        del user['hashed_password']
    return user

@router.get('/me', response_model=UserOut)
async def me(current_user = Depends(get_current_user)):
    return current_user
