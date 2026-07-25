import sys
import os
import traceback

sys.path.insert(0, os.path.abspath('.'))

from app import create_app
from app.extensions import db
from flask_jwt_extended import create_access_token

app = create_app('development')
app.config['PROPAGATE_EXCEPTIONS'] = True

client = app.test_client()

with app.app_context():
    # 1. Update user Pranav Bade (ID: 1) password to a known hash so we can test change password.
    # Currently password in database is: $2b$12$VjFslQ3LgzbV0QhBkz.RQud2WXqNtax7KceRyjCrbJLcT5dM9yz.q
    # Which corresponds to 'Password123'. Let's verify login with pranav@example.com and 'Password123'
    login_res = client.post("/api/auth/login", json={
        "email": "pranav@example.com",
        "password": "Password123"
    })
    print("1. Login with pranav@example.com / Password123 status:", login_res.status_code)
    
    if login_res.status_code != 200:
        # If it fails, let's reset it to a known hash
        from app.services.auth_service import hash_password
        db.db["users"].update_one({"_id": 1}, {"$set": {"password": hash_password("Password123")}})
        login_res = client.post("/api/auth/login", json={
            "email": "pranav@example.com",
            "password": "Password123"
        })
        print("   Re-login after password reset status:", login_res.status_code)

    tokens = login_res.get_json()['data']['tokens']
    access_token = tokens['access_token']
    refresh_token = tokens['refresh_token']
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Get profile
    profile_res = client.get("/api/users/profile", headers=headers)
    print("2. GET /api/users/profile status:", profile_res.status_code, profile_res.get_json())
    
    # 3. Update profile with password in payload (should be ignored and succeed)
    update_res = client.put("/api/users/profile", json={
        "full_name": "Pranav Bade",
        "phone": "9876543210",
        "password": "ignoredPassword"
    }, headers=headers)
    print("3. PUT /api/users/profile (with ignored password) status:", update_res.status_code, update_res.get_json())

    # 4. Change password - Invalid current password
    chg_res_fail = client.post("/api/auth/change-password", json={
        "current_password": "WrongPassword",
        "new_password": "NewPassword123"
    }, headers=headers)
    print("4. POST /api/auth/change-password (wrong current) status:", chg_res_fail.status_code, chg_res_fail.get_json())

    # 5. Change password - Invalid new password length
    chg_res_short = client.post("/api/auth/change-password", json={
        "current_password": "Password123",
        "new_password": "short"
    }, headers=headers)
    print("5. POST /api/auth/change-password (short new) status:", chg_res_short.status_code, chg_res_short.get_json())

    # 6. Change password - Success
    chg_res_ok = client.post("/api/auth/change-password", json={
        "current_password": "Password123",
        "new_password": "NewPassword123"
    }, headers=headers)
    print("6. POST /api/auth/change-password (valid) status:", chg_res_ok.status_code, chg_res_ok.get_json())

    # 7. Try login with old password (should fail)
    login_old = client.post("/api/auth/login", json={
        "email": "pranav@example.com",
        "password": "Password123"
    })
    print("7. Login with old password status:", login_old.status_code)

    # 8. Try login with new password (should succeed)
    login_new = client.post("/api/auth/login", json={
        "email": "pranav@example.com",
        "password": "NewPassword123"
    })
    print("8. Login with new password status:", login_new.status_code)
    
    # Reset password back to Password123
    from app.services.auth_service import hash_password
    db.db["users"].update_one({"_id": 1}, {"$set": {"password": hash_password("Password123")}})
    print("   Reset password back to 'Password123' for subsequent dev use.")

    # 9. Refresh token test
    ref_res = client.post("/api/auth/refresh", headers={"Authorization": f"Bearer {refresh_token}"})
    print("9. POST /api/auth/refresh status:", ref_res.status_code, ref_res.get_json())

    # 10. Logout test
    logout_res = client.post("/api/auth/logout", headers=headers)
    print("10. POST /api/auth/logout status:", logout_res.status_code, logout_res.get_json())

    # 11. GET /api/users (Admin role required)
    # Temporarily make user 1 an Admin (role_id = 1)
    db.db["users"].update_one({"_id": 1}, {"$set": {"role_id": 1}})
    # Generate new token with Admin role claims
    admin_token = create_access_token(identity="1", additional_claims={"role": "Admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    users_res = client.get("/api/users", headers=admin_headers)
    print("11. GET /api/users status:", users_res.status_code, "Total users:", len(users_res.get_json()['data']))
    
    # Restore user 1 back to Engineer (role_id = 2)
    db.db["users"].update_one({"_id": 1}, {"$set": {"role_id": 2}})

    # 12. POST /api/machines (Admin / Engineer required)
    db.db["machines"].delete_many({"machine_code": "MAC-TEST-001"})
    machine_payload = {
        "machine_name": "Test Machine 001",
        "machine_code": "MAC-TEST-001",
        "machine_type": "Milling Machine",
        "serial_number": "SN1234567890",
        "manufacturer": "TestCorp",
        "model_number": "TC-9000",
        "department": "Production",
        "location": "Bay 3",
        "installation_date": "2026-01-01"
    }
    # Engineer headers
    eng_token = create_access_token(identity="1", additional_claims={"role": "Engineer"})
    eng_headers = {"Authorization": f"Bearer {eng_token}"}
    mac_post_res = client.post("/api/machines", json=machine_payload, headers=eng_headers)
    print("12. POST /api/machines status:", mac_post_res.status_code, mac_post_res.get_json())
    new_machine_id = mac_post_res.get_json()['data']['id']

    # 13. GET /api/machines
    mac_get_res = client.get("/api/machines", headers=eng_headers)
    print("13. GET /api/machines status:", mac_get_res.status_code, "Total:", mac_get_res.get_json()['data']['total'])

    # 14. POST /api/sensor-data
    sensor_payload = {
        "machine_id": new_machine_id,
        "temperature": 78.5,
        "vibration": 3.8,
        "pressure": 55.2
    }
    sensor_res = client.post("/api/sensor-data", json=sensor_payload, headers=eng_headers)
    print("14. POST /api/sensor-data status:", sensor_res.status_code, sensor_res.get_json())

    # 15. POST /api/predict
    pred_res = client.post("/api/predict", json={"machine_id": new_machine_id}, headers=eng_headers)
    print("15. POST /api/predict status:", pred_res.status_code, pred_res.get_json())

    # 16. POST /api/blackbox/generate
    bb_res = client.post("/api/blackbox/generate", json={"machine_id": new_machine_id}, headers=eng_headers)
    print("16. POST /api/blackbox/generate status:", bb_res.status_code, bb_res.get_json())

    # 17. GET /api/dashboard/summary
    dash_res = client.get("/api/dashboard/summary", headers=eng_headers)
    print("17. GET /api/dashboard/summary status:", dash_res.status_code, dash_res.get_json())

    # 18. GET /api/reports/maintenance
    rep_m_res = client.get("/api/reports/maintenance", headers=admin_headers)
    print("18. GET /api/reports/maintenance status:", rep_m_res.status_code, len(rep_m_res.get_json()['data']))

    # 19. GET /api/reports/failures
    rep_f_res = client.get("/api/reports/failures", headers=admin_headers)
    print("19. GET /api/reports/failures status:", rep_f_res.status_code, len(rep_f_res.get_json()['data']))

    # Clean up test machine
    db.db["machines"].delete_many({"_id": new_machine_id})
    print("Verification completed and database cleaned up.")
