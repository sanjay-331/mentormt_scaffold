import requests

print("Testing login with query parameters...")
url = "http://localhost:8000/api/auth/login"
params = {"email": "admin@demo.com", "password": "pass123"}
try:
    response = requests.post(url, params=params)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

print("\nTesting login with JSON body...")
try:
    response = requests.post(url, json=params)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
