import pytest

def test_reopen_issue_when_still_not_fixed(client, citizen_headers, admin_headers, worker_headers):
    # 1. Create issue
    res = client.post("/api/v1/issues/", data={
        "title": "Garbage Heap Not Cleaned Properly",
        "description": "Black spots remain after cleanup attempt",
        "category": "Garbage Not Collected",
        "address": "Dadar Market",
        "ward": "Dadar",
        "latitude": "19.0178",
        "longitude": "72.8478"
    }, headers=citizen_headers)
    assert res.status_code in (200, 201)
    issue_id = res.json()["id"]

    # 2. Assign issue to dept-roads
    assign_res = client.post(f"/api/v1/issues/{issue_id}/assign", json={
        "departmentId": "dept-roads",
        "teamId": "team-roads-1"
    }, headers=admin_headers)
    assert assign_res.status_code == 200

    # 3. Start work
    start_res = client.post(f"/api/v1/issues/{issue_id}/start-work", headers=worker_headers)
    assert start_res.status_code == 200

    # 4. Complete work
    comp_res = client.post(f"/api/v1/issues/{issue_id}/complete-work", headers=worker_headers)
    assert comp_res.status_code == 200

    # 5. Reopen issue
    reopen_res = client.post(f"/api/v1/issues/{issue_id}/reopen", headers=citizen_headers)
    assert reopen_res.status_code == 200
    assert reopen_res.json()["status"] == "Reopened"
