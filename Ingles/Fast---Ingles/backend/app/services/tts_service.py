"""
TTS Service using gTTS (Google Translate Text-to-Speech).
Simple implementation for MVP audio generation.
"""

from gtts import gTTS
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

async def generate_tts_audio(text: str, lang: str = "en") -> bytes:
    """
    Generate MP3 audio bytes for the given text using gTTS.
    
    Args:
        text: Text to convert to speech
        lang: Language code (default 'en')
        
    Returns:
        bytes: MP3 audio data
    """
    try:
        # Map some language codes if necessary
        # gTTS uses 'en', 'es', etc.
        gtts_lang = lang.split('-')[0] if '-' in lang else lang
        
        # Create memory buffer
        mp3_fp = BytesIO()
        
        # Generate audio
        tts = gTTS(text=text, lang=gtts_lang, slow=False)
        tts.write_to_fp(mp3_fp)
        
        # Get bytes
        mp3_fp.seek(0)
        return mp3_fp.read()
        
    except Exception as e:
        logger.error(f"Error generating TTS with gTTS: {e}")
        return None
