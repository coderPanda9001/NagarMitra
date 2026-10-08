import pytest

def test_merge_and_split_issue(client, citizen_headers, admin_headers):
    # Create master issue
    res1 = client.post("/api/v1/issues/", data={
        "title": "Master Pothole SV Road",
        "description": "Main report for deep pothole",
        "category": "Roads & Potholes",
        "address": "SV Road, Andheri West",
        "ward": "Andheri West",
        "latitude": "19.1136",
        "longitude": "72.8697"
    }, headers=citizen_headers)
    assert res1.status_code in (200, 201)
    master_id = res1.json()["id"]

    # Create child issue
    res2 = client.post("/api/v1/issues/", data={
        "title": "Child Pothole SV Road",
        "description": "Duplicate report for same pothole",
        "category": "Roads & Potholes",
        "address": "SV Road near Signal",
        "ward": "Andheri West",
        "latitude": "19.1137",
        "longitude": "72.8698"
    }, headers=citizen_headers)
    assert res2.status_code in (200, 201)
    child_id = res2.json()["id"]

    # Merge child into master
    merge_res = client.post(f"/api/v1/issues/{child_id}/merge", json={
        "masterIssueId": master_id
    }, headers=admin_headers)
    assert merge_res.status_code == 200
    merge_data = merge_res.json()
    assert merge_data["id"] == master_id
    assert child_id in merge_data.get("linkedChildIds", [])

    # Split / unlink child from master
    split_res = client.post(f"/api/v1/issues/{child_id}/split", headers=admin_headers)
    assert split_res.status_code == 200
    split_data = split_res.json()
    assert split_data["isDuplicate"] == False
