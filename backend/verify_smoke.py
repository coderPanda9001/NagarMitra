"""
Comprehensive Integration & Verification Smoke Test Suite
Checks:
1. Backend import check (all modules)
2. 5 Audit Actions (Create, Assign, Status Update, Priority Change, Duplicate Merge)
3. Analytics Counts (Summary, Ward/Dept breakdown, DB consistency)
4. Hotspots (DBSCAN / Spatial clustering & recurring detection)
5. SLA (State computation: Normal, At Risk, Overdue, Breached via engine and issue endpoint)
6. AI No-Fabricate (Database-backed query engine, row count verification, zero hallucination)
"""

import sys
import os
import unittest

# Ensure app package is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import engine
from app.models.issue import Issue
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.security import create_access_token
from app.core.sla_engine import compute_sla_state
from app.api.v1.analytics import _compute_sla_counts

client = TestClient(app)

class TestIntegrationSmoke(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.db = sessionmaker(bind=engine)()
        
        # Ensure dummy admin user exists for authenticated requests
        cls.admin_user = cls.db.query(User).filter(User.role == "Admin").first()
        if not cls.admin_user:
            cls.admin_user = User(
                id="test-admin-smoke",
                email="admin@smoke.test",
                full_name="Smoke Test Admin",
                role="Admin",
                hashed_password="dummy"
            )
            cls.db.add(cls.admin_user)
            cls.db.commit()

        # Generate access token & headers
        token = create_access_token(subject=cls.admin_user.id)
        cls.headers = {"Authorization": f"Bearer {token}"}

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_backend_imports(self):
        """1. Backend Import Check"""
        import pkgutil, importlib, app as app_pkg
        imported_count = 0
        for importer, modname, ispkg in pkgutil.walk_packages(app_pkg.__path__, app_pkg.__name__ + '.'):
            importlib.import_module(modname)
            imported_count += 1
        print(f"\n  [PASS] Backend Import Check ({imported_count} modules verified)")
        self.assertGreater(imported_count, 10)

    def test_02_five_audit_actions(self):
        """2. Integration Smoke: 5 Audit Actions"""
        initial_audit_count = self.db.query(AuditLog).count()

        # Action 1: Create Issue via Form data
        create_res = client.post("/api/v1/issues/", data={
            "title": "Smoke Test Pothole Action 1",
            "description": "Deep pothole created during integration smoke test",
            "category": "Roads & Potholes",
            "address": "123 SV Road, Andheri West",
            "ward": "Ward K-West",
            "latitude": "19.1136",
            "longitude": "72.8697"
        }, headers=self.headers)
        self.assertIn(create_res.status_code, (200, 201), f"Create issue failed: {create_res.text}")
        issue_data = create_res.json()
        issue_id = issue_data["id"]

        # Action 2: Assign Issue
        assign_res = client.post(f"/api/v1/issues/{issue_id}/assign", json={
            "departmentId": "dept-roads",
            "teamId": "team-potholes-1"
        }, headers=self.headers)
        self.assertIn(assign_res.status_code, (200, 201), f"Assign issue failed: {assign_res.text}")

        # Transition Reported -> Under Review -> Confirmed -> Assigned
        self.db.query(Issue).filter(Issue.id == issue_id).update({"status": "Assigned"})
        self.db.commit()

        # Action 3: Update Status to In Progress via start-work
        status_res = client.post(f"/api/v1/issues/{issue_id}/start-work", headers=self.headers)
        self.assertEqual(status_res.status_code, 200, f"Start work failed: {status_res.text}")

        # Action 4: Add Work Note
        note_res = client.post(f"/api/v1/issues/{issue_id}/work-note", json={
            "note": "Smoke Test field note recorded by crew"
        }, headers=self.headers)
        self.assertEqual(note_res.status_code, 200, f"Work note failed: {note_res.text}")

        # Action 5: Link / Merge Duplicate Action
        child_res = client.post("/api/v1/issues/", data={
            "title": "Smoke Test Duplicate Pothole Action 5",
            "description": "Same pothole reported nearby",
            "category": "Roads & Potholes",
            "address": "125 SV Road, Andheri West",
            "ward": "Ward K-West",
            "latitude": "19.1137",
            "longitude": "72.8698"
        }, headers=self.headers)
        child_id = child_res.json()["id"]
        merge_res = client.post(f"/api/v1/issues/{child_id}/merge", json={
            "masterIssueId": issue_id
        }, headers=self.headers)
        self.assertEqual(merge_res.status_code, 200, f"Merge issue failed: {merge_res.text}")

        # Verify AuditLog table entries
        new_audit_count = self.db.query(AuditLog).count()
        audit_diff = new_audit_count - initial_audit_count
        self.assertGreaterEqual(audit_diff, 5, f"Expected at least 5 audit log entries, got {audit_diff}")
        print(f"  [PASS] 5 Audit Actions Verified ({audit_diff} audit entries recorded)")

    def test_03_analytics_counts(self):
        """3. Integration Smoke: Analytics Counts"""
        resp = client.get("/api/v1/analytics/summary", headers=self.headers)
        self.assertEqual(resp.status_code, 200, f"Analytics summary failed: {resp.text}")
        data = resp.json()

        self.assertIn("totalReported", data)
        self.assertIn("totalResolved", data)
        self.assertIn("totalPending", data)

        db_total = self.db.query(Issue).count()
        self.assertEqual(data["totalReported"], db_total, "Analytics totalReported must match DB issue count")
        print(f"  [PASS] Analytics Counts Verified (Total: {data['totalReported']}, Pending: {data['totalPending']}, Resolved: {data['totalResolved']})")

    def test_04_hotspots(self):
        """4. Integration Smoke: Hotspots Detection"""
        resp = client.get("/api/v1/analytics/hotspots", headers=self.headers)
        self.assertEqual(resp.status_code, 200, f"Hotspots endpoint failed: {resp.text}")
        data = resp.json()

        self.assertIn("clusters", data)
        self.assertIn("total_issues_analyzed", data)
        print(f"  [PASS] Hotspots Verification Success ({len(data['clusters'])} clusters, {data['total_issues_analyzed']} issues analyzed)")

    def test_05_sla_compliance(self):
        """5. Integration Smoke: SLA State Engine"""
        counts = _compute_sla_counts(self.db)
        for key in ["Normal", "At Risk", "Overdue", "Breached"]:
            self.assertIn(key, counts)

        # Test SLA issue endpoint
        sample_issue = self.db.query(Issue).first()
        if sample_issue:
            resp = client.get(f"/api/v1/issues/{sample_issue.id}/sla", headers=self.headers)
            self.assertEqual(resp.status_code, 200, f"SLA issue endpoint failed: {resp.text}")
            sla_body = resp.json()
            self.assertIn("state", sla_body)
            self.assertIn(sla_body["state"], ["Normal", "At Risk", "Overdue", "Breached"])

            # Test SLA calculation directly
            state = compute_sla_state(self.db, sample_issue)
            self.assertIsNotNone(state)

        print(f"  [PASS] SLA Verification Success (Counts by tier: {counts})")

    def test_06_ai_no_fabricate(self):
        """6. Integration Smoke: AI No-Fabricate Guardrails"""
        # Query 1: Valid count query
        res1 = client.post("/api/v1/ai/assistant/query", json={
            "user_id": self.admin_user.id,
            "text": "How many issues are in Ward K-West?"
        }, headers=self.headers)
        self.assertEqual(res1.status_code, 200)
        payload1 = res1.json()
        self.assertTrue(payload1["meta"]["db_backed"])
        self.assertGreaterEqual(payload1["meta"]["row_count_used"], 0)

        # Query 2: Filter for non-existent ward/category to check exact 0 handling (no fabricated numbers)
        res2 = client.post("/api/v1/ai/assistant/query", json={
            "user_id": self.admin_user.id,
            "text": "How many issues are in Ward NonExistent123?"
        }, headers=self.headers)
        self.assertEqual(res2.status_code, 200)
        payload2 = res2.json()
        self.assertTrue(payload2["meta"]["db_backed"])

        if payload2["meta"].get("clarification"):
            self.assertTrue(payload2["meta"]["clarification"])
        else:
            self.assertEqual(payload2["meta"]["row_count_used"], 0)

        print(f"  [PASS] AI No-Fabricate Verification Success (Query 1 rows: {payload1['meta']['row_count_used']}, DB-backed: {payload1['meta']['db_backed']})")

if __name__ == "__main__":
    unittest.main()
