import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def setup_db():
    print("Preparing to initialize database...")
    clean_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    
    try:
        conn = await asyncpg.connect(clean_url)
        print("Connected.")
        
        with open("init.sql", "r", encoding="utf-8") as f:
            sql_content = f.read()
            
        print("Executing init.sql...")
        # Split by command might be safer, but asyncpg execute can handle blocks usually.
        # However, for triggers/functions, executing entire file can be tricky if not careful with $$ quoting.
        # Let's try executing as one block.
        await conn.execute(sql_content)
        
        print("SUCCESS: Database initialized and seeded.")
        await conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(setup_db())
