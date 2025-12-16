import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
print(f"Sys Path: {sys.path}")

try:
    import app
    print(f"App file: {app.__file__}")
except ImportError as e:
    print(f"Failed to import app: {e}")

try:
    from app.database import async_session
    print(f"Async session imported: {async_session}")
except ImportError as e:
    print(f"Failed to import async_session: {e}")

try:
    from app.models.user import User
    print(f"User imported: {User}")
except ImportError as e:
    print(f"Failed to import User: {e}")
