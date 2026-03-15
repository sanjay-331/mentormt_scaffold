
from jose import jwt
from datetime import datetime, timezone, timedelta

def test_jwt():
    SECRET_KEY = "test"
    ALGORITHM = "HS256"
    to_encode = {"sub": "123"}
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)
    to_encode.update({"exp": expire})
    
    try:
        print("Attempting to encode JWT with datetime exp...")
        token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        print("Success:", token)
    except Exception as e:
        print("FAILED:", type(e), e)

if __name__ == "__main__":
    test_jwt()
