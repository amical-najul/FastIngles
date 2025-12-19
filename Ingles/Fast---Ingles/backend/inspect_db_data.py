import asyncio
import os
import sys
import json

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.supabase_client import get_supabase

async def inspect_data():
    print("🔍 INSPECTING DATABASE CONTENT...\n")
    
    supabase = get_supabase()
    
    # 1. INSPECT USERS
    print("--- 👥 USERS ---")
    try:
        res = supabase.table("users").select("id, email, role, status").execute()
        users = res.data
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f" - [{u['role']}] {u['email']} (Status: {u['status']})")
    except Exception as e:
        print(f"❌ Error fetching users: {e}")

    print("\n" + "="*30 + "\n")

    # 2. INSPECT LESSONS
    print("--- 📚 LESSONS ---")
    try:
        # Fetch just headers first
        res = supabase.table("lessons").select("day_id, topic, category, word_count").order("day_id").execute()
        lessons = res.data
        print(f"Total Lessons: {len(lessons)}")
        
        if not lessons:
            print("⚠️ WARNING: No lessons found in the database!")
        
        for l in lessons:
            print(f" - Day {l['day_id']}: {l['topic']} ({l['category']}, {l['word_count']} words)")
            
        # 3. INSPECT LESSON 1 DETAIL (Verbs Level 1)
        print("\n--- 🔬 DETAILED INSPECTION: DAY 1 ---")
        res_detail = supabase.table("lessons").select("*").eq("day_id", 1).execute()
        if res_detail.data:
            l1 = res_detail.data[0]
            print(f"Topic: {l1['topic']}")
            print(f"Content Type: {type(l1.get('content'))}")
            
            content = l1.get('content')
            if isinstance(content, str):
                try:
                    content = json.loads(content)
                    print("✅ Content is a JSON string (parsed successfully)")
                except:
                    print("❌ Content is a string but FAILED to parse as JSON")
            elif isinstance(content, list):
                print("✅ Content is already a List/Object")
            
            if content and len(content) > 0:
                print(f"First word: {content[0]}")
            else:
                print("⚠️ Content is empty or invalid format")
        else:
            print("❌ Lesson Day 1 NOT FOUND. This explains why 'Verbs Level 1' is not loading.")

    except Exception as e:
        print(f"❌ Error fetching lessons: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_data())
