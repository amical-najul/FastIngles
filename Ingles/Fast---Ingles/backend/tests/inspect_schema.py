import asyncio
import sys
sys.path.append(".")

from app.database import engine
from sqlalchemy import text

async def inspect_schema():
    async with engine.connect() as conn:
        # Get column names from the actual users table
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public'
            ORDER BY ordinal_position
        """))
        
        print("Columns in users table:")
        for row in result:
            print(f"  - {row[0]}: {row[1]}")

if __name__ == "__main__":
    asyncio.run(inspect_schema())
