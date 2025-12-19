
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
import logging

from app.firebase_admin_setup import initialize_firebase_admin
from app.database import get_db
from app.models.user import User

# Ensure app is initialized
initialize_firebase_admin()

security_scheme = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

import os
import json
import urllib.request
from jose import jwt

def verify_firebase_token_manual(token: str) -> dict:
    """
    Manually verify Firebase ID Token using Google's public keys.
    Bypasses firebase-admin credential requirements.
    """
    try:
        # 1. Get Project ID (Audience)
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        if not project_id:
            raise ValueError("GOOGLE_CLOUD_PROJECT env var not set")

        # 2. Fetch Google's Public Keys
        keys_url = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
        with urllib.request.urlopen(keys_url) as response:
            public_keys = json.loads(response.read())

        # 3. Get Key ID (kid) from token header
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid or kid not in public_keys:
            raise ValueError("Invalid Key ID")

        # 4. Verify Token
        cert_str = public_keys[kid]
        decoded = jwt.decode(
            token,
            cert_str,
            algorithms=["RS256"],
            audience=project_id,
            issuer=f"https://securetoken.google.com/{project_id}"
        )
        return decoded
    except Exception as e:
        logger.error(f"Manual token verification failed: {e}")
        raise

def verify_firebase_token(token: str) -> dict:
    """
    Verify Firebase ID Token and return decoded claims.
    Tries firebase-admin first, falls back to manual verification.
    """
    try:
        # Attempt 1: SDK
        return auth.verify_id_token(token)
    except Exception as sdk_error:
        logger.warning(f"Admin SDK verification failed ({sdk_error}), trying manual verification...")
        try:
            # Attempt 2: Manual
            return verify_firebase_token_manual(token)
        except Exception as manual_error:
            logger.error(f"All token verification methods failed. SDK: {sdk_error} | Manual: {manual_error}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

async def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    Dependency to get verified Firebase Token payload.
    """
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_firebase_token(credentials.credentials)

async def get_current_user(
    token_claims: dict = Depends(get_current_user_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current user from DB based on Firebase Token.
    """
    email = token_claims.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Token missing email")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

async def get_current_admin(
    user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is an admin.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough privileges"
        )
    return user

# Legacy/Admin Password Helpers
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
