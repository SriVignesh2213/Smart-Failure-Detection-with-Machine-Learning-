from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    # Successful registration
    response = client.post(
        "/api/auth/register",
        json={
            "email": "engineer2@factory.com",
            "password": "securepassword123",
            "full_name": "Jane Engineer",
            "role": "engineer"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "engineer2@factory.com"
    assert data["full_name"] == "Jane Engineer"
    assert data["role"] == "engineer"
    assert "hashed_password" not in data

def test_register_duplicate_email():
    # Attempt to register with existing email (pre-populated in conftest)
    response = client.post(
        "/api/auth/register",
        json={
            "email": "admin@factory.com",
            "password": "somepassword",
            "full_name": "Admin Clone",
            "role": "engineer"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success():
    # Successful login for pre-populated admin user
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@factory.com",
            "password": "adminpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password():
    # Failed login with invalid password
    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin@factory.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
