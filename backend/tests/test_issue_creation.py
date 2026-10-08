import pytest

def test_create_issue_success(client, citizen_headers):
    resp = client.post("/api/v1/issues/", data={
        "title": "Broken Street Lamp on Linking Road",
        "description": "Street lamp post has fallen over blocking sidewalk",
        "category": "Street Light Not Working",
        "address": "Linking Road, Bandra West",
        "ward": "Bandra West",
        "latitude": "19.0596",
        "longitude": "72.8295"
    }, headers=citizen_headers)
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "id" in data
    assert data["report"]["title"] == "Broken Street Lamp on Linking Road"
    assert data["status"] == "Reported"

def test_create_issue_missing_field(client, citizen_headers):
    resp = client.post("/api/v1/issues/", data={
        "title": "Missing Ward Pothole",
        "description": "Pothole without ward parameter"
    }, headers=citizen_headers)
    assert resp.status_code == 422
