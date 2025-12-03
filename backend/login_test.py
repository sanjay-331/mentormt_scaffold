import httpx, sys

API = 'http://127.0.0.1:8000/api/v1'
creds = {'email': 'admin@example.com', 'password': 'password123'}

with httpx.Client(timeout=20.0) as c:
    r = c.post(f'{API}/auth/login', json=creds)
    print('STATUS:', r.status_code)
    try:
        print('BODY:', r.json())
    except:
        print('BODY (raw):', r.text)
    if r.status_code == 200:
        token = r.json().get('access_token')
        print('\\nTOKEN LEN:', len(token) if token else 'none')
        if token:
            r2 = c.get(f'{API}/auth/me', headers={'Authorization': f'Bearer {token}'})
            print('\\n/me STATUS:', r2.status_code)
            try:
                print('/me BODY:', r2.json())
            except:
                print('/me BODY (raw):', r2.text)
