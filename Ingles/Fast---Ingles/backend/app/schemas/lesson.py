from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime


class WordEntry(BaseModel):
    """Schema for a vocabulary word entry."""
    word: str
    pronunciation: str
    translation: str
    sentences: List[str]
    mnemonic: str



class LessonCreate(BaseModel):
    """Schema for lesson creation request."""
    topic: str
    category: Literal["verbs", "adjectives", "nouns", "adverbs", "mixed"] = "verbs"
    word_count: int = 50


class LessonGenerateRequest(BaseModel):
    """Schema for lesson generation request."""
    topic: str
    category: Literal["verbs", "adjectives", "nouns", "adverbs", "mixed"] = "verbs"
    word_count: int = 50
    provider: Optional[str] = None
    model: Optional[str] = None


class LessonPreviewRequest(BaseModel):
    """Schema for preview generation request."""
    topic: str
    category: str = "verbs"
    word_count: int = 50
    provider: Optional[str] = None
    model: Optional[str] = None


class LessonUpdateRequest(BaseModel):
    """Schema for updating lesson content."""
    content: List[WordEntry]
    topic: Optional[str] = None
    category: Optional[str] = None


class SingleAudioRequest(BaseModel):
    """Schema for generating a single audio file."""
    word: str
    category: str = "general"
    level: int = 1
    lang: str = "en-US"


class LessonResponse(BaseModel):
    """Schema for lesson response."""
    id: int
    day_id: int
    topic: str
    category: str
    content: List[Dict[str, Any]]  # Stored as JSON
    word_count: int
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserProgressResponse(BaseModel):
    day_id: int
    current_index: int
    completed: bool
    score: int
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProgressUpdate(BaseModel):
    current_index: int
    completed: bool = False

# Aliases for backward compatibility
LessonContentResponse = LessonResponse
ProgressResponse = UserProgressResponse
