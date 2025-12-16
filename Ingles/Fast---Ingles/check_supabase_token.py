import requests
import json

TOKEN = "sb_secret_lkbS1RcKq1kQX-eJ0xFVgA_1ZxWCGLh"
API_URL = "https://api.supabase.com/v1/projects"

def check_token():
    print(f"Checking token against {API_URL}...")
    try:
        headers = {"Authorization": f"Bearer {TOKEN}"}
        response = requests.get(API_URL, headers=headers, timeout=10)
        
        if response.status_code == 200:
            projects = response.json()
            print("SUCCESS: Token is valid.")
            print(f"Found {len(projects)} projects.")
            for p in projects:
                print(f"Project: {p.get('name')} | ID: {p.get('id')} | Ref: {p.get('ref')}")
        else:
            print(f"FAILED: Status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check_token()
