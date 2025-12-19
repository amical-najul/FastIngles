
import requests
import json
import sys

URL = "https://ingles.n8nprueba.shop/api/lessons/1"

print(f"Testing GET {URL} ...")
try:
    resp = requests.get(URL, timeout=10)
    print(f"Status Code: {resp.status_code}")
    try:
        data = resp.json()
        print("Response JSON keys:", data.keys())
        content = data.get('content')
        if content:
            print(f"Content length: {len(content)}")
            print("First item sample:", content[0])
        else:
            print("Content is empty or null")
    except Exception as e:
        print("Failed to parse JSON:", resp.text[:500])
except Exception as e:
    print(f"Request failed: {e}")
