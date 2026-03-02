import requests
import json

def test_login_api():
    url = "http://localhost:8000/api/auth/login"
    params = {"email": "admin@demo.com", "password": "pass123"}
    
    try:
        response = requests.post(url, params=params)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            # masks password
            print("Response JSON:")
            print(json.dumps(result, indent=2))
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Error calling API: {e}")

if __name__ == "__main__":
    test_login_api()
