import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def fix_table():
    print("Fixing lessons table schema...")
    clean_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    
    try:
        conn = await asyncpg.connect(clean_url)
        print("Connected.")
        
        # Add category column if it doesn't exist
        await conn.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'lessons' AND column_name = 'category') THEN
                    ALTER TABLE lessons ADD COLUMN category VARCHAR(50);
                END IF;
            END $$;
        """)
        
        print("SUCCESS: lessons.category column ensured.")
        await conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fix_table())
