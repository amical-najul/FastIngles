import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db, async_session
from app.models.lesson import Lesson
from app.models.audio_cache import AudioCache
from app.schemas.lesson import (
    LessonResponse, 
    LessonPreviewRequest, 
    LessonUpdateRequest, 
    WordEntry,
    LessonUpdateRequest, 
    WordEntry,
    LessonGenerateRequest,
    SingleAudioRequest
)
from app.services.ai_service import get_ai_service
from app.services.storage_service import get_storage_service
from app.services.tts_service import generate_tts_audio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/lessons", tags=["Lessons"])


@router.post("/generate-audio-single")
async def generate_single_audio(
    request: SingleAudioRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate audio for a single word synchronously.
    Used for frontend-driven progress bars and retries.
    """
    storage = get_storage_service()
    word = request.word
    lang = request.lang
    
    # 1. Check/Delete broken cache (Self-Healing)
    text_hash = storage.generate_text_hash(word, lang)
    result = await db.execute(
        select(AudioCache).where(AudioCache.text_hash == text_hash)
    )
    existing_cache = result.scalar_one_or_none()
    
    if existing_cache:
        if storage.object_exists(existing_cache.minio_key):
             # Already exists and healthy
             return {"status": "skipped", "key": existing_cache.minio_key}
        else:
            logger.warning(f"Self-Healing: Removing stale cache for '{word}'")
            await db.delete(existing_cache)
            await db.commit()  # Commit delete before inserting new entry

    # 2. Generate Audio
    audio_data = await generate_tts_audio(word, lang)
    if not audio_data:
        raise HTTPException(status_code=500, detail="TTS Generation Failed")
    
    # 3. Upload to MinIO
    minio_key = await storage.upload_audio(
        audio_data, 
        word, 
        lang,
        type="word",
        category=request.category,
        level=request.level
    )
    
    # 4. Save to DB
    cache_entry = AudioCache(
        text_hash=text_hash,
        text_content=word,
        language=lang,
        provider="gtts", 
        minio_key=minio_key,
        file_size=len(audio_data)
    )
    db.add(cache_entry)
    await db.commit()
    
    return {"status": "generated", "key": minio_key}

async def generate_lesson_audios_task(content: List[dict], category: str, level: int, lang: str = "en-US"):
    """
    Background task to generate audios for all words in the lesson.
    Generates MP3 using gTTS, uploads to MinIO, and caches in DB.
    """
    try:
        storage = get_storage_service()
        
        count = 0
        async with async_session() as session:
            for entry in content:
                try:
                    word = entry.get("word")
                    if not word:
                        continue
                        
                    # 1. Check if audio exists in DB
                    text_hash = storage.generate_text_hash(word, lang)
                    result = await session.execute(
                        select(AudioCache).where(AudioCache.text_hash == text_hash)
                    )
                    existing_cache = result.scalar_one_or_none()
                    
                    # SELF-HEALING LOGIC:
                    should_generate = True
                    if existing_cache:
                        if storage.object_exists(existing_cache.minio_key):
                            should_generate = False
                        else:
                            logger.warning(f"Self-Healing: Audio for '{word}' found in DB but missing in MinIO. Regenerating...")
                            await session.delete(existing_cache)
                    
                    if not should_generate:
                        continue 

                    # 2. Generate Audio (gTTS)
                    audio_data = await generate_tts_audio(word, lang)
                    if not audio_data:
                        logger.error(f"Failed to generate TTS for word: {word}")
                        continue
                    
                    # 3. Upload to MinIO
                    minio_key = await storage.upload_audio(
                        audio_data, 
                        word, 
                        lang,
                        type="word",
                        category=category,
                        level=level
                    )
                    
                    # 4. Save to Cache DB
                    cache_entry = AudioCache(
                        text_hash=text_hash,
                        text_content=word,
                        language=lang,
                        provider="gtts", 
                        minio_key=minio_key,
                        file_size=len(audio_data)
                    )
                    session.add(cache_entry)
                    count += 1
                except Exception as e:
                    logger.error(f"Error processing word '{word}': {e}")
                    continue
            
            await session.commit()
            
        logger.info(f"Background audio generation completed for {count} new words.")
        
    except Exception as e:
        logger.error(f"Error in background audio generation: {e}")


@router.post("/preview", response_model=List[WordEntry])
async def preview_lesson(
    request: LessonPreviewRequest
):
    """
    Generate a preview of the lesson content using AI without saving to DB.
    Frontend calls this to get data, reviewer edits it, then calls PUT to save.
    """
    ai_service = get_ai_service()
    
    try:
        content = await ai_service.generate_lesson(
            topic=request.topic,
            # word_count is handled as 'count' in generate_lesson
            count=request.word_count, 
            category=request.category
        )
        return content
    except Exception as e:
        logger.error(f"Error generating preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{day_id}", response_model=LessonResponse)
async def get_lesson(
    day_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get lesson by day_id."""
    try:
        result = await db.execute(select(Lesson).where(Lesson.day_id == day_id))
        lesson = result.scalar_one_or_none()
        
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
            
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching lesson {day_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{day_id}/section/{section_id}")
async def get_lesson_section(
    day_id: int,
    section_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a section of the lesson for optimized memory usage.
    Section 1: words 1-15 (indices 0-14)
    Section 2: words 16-30 (indices 15-29)
    Section 3: words 31-end (indices 30+)
    """
    try:
        result = await db.execute(select(Lesson).where(Lesson.day_id == day_id))
        lesson = result.scalar_one_or_none()
        
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        content = lesson.content or []
        total_words = len(content)
        
        # Define section boundaries
        if section_id == 1:
            start, end = 0, 15
        elif section_id == 2:
            start, end = 15, 30
        elif section_id == 3:
            start, end = 30, total_words  # From 30 to end (adapts to any length)
        else:
            raise HTTPException(status_code=400, detail="Invalid section_id. Use 1, 2, or 3")
        
        # Slice content
        section_content = content[start:end]
        
        return {
            "day_id": day_id,
            "section_id": section_id,
            "content": section_content,
            "total_words": total_words,
            "section_start": start + 1,  # 1-indexed for frontend
            "section_end": min(end, total_words),
            "is_last_section": end >= total_words
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching lesson section {day_id}/{section_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{day_id}", response_model=LessonResponse)
async def update_lesson(
    day_id: int, 
    request: LessonUpdateRequest,
    generate_audio: bool = True,
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Update lesson content by day_id.
    If generate_audio is True, triggers background task.
    """
    try:
        # Check if lesson exists by day_id
        result = await db.execute(select(Lesson).where(Lesson.day_id == day_id))
        lesson = result.scalar_one_or_none()
        
        # Serialize content
        content_json = [w.dict() for w in request.content]
        
        if lesson:
            # Update existing
            lesson.content = content_json
            if request.topic:
                lesson.topic = request.topic
            if request.category:
                lesson.category = request.category
            lesson.word_count = len(request.content)
        else:
            # Create new lesson
            # For System Check (9999), we use day_id as the identifier
            lesson = Lesson(
                day_id=day_id,
                topic=request.topic or f"Lesson {day_id}",
                category=request.category or "mixed",
                content=content_json,
                word_count=len(request.content),
                ai_provider="manual",
                ai_model="manual"
            )
            db.add(lesson)
        
        await db.commit()
        await db.refresh(lesson)
        
        # Trigger Background Task ONLY if requested
        if generate_audio:
            background_tasks.add_task(
                generate_lesson_audios_task, 
                content_json, 
                lesson.category, 
                lesson.day_id
            )
        
        return lesson
            
    except Exception as e:
        logger.error(f"Error saving lesson day_id={day_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save lesson: {str(e)}")
