"""
CRUD Integration Test: Backend <-> Supabase Database

This script tests direct database operations using Supabase REST API client.
Simulates what the backend does when handling API requests.
"""
import asyncio
import sys
import hashlib
from datetime import datetime

sys.path.append(".")

from app.supabase_client import supabase
from app.utils.security import get_password_hash, verify_password

async def test_crud_flow():
    """Test complete CRUD operations on users table."""
    print("=" * 70)
    print("🧪 CRUD INTEGRATION TEST: Backend <-> Supabase")
    print("=" * 70)
    
    test_email = f"test_crud_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
    test_password = "SecurePass123!"
    user_id = None
    
    try:
        # ============================================================
        # 1. CREATE (INSERT) - Simula POST /register
        # ============================================================
        print("\n📝 [1/5] CREATE - Inserting test user...")
        
        password_hash = get_password_hash(test_password)
        
        user_data = {
            "name": "Test CRUD User",
            "email": test_email,
            "password": password_hash,
            "role": "user",
            "status": "active"
        }
        
        result = supabase.table("users").insert(user_data).execute()
        
        if result.data:
            user_id = result.data[0]["id"]
            print(f"✅ User created with ID: {user_id}")
            print(f"   Email: {test_email}")
        else:
            print("❌ Failed to create user")
            return False
        
        # ============================================================
        # 2. READ (SELECT) - Simula GET /users/{id}
        # ============================================================
        print("\n📖 [2/5] READ - Fetching user by ID...")
        
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if result.data:
            user = result.data[0]
            print(f"✅ User fetched successfully")
            print(f"   Name: {user['name']}")
            print(f"   Email: {user['email']}")
            print(f"   Role: {user['role']}")
            print(f"   Password hash present: {'password' in user and user['password'] is not None}")
        else:
            print("❌ Failed to fetch user")
            return False
        
        # ============================================================
        # 3. VERIFY PASSWORD - Simula POST /login
        # ============================================================
        print("\n🔐 [3/5] VERIFY PASSWORD - Simulating login...")
        
        stored_hash = user['password']
        if verify_password(test_password, stored_hash):
            print("✅ Password verification PASSED")
        else:
            print("❌ Password verification FAILED")
            return False
        
        # ============================================================
        # 4. UPDATE - Simula PATCH /users/{id}
        # ============================================================
        print("\n✏️  [4/5] UPDATE - Updating user status...")
        
        update_data = {
            "status": "inactive",
            "name": "Test CRUD User (Updated)"
        }
        
        result = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if result.data:
            updated_user = result.data[0]
            print(f"✅ User updated successfully")
            print(f"   New status: {updated_user['status']}")
            print(f"   New name: {updated_user['name']}")
        else:
            print("❌ Failed to update user")
            return False
        
        # ============================================================
        # 5. DELETE (CLEANUP) - Simula DELETE /users/{id}
        # ============================================================
        print("\n🗑️  [5/5] DELETE - Cleaning up test user...")
        
        result = supabase.table("users").delete().eq("id", user_id).execute()
        
        print("✅ Test user deleted successfully")
        
        # ============================================================
        # FINAL VERIFICATION
        # ============================================================
        print("\n" + "=" * 70)
        print("🎉 ALL CRUD OPERATIONS PASSED")
        print("=" * 70)
        print("\n✅ Backend <-> Supabase Database: WORKING")
        print("✅ Password hashing: WORKING")
        print("✅ Password verification: WORKING")
        print("✅ All CRUD operations: WORKING")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR during CRUD test: {e}")
        print(f"   Error type: {type(e).__name__}")
        
        # Cleanup on error
        if user_id:
            try:
                supabase.table("users").delete().eq("id", user_id).execute()
                print(f"🗑️  Cleaned up test user (ID: {user_id})")
            except:
                pass
        
        return False

if __name__ == "__main__":
    success = asyncio.run(test_crud_flow())
    sys.exit(0 if success else 1)
