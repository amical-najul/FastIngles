from sqlalchemy import Column, Integer, String, DateTime, JSON, func
from app.database import Base


class Lesson(Base):
    """Lesson model for caching AI-generated content."""
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, unique=True, nullable=False, index=True)
    topic = Column(String, nullable=False)
    category = Column(String, nullable=False)  # verbs, adjectives, nouns, adverbs
    content = Column(JSON, nullable=False)  # Array of WordEntry
    word_count = Column(Integer, nullable=False)
    ai_provider = Column(String, nullable=True)  # Which AI generated this
    ai_model = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
