import pytest

def test_assign_issue_department_and_team(client, citizen_headers, admin_headers):
    # Create issue
    res = client.post("/api/v1/issues/", data={
        "title": "Water Leak on MG Road",
        "description": "Burst pipe leaking onto road",
        "category": "Water Pipeline Leak",
        "address": "MG Road, Ward A",
        "ward": "Ward A",
        "latitude": "18.9220",
        "longitude": "72.8346"
    }, headers=citizen_headers)
    assert res.status_code in (200, 201)
    issue_id = res.json()["id"]

    # Assign department and team
    assign_res = client.post(f"/api/v1/issues/{issue_id}/assign", json={
        "departmentId": "dept-water",
        "teamId": "team-water-1"
    }, headers=admin_headers)
    assert assign_res.status_code == 200
    data = assign_res.json()
    assert data["assignedDepartmentId"] == "dept-water"
    assert data["assignedTeamId"] == "team-water-1"
