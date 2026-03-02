import urllib.request
import urllib.parse
import json

def test_login_api():
    base_url = "http://localhost:8000/api/auth/login"
    params = {"email": "admin@demo.com", "password": "pass123"}
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    try:
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            print(f"Status Code: {status}")
            data = response.read().decode("utf-8")
            result = json.loads(data)
            print("Response JSON:")
            print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error calling API: {e}")

if __name__ == "__main__":
    test_login_api()
