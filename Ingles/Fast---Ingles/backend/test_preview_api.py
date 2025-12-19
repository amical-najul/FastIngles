
import requests
import json

URL = "http://localhost:8000/api/lessons/preview"

payload = {
    "topic": "Technology",
    "category": "verbs",
    "word_count": 5
}

print(f"Testing POST {URL} ...")
try:
    resp = requests.post(URL, json=payload, timeout=30)
    print(f"Status Code: {resp.status_code}")
    if resp.status_code == 200:
        print("Success! Response sample:", resp.json()[:1])
    else:
        print("Error Response:", resp.text)
except Exception as e:
    print(f"Request failed: {e}")
