import sys
import os
import traceback

sys.path.insert(0, os.path.abspath('.'))

from app import create_app
from flask_jwt_extended import create_access_token

app = create_app('development')
app.config['PROPAGATE_EXCEPTIONS'] = True

client = app.test_client()

with app.app_context():
    # Generate access token for the actual dev user (ID: 1)
    access_token = create_access_token(
        identity="1",
        additional_claims={"role": "Engineer"}
    )
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    print("--- Executing GET /api/users/profile ---")
    try:
        res = client.get("/api/users/profile", headers=headers)
        print("Status Code:", res.status_code)
        print("Response JSON:", res.get_json())
    except Exception as e:
        print("EXCEPTION DETECTED:")
        traceback.print_exc()
