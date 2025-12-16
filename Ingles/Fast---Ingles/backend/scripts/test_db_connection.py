import asyncio
import os
import asyncpg
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load env variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def test_connection():
    print("Testing connection to Supabase...")
    print(f"URL: {DATABASE_URL.split('@')[-1]}")  # Print only host part for security

    try:
        # Pasing the URL strictly to debug if needed
        # Expected format: postgresql+asyncpg://user:pass@host:port/dbname
        # We need to strip standard prefix for asyncpg if it doesn't like 'postgresql+asyncpg'
        # asyncpg.connect expects 'postgresql://' or just parameters.
        clean_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        
        conn = await asyncpg.connect(clean_url)
        print("\nSUCCESS: Connected to Database!")
        
        # Test query
        version = await conn.fetchval("SELECT version()")
        print(f"Database Version: {version}")
        
        await conn.close()
        print("Connection closed.")
        return True
    except Exception as e:
        print(f"\nFAILED: Could not connect.")
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_connection())
