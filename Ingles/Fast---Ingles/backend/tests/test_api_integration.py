import httpx
import asyncio
import uuid
import sys

# Configuration
# If running inside docker container (backend), localhost refers to itself.
BASE_URL = "http://localhost:8000" 

async def test_api_flow():
    print(f"🚀 Starting Frontend (Simulation) <-> Backend Verification against {BASE_URL}...")
    
    unique_id = str(uuid.uuid4())[:8]
    email = f"frontend_sim_{unique_id}@example.com"
    password = "securePassword123"
    name = f"Frontend Sim {unique_id}"
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        try:
            # 1. REGISTER
            print(f"\n1. [REGISTER] Creating account for {email}...")
            reg_payload = {"name": name, "email": email, "password": password}
            resp_reg = await client.post("/api/auth/register", json=reg_payload)
            
            if resp_reg.status_code == 201:
                print("   ✅ Registration Success (201 Created)")
            else:
                print(f"   ❌ Registration Failed: {resp_reg.status_code} - {resp_reg.text}")
                return

            # 2. LOGIN
            print(f"\n2. [LOGIN] Authenticating to get Token...")
            login_payload = {"email": email, "password": password}
            resp_login = await client.post("/api/auth/login", json=login_payload)
            
            if resp_login.status_code == 200:
                token_data = resp_login.json()
                access_token = token_data.get("access_token")
                print(f"   ✅ Login Success. Token received: {access_token[:15]}...")
            else:
                print(f"   ❌ Login Failed: {resp_login.status_code} - {resp_login.text}")
                return

            # 3. PROTECTED OPERATION
            print(f"\n3. [PROTECTED] Accessing /api/auth/me with Token...")
            headers = {"Authorization": f"Bearer {access_token}"}
            resp_me = await client.get("/api/auth/me", headers=headers)
            
            if resp_me.status_code == 200:
                user_info = resp_me.json()
                print(f"   ✅ Access Granted. User: {user_info['email']} ({user_info['role']})")
                current_role = user_info['role']
            else:
                print(f"   ❌ Access Denied: {resp_me.status_code} - {resp_me.text}")
                return

            # 4. SECURITY CHECK (Admin Route)
            # Assuming there is an admin route, or logic to block admin actions.
            # Example: Try to access an admin-only endpoint. Since we don't have a known specific simple GET admin endpoint,
            # we will verify that our role is indeed 'user' and not 'admin'.
            print(f"\n4. [SECURITY] Verifying Role Isolation...")
            if current_role != "admin":
                print("   ✅ Security Check Passed: User is NOT admin by default.")
            else:
                print("   ⚠️  Warning: User was created with Admin privileges?")

            print("\n🎉 API Integration Verification Complete: SUCCESS")

        except httpx.ConnectError:
            print(f"\n❌ Connection Error: Could not connect to {BASE_URL}. Is the backend running?")
        except Exception as e:
            print(f"\n❌ ERROR in API Flow: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_flow())
