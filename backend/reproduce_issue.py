
import asyncio
import httpx

API_URL = "http://localhost:8000/api"

# Login as admin to get token
async def get_token():
    async with httpx.AsyncClient() as client:
        # Assuming there is a default admin user, or we use the seed data
        # Let's try to login with a known admin if possible, or created one.
        # For this script we assume the server is running and we can just use the endpoints if we have a token.
        # Since we don't know the exact admin credentials or if they seeded, 
        # let's assume standard 'admin@example.com' / 'admin' or similar if seeded,
        # or we might need to create one.
        # Let's try to register one first to be safe.
        ids = {}
        
        # 1. Create Admin
        try:
            res = await client.post(f"{API_URL}/auth/register", json={
                "email": "testadmin_unique@example.com",
                "password": "password123",
                "full_name": "Test Admin",
                "role": "admin"
            })
            if res.status_code == 200:
                print("Admin created")
            else:
                print("Admin likely exists")
        except Exception as e:
            print(f"Error creating admin: {e}")

        # Login
        res = await client.post(f"{API_URL}/auth/token", data={
            "username": "testadmin_unique@example.com",
            "password": "password123"
        })
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create 2 Mentors and 1 Student
        # Create Mentor 1
        res = await client.post(f"{API_URL}/auth/register", json={
            "email": "mentor1_unique@example.com",
            "password": "password123",
            "full_name": "Mentor One",
            "role": "mentor"
        })
        if res.status_code == 200:
             ids["m1"] = res.json()["user"]["id"]
        else:
             # fetch if exists (simplified)
             pass 

        # Create Mentor 2
        res = await client.post(f"{API_URL}/auth/register", json={
            "email": "mentor2_unique@example.com",
            "password": "password123",
            "full_name": "Mentor Two",
            "role": "mentor"
        })
        if res.status_code == 200:
             ids["m2"] = res.json()["user"]["id"]

        # Create Student
        res = await client.post(f"{API_URL}/auth/register", json={
            "email": "student_unique@example.com",
            "password": "password123",
            "full_name": "Student One",
            "role": "student"
        })
        if res.status_code == 200:
             ids["s1"] = res.json()["user"]["id"]

        # If creation failed (users exist), we need to fetch their IDs.
        # For now, let's assume we can fetch all users and find them.
        users_res = await client.get(f"{API_URL}/users", headers=headers)
        users = users_res.json()
        for u in users:
            if u["email"] == "mentor1_unique@example.com": ids["m1"] = u["id"]
            if u["email"] == "mentor2_unique@example.com": ids["m2"] = u["id"]
            if u["email"] == "student_unique@example.com": ids["s1"] = u["id"]
            
        return headers, ids

async def run():
    try:
        headers, ids = await get_token()
        print(f"IDs: {ids}")
        
        m1 = ids["m1"]
        m2 = ids["m2"]
        s1 = ids["s1"]
        
        # 1. Assign S1 to M1
        print("Assigning S1 to M1...")
        res = await httpx.AsyncClient().post(
            f"{API_URL}/assignments",
            json={"mentor_id": m1, "student_ids": [s1]},
            headers=headers
        )
        print(f"M1 Assignment Status: {res.status_code}")
        
        # Verify M1 has S1
        res = await httpx.AsyncClient().get(f"{API_URL}/assignments/mentor/{m1}", headers=headers)
        students_m1 = [s["id"] for s in res.json()["students"]]
        print(f"M1 Students: {students_m1}")
        assert s1 in students_m1
        
        # 2. Assign S1 to M2
        print("Assigning S1 to M2 (Should remove from M1)...")
        res = await httpx.AsyncClient().post(
            f"{API_URL}/assignments",
            json={"mentor_id": m2, "student_ids": [s1]},
            headers=headers
        )
        print(f"M2 Assignment Status: {res.status_code}")
        
        # 3. Verify M2 has S1
        res = await httpx.AsyncClient().get(f"{API_URL}/assignments/mentor/{m2}", headers=headers)
        students_m2 = [s["id"] for s in res.json()["students"]]
        print(f"M2 Students: {students_m2}")
        assert s1 in students_m2
        
        # 4. Verify M1 does NOT have S1
        res = await httpx.AsyncClient().get(f"{API_URL}/assignments/mentor/{m1}", headers=headers)
        students_m1_final = [s["id"] for s in res.json()["students"]]
        print(f"M1 Students Final: {students_m1_final}")
        
        if s1 in students_m1_final:
            print("❌ FAILURE: S1 is still assigned to M1!")
        else:
            print("✅ SUCCESS: S1 was removed from M1.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
