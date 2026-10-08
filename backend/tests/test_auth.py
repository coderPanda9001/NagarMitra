import uuid
import pytest

def test_register_user(client):
    email = f"user_{uuid.uuid4().hex[:6]}@test.com"
    resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "name": "Test User",
        "role": "Citizen"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == email

def test_login_success(client, citizen_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": citizen_user.email,
        "password": "password123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_password(client, citizen_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": citizen_user.email,
        "password": "wrongpassword123"
    })
    assert resp.status_code == 401

def test_get_me_profile(client, citizen_headers):
    resp = client.get("/api/v1/auth/me", headers=citizen_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert data["role"] == "Citizen"
