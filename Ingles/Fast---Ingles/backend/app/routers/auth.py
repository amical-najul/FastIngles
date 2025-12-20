
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.database import get_db
from app.models.user import User
from app.utils.security import get_current_user_token
from app.schemas.user import UserResponse
from datetime import datetime

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

logger = logging.getLogger(__name__)

@router.get("/me", response_model=UserResponse)
async def get_current_user_jit(
    token_claims: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user.
    IMPLEMENTS JIT PROVISIONING:
    - If user exists in DB (by Firebase UID or Email), return it.
    - If not, CREATE it using info from token.
    """
    firebase_uid = token_claims.get("uid")
    email = token_claims.get("email")
    name = token_claims.get("name", email.split("@")[0] if email else "User")
    picture = token_claims.get("picture")

    logger.info(f"[JIT] Processing request for email={email}, uid={firebase_uid}")

    if not email:
        logger.error("[JIT] Token missing email claim")
        raise HTTPException(status_code=400, detail="Token missing email")

    # 1. Try to find user by email (assuming email is unique and reliable key)
    try:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
    except Exception as db_error:
        logger.error(f"[JIT] Database query failed: {db_error}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")

    if user:
        # User exists, return it
        logger.info(f"[JIT] Found existing user: id={user.id}, email={user.email}")
        return user

    # 2. CREATE (JIT)
    logger.info(f"[JIT] User not found, creating new user: email={email}, name={name}")
    new_user = User(
        email=email,
        name=name,
        photo_url=picture,
        role="user",
        status="active",
        password_hash="firebase_managed" # Placeholder
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        logger.info(f"[JIT] Created new user: id={new_user.id}, email={new_user.email}")
        return new_user
    except Exception as e:
        logger.error(f"[JIT] Failed to create user: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"JIT Provisioning failed: {e}")


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    updates: dict = Body(...),
    token_claims: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user profile (Name, Photo) from Frontend Sync.
    """
    email = token_claims.get("email")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "name" in updates:
        user.name = updates["name"]
    if "photo_url" in updates:
        user.photo_url = updates["photo_url"]
    
    await db.commit()
    await db.refresh(user)
    return user
