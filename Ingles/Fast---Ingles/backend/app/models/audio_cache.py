from sqlalchemy import Column, Integer, String, Float, DateTime, Text, func
from app.database import Base


class AudioCache(Base):
    """Audio cache model for storing TTS audio metadata with MinIO references."""
    __tablename__ = "audio_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    text_hash = Column(String(64), unique=True, nullable=False, index=True)
    text_content = Column(Text, nullable=False)
    language = Column(String(10), nullable=False)  # 'en-US', 'es-ES'
    provider = Column(String(50), nullable=False)  # 'gemini', 'browser', etc.
    minio_key = Column(String(500), nullable=False)  # Path in MinIO bucket
    file_size = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    last_accessed = Column(DateTime, server_default=func.now(), onupdate=func.now())
    access_count = Column(Integer, default=0)
