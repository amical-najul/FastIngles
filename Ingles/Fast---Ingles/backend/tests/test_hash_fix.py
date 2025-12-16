from app.utils.security import get_password_hash
import sys

print("Testing bcrypt hash fix...")
try:
    h = get_password_hash("password123")
    print(f"Hash success: {h[:10]}...")
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
