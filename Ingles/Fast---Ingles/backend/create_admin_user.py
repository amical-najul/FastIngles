import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

email = "jock.alcantara@gmail.com"
password = "12345"

def create_admin():
    print(f"Creating Admin User: {email}")
    
    # Supabase Admin API endpoint for creating a user
    # passing confirm: true to skip email verification
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "name": "Administrador",
            "role": "admin"
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200 or response.status_code == 201:
            print("SUCCESS: Admin user created.")
            user_data = response.json()
            print(f"User ID: {user_data.get('id')}")
        else:
            print(f"FAILED: Status {response.status_code}")
            print(response.text)
            
            # Check if likely already exists
            if "already registered" in response.text:
                 print("User likely already exists.")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    create_admin()
