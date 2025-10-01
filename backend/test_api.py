#!/usr/bin/env python3

import requests
import json

def test_api():
    base_url = "http://localhost:8000/api/v1"
    
    print("Testing API endpoints...")
    
    try:
        response = requests.get(f"{base_url}/voice/random-word", timeout=5)
        print(f"Random word endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend server")
        print("Please make sure the backend server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"✗ API test failed: {e}")
        return False
    
    try:
        login_data = {
            "user_type": "admin",
            "username": "admin", 
            "password": "admin123"
        }
        
        response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            timeout=5
        )
        
        print(f"Admin login endpoint: {response.status_code}")
        if response.status_code == 200:
            print("✓ Admin login successful")
            data = response.json()
            print(f"Token received: {data.get('access_token', 'None')[:20]}...")
        else:
            print(f"✗ Admin login failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Login test failed: {e}")
    
    try:
        student_login_data = {
            "user_type": "student",
            "student_id": "CS001"
        }
        
        response = requests.post(
            f"{base_url}/auth/login",
            json=student_login_data,
            timeout=5
        )
        
        print(f"Student login endpoint: {response.status_code}")
        if response.status_code == 200:
            print("✓ Student login successful")
        else:
            print(f"✗ Student login failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Student login test failed: {e}")

if __name__ == "__main__":
    test_api()