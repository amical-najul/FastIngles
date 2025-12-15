from app.routers.auth import router as auth_router
from app.routers.lessons import router as lessons_router
from app.routers.tts import router as tts_router

__all__ = ["auth_router", "lessons_router", "tts_router"]
