import os
import sys
from minio import Minio
from minio.error import S3Error

# Leer variables directamente del entorno del contenedor
endpoint = os.getenv("MINIO_ENDPOINT")
access_key = os.getenv("MINIO_ACCESS_KEY")
secret_key = os.getenv("MINIO_SECRET_KEY")
bucket_name = os.getenv("MINIO_BUCKET")
secure = os.getenv("MINIO_SECURE", "false").lower() == "true"

print(f"--- INTERNAL MINIO DEBUG ---")
print(f"Endpoint: {endpoint}")
print(f"Bucket: {bucket_name}")
print(f"AccessKey Len: {len(access_key) if access_key else 0}")
print(f"SecretKey Len: {len(secret_key) if secret_key else 0}")

if not access_key or not secret_key:
    print("❌ ERROR: Missing credentials in environment!")
    sys.exit(1)

try:
    client = Minio(
        endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure
    )
    
    print(f"Attempting to check bucket '{bucket_name}'...")
    exists = client.bucket_exists(bucket_name)
    print(f"Bucket Exists: {exists}")
    
    if not exists:
         print("Attempting to create bucket...")
         client.make_bucket(bucket_name)
         print("Bucket created.")

    print("Attempting write test...")
    import io
    client.put_object(
        bucket_name,
        "debug_token.txt",
        io.BytesIO(b"DEBUG"),
        5,
        content_type="text/plain"
    )
    print("✅ Write Success!")

except S3Error as e:
    print(f"❌ S3 ERROR: {e.code} - {e.message}")
    print(f"Raw: {e}")
except Exception as e:
    print(f"❌ GENERAL ERROR: {e}")
