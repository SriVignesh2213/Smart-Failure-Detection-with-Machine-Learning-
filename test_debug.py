import sys
import os
import traceback

sys.path.insert(0, os.path.abspath('.'))

from app import create_app
from app.extensions import db

app = create_app('testing')
app.config['PROPAGATE_EXCEPTIONS'] = True

client = app.test_client()

with app.app_context():
    # 1. Print raw user document from MongoDB
    user_doc = db.db["users"].find_one()
    print("RAW USER DOC:", user_doc)
    if user_doc:
        for k, v in user_doc.items():
            print(f"  Field: {k:<15} Type: {type(v).__name__:<15} Value: {v}")
            
    # 2. Print raw role document from MongoDB
    role_doc = db.db["roles"].find_one()
    print("\nRAW ROLE DOC:", role_doc)
    if role_doc:
        for k, v in role_doc.items():
            print(f"  Field: {k:<15} Type: {type(v).__name__:<15} Value: {v}")
            
    # 3. Trigger roles seed to ensure they are there
    roles = [
        {"_id": 1, "role_name": "Admin", "description": "Administrator with full access"},
        {"_id": 2, "role_name": "Engineer", "description": "Maintenance Engineer with write/predict access"},
        {"_id": 3, "role_name": "Viewer", "description": "Viewer with read-only access"}
    ]
    for role_doc in roles:
        db.db["roles"].update_one({"_id": role_doc["_id"]}, {"$set": role_doc}, upsert=True)
        
    # 4. Clean up and register a test user
    db.db["users"].delete_many({"email": "testuser@example.com"})
    
    reg_payload = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "Password123"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    print("\nRegister Response:", reg_res.status_code, reg_res.get_json())
    
    # Login
    login_payload = {
        "email": "testuser@example.com",
        "password": "Password123"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    print("Login Response:", login_res.status_code, login_res.get_json())
    
    tokens = login_res.get_json()['data']['tokens']
    access_token = tokens['access_token']
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    # Call profile GET
    print("\n--- Testing GET /api/users/profile ---")
    try:
        res = client.get("/api/users/profile", headers=headers)
        print("GET Profile Response status:", res.status_code)
        print("GET Profile Response body:", res.get_json())
    except Exception as e:
        print("GET Profile Exception:")
        traceback.print_exc()
        
    # Call profile PUT
    print("\n--- Testing PUT /api/users/profile ---")
    try:
        update_payload = {
            "full_name": "Updated Test User",
            "phone": "1234567890"
        }
        res = client.put("/api/users/profile", json=update_payload, headers=headers)
        print("PUT Profile Response status:", res.status_code)
        print("PUT Profile Response body:", res.get_json())
    except Exception as e:
        print("PUT Profile Exception:")
        traceback.print_exc()
