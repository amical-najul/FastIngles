"""
TTS (Text-to-Speech) Router for Fast-Ingles.
Handles audio generation with caching in MinIO.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional
import logging

from app.database import get_db
from app.models.audio_cache import AudioCache
from app.services.storage_service import get_storage_service, StorageService
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tts", tags=["Text-to-Speech"])


class TTSRequest(BaseModel):
    """Request schema for TTS generation."""
    text: str
    language: str = "en-US"
    provider: str = "browser"  # 'gemini', 'browser', etc.


class TTSResponse(BaseModel):
    """Response schema for TTS."""
    url: str
    cached: bool
    text_hash: str
    provider: str


@router.post("/speak", response_model=TTSResponse)
async def generate_speech(
    request: TTSRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate or retrieve cached TTS audio.
    
    If the audio exists in cache, returns the cached URL.
    Otherwise, generates new audio and stores it in MinIO.
    """
    storage = get_storage_service()
    text_hash = storage.generate_text_hash(request.text, request.language)
    
    # Check cache in database
    result = await db.execute(
        select(AudioCache).where(AudioCache.text_hash == text_hash)
    )
    cached = result.scalar_one_or_none()
    
    if cached:
        # Update access stats
        await db.execute(
            update(AudioCache)
            .where(AudioCache.id == cached.id)
            .values(access_count=AudioCache.access_count + 1)
        )
        await db.commit()
        
        # Return cached audio URL
        url = storage.get_presigned_url(cached.minio_key)
        return TTSResponse(
            url=url,
            cached=True,
            text_hash=text_hash,
            provider=cached.provider
        )
    
    # For browser provider, first try to find existing audio in MinIO
    if request.provider == "browser":
        # Try to find pre-generated audio in global dictionary
        potential_key = storage.derive_global_key(request.text, request.language)
        
        if potential_key and storage.object_exists(potential_key):
            # Found audio in MinIO, return presigned URL
            logger.info(f"TTS: Found existing audio in MinIO for '{request.text}' -> {potential_key}")
            url = storage.get_presigned_url(potential_key)
            
            # Optionally update/create cache entry for future lookups
            try:
                cache_entry = AudioCache(
                    text_hash=text_hash,
                    text_content=request.text[:500],
                    language=request.language,
                    provider="gtts",
                    minio_key=potential_key,
                    file_size=0  # Unknown
                )
                db.add(cache_entry)
                await db.commit()
            except Exception:
                pass  # Ignore cache insert errors
            
            return TTSResponse(
                url=url,
                cached=True,
                text_hash=text_hash,
                provider="gtts"
            )
        
        # No audio found in MinIO, fallback to browser TTS
        logger.info(f"TTS: No audio found for '{request.text}', falling back to browser TTS")
        return TTSResponse(
            url=f"BROWSER_TTS::{request.text}::{request.language}",
            cached=False,
            text_hash=text_hash,
            provider="browser"
        )
    
    # Generate with AI (Gemini TTS)
    try:
        # TODO: Implement Gemini TTS generation
        # For now, return placeholder
        audio_data = await _generate_tts_audio(request.text, request.language, request.provider)
        
        if audio_data:
            # Upload to MinIO
            minio_key = await storage.upload_audio(
                audio_data,
                request.text,
                request.language
            )
            
            # Save to cache
            cache_entry = AudioCache(
                text_hash=text_hash,
                text_content=request.text[:500],  # Truncate long texts
                language=request.language,
                provider=request.provider,
                minio_key=minio_key,
                file_size=len(audio_data)
            )
            db.add(cache_entry)
            await db.commit()
            
            url = storage.get_presigned_url(minio_key)
            return TTSResponse(
                url=url,
                cached=False,
                text_hash=text_hash,
                provider=request.provider
            )
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate audio: {str(e)}"
        )
    
    # Fallback to browser TTS
    return TTSResponse(
        url=f"BROWSER_TTS::{request.text}::{request.language}",
        cached=False,
        text_hash=text_hash,
        provider="browser"
    )


@router.get("/status/{text_hash}")
async def get_audio_status(
    text_hash: str,
    db: AsyncSession = Depends(get_db)
):
    """Check if audio exists in cache."""
    result = await db.execute(
        select(AudioCache).where(AudioCache.text_hash == text_hash)
    )
    cached = result.scalar_one_or_none()
    
    if cached:
        storage = get_storage_service()
        return {
            "exists": True,
            "url": storage.get_presigned_url(cached.minio_key),
            "language": cached.language,
            "provider": cached.provider,
            "access_count": cached.access_count
        }
    
    return {"exists": False}


async def _generate_tts_audio(
    text: str, 
    language: str, 
    provider: str
) -> Optional[bytes]:
    """
    Generate TTS audio using the specified provider.
    
    TODO: Implement actual TTS generation with:
    - Gemini TTS API
    - Other providers as needed
    """
    if provider == "gemini":
        # Placeholder for Gemini TTS implementation
        # This would use the Gemini TTS API when available
        pass
    
    return None
