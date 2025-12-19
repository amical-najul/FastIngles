from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema."""
    name: str
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID  # UUID from Supabase
    role: str
    status: str
    photo_url: Optional[str] = None
    created_at: Optional[datetime] = None
    
    @field_serializer('id')
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT Token schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    user_id: str  # UUID from Supabase
    email: str
    role: str
