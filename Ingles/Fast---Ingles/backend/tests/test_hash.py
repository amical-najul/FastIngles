from passlib.context import CryptContext
import sys

print("Testing usage of passlib with bcrypt...")
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    h = pwd_context.hash("password123")
    print(f"Hash result: {h}")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
