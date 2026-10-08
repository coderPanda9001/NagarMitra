import pytest

def test_admin_audit_logs_permission(client, admin_headers, citizen_headers):
    # Admin can view audit logs
    admin_res = client.get("/api/v1/audit-logs", headers=admin_headers)
    assert admin_res.status_code == 200

    # Citizen cannot view admin audit logs
    cit_res = client.get("/api/v1/audit-logs", headers=citizen_headers)
    assert cit_res.status_code in (401, 403)
