import os
from minio import Minio
from minio.error import S3Error
from dotenv import load_dotenv

# Cargar .env del backend
load_dotenv('d:\\Antigravity\\APPS\\Ingles\\Fast---Ingles\\backend\\.env')

endpoint = os.getenv("MINIO_ENDPOINT")
access_key = os.getenv("MINIO_ACCESS_KEY")
secret_key = os.getenv("MINIO_SECRET_KEY")
bucket_name = os.getenv("MINIO_BUCKET")
secure = os.getenv("MINIO_SECURE", "false").lower() == "true"

print(f"--- MinIO Connection Test ---")
print(f"Endpoint: {endpoint}")
print(f"Details: AccessKey={'*' * len(access_key) if access_key else 'None'}, SecretKey={'*' * len(secret_key) if secret_key else 'None'}")
print(f"Secure: {secure}")
print(f"Target Bucket: {bucket_name}")

try:
    client = Minio(
        endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure
    )

    print("\n1. Testing List Buckets...")
    buckets = client.list_buckets()
    print("✅ Success! Buckets found:")
    for b in buckets:
        print(f" - {b.name}")
    
    print(f"\n2. Testing Bucket Existence ({bucket_name})...")
    if client.bucket_exists(bucket_name):
        print(f"✅ Bucket '{bucket_name}' exists.")
    else:
        print(f"⚠️ Bucket '{bucket_name}' does not exist. Attempting creation...")
        try:
            client.make_bucket(bucket_name)
            print(f"✅ Bucket '{bucket_name}' created successfully.")
        except S3Error as err:
             print(f"❌ Failed to create bucket: {err}")

    print("\n3. Testing Write Permissions...")
    try:
        data = b"Hello MinIO"
        import io
        client.put_object(
            bucket_name,
            "test_access.txt",
            io.BytesIO(data),
            len(data),
            content_type="text/plain"
        )
        print("✅ Write successful (test_access.txt)")
    except S3Error as err:
        print(f"❌ Write failed: {err}")

except Exception as e:
    print(f"\n❌ CRITICAL ERROR: {e}")
