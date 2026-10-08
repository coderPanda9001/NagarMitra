import pytest

def test_full_status_transition_lifecycle(client, citizen_headers, admin_headers, worker_headers):
    # 1. Create issue (Reported)
    res = client.post("/api/v1/issues/", data={
        "title": "Open Manhole Drain",
        "description": "Dangerous open drain on street",
        "category": "Drainage",
        "address": "Main Street",
        "ward": "Ward B",
        "latitude": "18.9500",
        "longitude": "72.8300"
    }, headers=citizen_headers)
    assert res.status_code in (200, 201)
    issue_id = res.json()["id"]

    # 2. Assign issue (Assigned)
    assign_res = client.post(f"/api/v1/issues/{issue_id}/assign", json={
        "departmentId": "dept-roads",
        "teamId": "team-roads-1"
    }, headers=admin_headers)
    assert assign_res.status_code == 200

    # 3. Worker starts work (Assigned -> In Progress)
    start_res = client.post(f"/api/v1/issues/{issue_id}/start-work", headers=worker_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "In Progress"

    # 4. Worker completes work (In Progress -> Resolution Submitted)
    comp_res = client.post(f"/api/v1/issues/{issue_id}/complete-work", headers=worker_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] in ("Resolution Submitted", "Awaiting Verification")

    # 5. Verify & close resolution (Verified)
    verify_req = client.post(f"/api/v1/issues/{issue_id}/verify", headers=admin_headers)
    assert verify_req.status_code == 200
    assert verify_req.json()["status"] == "Verified"
