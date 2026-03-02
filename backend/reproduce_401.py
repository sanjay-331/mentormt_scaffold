import urllib.request
import urllib.parse
import json
from app.core.config import settings
from app.core.auth import create_access_token

def reproduce():
    # 1. Generate token for Naveen Kumar
    user_id = "a1dc0886-ec97-4862-96c1-f114d3970263"
    token = create_access_token(data={"sub": user_id})
    print(f"Using Token for user_id: {user_id}")
    
    url = "http://localhost:8000/api/messages/conversations"
    
    try:
        req = urllib.request.Request(url, method="GET")
        req.add_header("Authorization", f"Bearer {token}")
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            print(f"Status Code: {status}")
            data = response.read().decode("utf-8")
            print("Response Data (first 100 chars):", data[:100])
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error calling API: {e}")

if __name__ == "__main__":
    reproduce()
