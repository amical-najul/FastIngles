import asyncio
import logging
from app.database import async_session
from sqlalchemy import text
from app.services.storage_service import get_storage_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def cleanup_system():
    logger.info("Starting System Cleanup...")

    # 1. Clean Database Tables
    logger.info("Cleaning Database Tables (lessons, audio_cache)...")
    async with async_session() as session:
        try:
            # Truncate tables but keep users
            await session.execute(text("TRUNCATE TABLE lessons CASCADE;"))
            await session.execute(text("TRUNCATE TABLE audio_cache CASCADE;"))
            await session.commit()
            logger.info("✅ Database tables truncated.")
        except Exception as e:
            logger.error(f"❌ Error cleaning database: {e}")
            return

    # 2. Clean MinIO Bucket
    logger.info("Cleaning MinIO Bucket...")
    try:
        storage = get_storage_service()
        # List all objects
        objects = storage.client.list_objects(storage.bucket_name)
        count = 0
        for obj in objects:
            storage.client.remove_object(storage.bucket_name, obj.object_name)
            count += 1
        
        logger.info(f"✅ MinIO Bucket cleaned. Removed {count} objects.")
    except Exception as e:
        logger.error(f"❌ Error cleaning bucket: {e}")

if __name__ == "__main__":
    asyncio.run(cleanup_system())
