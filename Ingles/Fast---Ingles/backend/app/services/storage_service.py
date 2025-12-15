"""
MinIO Storage Service for Fast-Ingles.
Handles upload, download, and URL signing for audio files and images.
"""

from minio import Minio
from minio.error import S3Error
from io import BytesIO
import unicodedata
import re
import hashlib
from datetime import timedelta
from typing import Optional
import logging

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class StorageService:
    """Service for interacting with MinIO object storage."""
    
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Ensure the bucket exists."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info(f"Created bucket: {self.bucket}")
        except S3Error as e:
            logger.error(f"Error checking/creating bucket: {e}")
    
    @staticmethod
    def _slugify(text: str) -> str:
        """Create a clean filename slug."""
        text = str(text).lower()
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
        text = re.sub(r'[^\w\s-]', '', text).strip()
        text = re.sub(r'[-\s]+', '-', text)
        return text

    def _get_storage_path(
        self, 
        text: str, 
        text_hash: str,
        type: str, 
        category: str, 
        level: int
    ) -> str:
        """
        Determine the storage path based on content type for Deduplication/Organization.
        """
        slug = self._slugify(text)
        
        # 1. GLOBAL DICTIONARY (Single words only)
        # Avoid duplicating same words across levels
        if type == "word" and len(text.split()) == 1:
            initial = slug[0] if slug else "0"
            return f"global/dictionary/{initial}/{slug}.mp3"
            
        # 2. CONTEXTUAL CONTENT (Sentences, Mnemonics)
        # Organize by Level > Type
        # Filename uses slug (short) + hash (unique)
        clean_cat = self._slugify(category or "general")
        short_slug = slug[:30] # Truncate for sanity
        return f"content/{clean_cat}/level_{level}/{type}/{short_slug}_{text_hash[:8]}.mp3"

    @staticmethod
    def generate_text_hash(text: str, lang: str) -> str:
        """Generate SHA256 hash for text + language."""
        content = f"{text}_{lang}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def derive_global_key(self, text: str, lang: str = "en") -> str:
        """
        Derive the expected MinIO key for a global word.
        Returns the path where the audio would be stored.
        """
        slug = self._slugify(text)
        # Only single words go to global dictionary
        if len(text.split()) == 1:
            initial = slug[0] if slug else "0"
            return f"global/dictionary/{initial}/{slug}.mp3"
        return None
    
    async def upload_audio(
        self, 
        audio_data: bytes, 
        text: str, 
        lang: str,
        content_type: str = "audio/mpeg",
        # New Metadata Params
        type: str = "word",
        category: str = "verbs",
        level: int = 1
    ) -> str:
        """
        Upload audio to MinIO and return the object key.
        Handles deduplication for 'word' type.
        """
        text_hash = self.generate_text_hash(text, lang)
        
        # Determine Smart Path
        key = self._get_storage_path(text, text_hash, type, category, level)
        
        # DEDUPLICATION CHECK (Only for Global Dictionary words)
        # If it's a global word and already exists, DO NOT upload. Return existing key.
        if type == "word" and key.startswith("global/"):
            if self.object_exists(key):
                logger.info(f"Deduplication: Using existing global audio for '{text}' -> {key}")
                return key
        
        try:
            self.client.put_object(
                self.bucket,
                key,
                BytesIO(audio_data),
                length=len(audio_data),
                content_type=content_type
            )
            logger.info(f"Uploaded audio: {key} ({len(audio_data)} bytes)")
            return key
        except S3Error as e:
            logger.error(f"Error uploading audio: {e}")
            raise
    
    async def upload_image(
        self,
        image_data: bytes,
        filename: str,
        folder: str = "images/profiles",
        content_type: str = "image/jpeg"
    ) -> str:
        """
        Upload image to MinIO.
        
        Args:
            image_data: Raw image bytes
            filename: Filename for the image
            folder: Folder path in bucket
            content_type: MIME type of the image
            
        Returns:
            Object key in MinIO
        """
        key = f"{folder}/{filename}"
        
        try:
            self.client.put_object(
                self.bucket,
                key,
                BytesIO(image_data),
                length=len(image_data),
                content_type=content_type
            )
            logger.info(f"Uploaded image: {key}")
            return key
        except S3Error as e:
            logger.error(f"Error uploading image: {e}")
            raise
    
    def get_presigned_url(
        self, 
        key: str, 
        expires_seconds: int = 3600
    ) -> str:
        """
        Get a presigned URL for downloading an object.
        
        Args:
            key: Object key in MinIO
            expires_seconds: URL expiration time in seconds
            
        Returns:
            Presigned URL
        """
        try:
            url = self.client.presigned_get_object(
                self.bucket,
                key,
                expires=timedelta(seconds=expires_seconds)
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def get_public_url(self, key: str) -> str:
        """
        Get public URL for an object (for publicly accessible content).
        
        Args:
            key: Object key in MinIO
            
        Returns:
            Public URL
        """
        protocol = "https" if settings.MINIO_SECURE else "http"
        return f"{protocol}://{settings.MINIO_ENDPOINT}/{self.bucket}/{key}"
    
    async def delete_object(self, key: str) -> bool:
        """
        Delete an object from MinIO.
        
        Args:
            key: Object key to delete
            
        Returns:
            True if successful
        """
        try:
            self.client.remove_object(self.bucket, key)
            logger.info(f"Deleted object: {key}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting object: {e}")
            return False
    
    def object_exists(self, key: str) -> bool:
        """
        Check if an object exists in MinIO.
        
        Args:
            key: Object key to check
            
        Returns:
            True if exists
        """
        try:
            self.client.stat_object(self.bucket, key)
            return True
        except S3Error:
            return False


# Singleton instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create storage service instance."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
