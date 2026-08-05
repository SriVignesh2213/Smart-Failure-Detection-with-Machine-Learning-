from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_headers():
    # Login as admin to retrieve token
    login_response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@factory.com",
            "password": "adminpassword"
        }
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_get_machines():
    headers = get_auth_headers()
    response = client.get("/api/machines", headers=headers)
    assert response.status_code == 200
    machines = response.json()
    assert len(machines) > 0
    assert machines[0]["serial_number"] == "SN-TEST-123"

def test_prediction_flow():
    headers = get_auth_headers()
    
    # 1. Fetch the pre-populated machine ID
    machines_response = client.get("/api/machines", headers=headers)
    machine_id = machines_response.json()[0]["_id"]
    
    # 2. Run a normal prediction (should have low failure probability)
    normal_payload = {
        "machine_id": machine_id,
        "air_temp": 298.1,
        "process_temp": 308.6,
        "rotational_speed": 1500.0,
        "torque": 40.0,
        "tool_wear": 10.0,
        "product_type": "M"
    }
    
    response = client.post("/api/predict", json=normal_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "failure_probability" in data
    assert "is_failure" in data
    assert "shap_values" in data
    assert "maintenance_action" in data
    assert data["is_failure"] is False

    # 3. Run a failure-inducing prediction (e.g. extremely high torque + tool wear)
    failure_payload = {
        "machine_id": machine_id,
        "air_temp": 304.5,
        "process_temp": 309.2,
        "rotational_speed": 2800.0, # high speed
        "torque": 75.0,            # high torque
        "tool_wear": 240.0,         # extremely worn tool
        "product_type": "L"
    }
    
    response_fail = client.post("/api/predict", json=failure_payload, headers=headers)
    assert response_fail.status_code == 200
    data_fail = response_fail.json()
    assert data_fail["failure_probability"] > 0.40
    assert "failure_type" in data_fail
    assert "maintenance_action" in data_fail
