import asyncio
import sys
sys.path.append(".")

from app.supabase_client import supabase

async def inspect_schema():
    """Inspect actual Supabase table schemas."""
    print("=" * 70)
    print("🔍 INSPECTING SUPABASE SCHEMA")
    print("=" * 70)
    
    tables = ["users", "lessons", "progress", "audio_cache"]
    
    for table in tables:
        print(f"\n📋 Table: {table}")
        print("-" * 70)
        
        try:
            # Get first row to see structure
            result = supabase.table(table).select("*").limit(1).execute()
            
            if result.data:
                print("✅ Table exists")
                print("Columns found:")
                for key in result.data[0].keys():
                    print(f"  - {key}")
            else:
                print("⚠️  Table exists but is EMPTY")
                print("Cannot determine columns from empty table")
                
        except Exception as e:
            error_msg = str(e)
            if "relation" in error_msg and "does not exist" in error_msg:
                print(f"❌ Table does NOT exist: {error_msg}")
            elif "PGRST204" in error_msg:
                print(f"❌ Table does NOT exist (PGRST204)")
            else:
                print(f"❌ Error: {error_msg}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    asyncio.run(inspect_schema())
