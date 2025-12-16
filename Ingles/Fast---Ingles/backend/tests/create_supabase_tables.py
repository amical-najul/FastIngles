import asyncio
import sys
sys.path.append(".")

from app.config import get_settings
from supabase import create_client

settings = get_settings()

async def create_tables():
    """Create all tables in Supabase using stored SQL file."""
    # Initialize Supabase client
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    # Read SQL file
    with open('supabase_schema.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print("🚀 Creating tables in Supabase...")
    print("=" * 50)
    
    try:
        # Execute SQL via Supabase REST API
        # Note: Supabase REST API doesn't directly support arbitrary SQL execution
        # We need to use the PostgREST API's rpc function or direct SQL Editor
        
        # Alternative: Create tables individually using table creation endpoint
        print("⚠️  Supabase REST API doesn't support direct SQL execution.")
        print("📝 SQL schema saved to: supabase_schema.sql")
        print()
        print("✅ NEXT STEP: Execute SQL manually in Supabase Dashboard:")
        print("   1. Go to https://supabase.com/dashboard")
        print("   2. Select project: bfwrxznfgvsdcjznulon")
        print("   3. Click 'SQL Editor' in sidebar")
        print("   4. Copy content from supabase_schema.sql")
        print("   5. Paste and click 'Run'")
        print()
        print("=" * 50)
        
        # Verify we can connect to Supabase
        try:
            result = supabase.table("users").select("count").execute()
            print("✅ Supabase connection verified")
        except Exception as e:
            if "relation \"users\" does not exist" in str(e) or "PGRST204" in str(e):
                print("⏳ Table 'users' doesn't exist yet (expected)")
            else:
                print(f"❌ Connection test failed: {e}")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(create_tables())
