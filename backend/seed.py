"""
CivicTrack AI — Database Seeding Script (Demo Data)
"""

import sys
import os
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.team import Team
from app.models.category import Category
from app.models.issue import Issue, IssueStatusEvent, IssueImage
from app.models.notification import Notification

CATEGORY_ROSTER = [
    ("Roads & Potholes", "dept-roads", 24, "High"),
    ("Street Lighting", "dept-electrical", 48, "Medium"),
    ("Garbage & Sanitation", "dept-sanitation", 8, "High"),
    ("Water Supply & Leakage", "dept-water", 12, "Critical"),
    ("Drainage & Sewage", "dept-water", 18, "High"),
    ("Traffic & Signs", "dept-traffic", 24, "High"),
    ("Parks & Trees", "dept-parks", 72, "Low"),
    ("Public Property Damage", "dept-roads", 36, "Medium"),
    ("Noise & Nuisance", "dept-health", 96, "Low"),
    ("Other", "dept-general", 120, "Medium"),
]


def _ensure_issue_columns():
    try:
        with engine.connect() as conn:
            rs = conn.execute(text("PRAGMA table_info(issues)"))
            existing = {row[1] for row in rs.fetchall()}
            desired = [
                ("duplicate_candidates", "TEXT"),
                ("priority_score", "INTEGER DEFAULT 0"),
                ("priority_factors_json", "TEXT"),
            ]
            for col, ddl in desired:
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE issues ADD COLUMN {col} {ddl}"))
            conn.commit()
    except Exception:
        pass


def seed_db():
    print("[+] Starting CivicTrack AI database seed...")
    Base.metadata.create_all(bind=engine)
    _ensure_issue_columns()
    db: Session = SessionLocal()

    try:
        departments = [
            Department(id="dept-roads", name="Public Works Department", code="PWD", head_name="Rajesh Kulkarni"),
            Department(id="dept-water", name="Water Supply & Sewage Board", code="WSSB", head_name="Anil Patil"),
            Department(id="dept-sanitation", name="Sanitation & Waste Management", code="SWM", head_name="Sanjay Deshmukh"),
            Department(id="dept-electrical", name="Electrical Services", code="ES", head_name="Mahesh Jadhav"),
            Department(id="dept-traffic", name="Traffic & Transit Authority", code="TTA", head_name="Inspector Pradeep Naik"),
            Department(id="dept-parks", name="Parks & Horticulture", code="PH", head_name="Sneha Kamat"),
            Department(id="dept-health", name="Health & Environment", code="HE", head_name="Dr. Asha Desai"),
            Department(id="dept-general", name="General Administration", code="GA", head_name="Vikram Mehta"),
        ]
        for d in departments:
            if not db.query(Department).filter(Department.id == d.id).first():
                db.add(d)
        db.commit()

        teams = [
            Team(id="team-hwest-roads", department_id="dept-roads", name="Rapid Action Road Squad 1", leader_name="Ramesh Shinde", ward="Ward H-West"),
            Team(id="team-kwest-roads", department_id="dept-roads", name="Road Maintenance Unit K-West", leader_name="Dinesh Patil", ward="Ward K-West"),
            Team(id="team-water-crew", department_id="dept-water", name="Water Main Maintenance Crew", leader_name="Vijay Thorat", ward="Ward H-West"),
            Team(id="team-drainage-2", department_id="dept-water", name="Drainage Desilting Team 2", leader_name="Sunil Gaikwad", ward="Ward K-West"),
            Team(id="team-sanitation-4", department_id="dept-sanitation", name="Sanitation Crew 4", leader_name="Kailas More", ward="Ward K-West"),
            Team(id="team-lighting-a", department_id="dept-electrical", name="Street Lighting Squad A", leader_name="Anand Lokhande", ward="Ward H-West"),
            Team(id="team-traffic-1", department_id="dept-traffic", name="Traffic Signal Response 1", leader_name="Subhash Jadhav", ward="Ward K-West"),
            Team(id="team-parks-green", department_id="dept-parks", name="Green Belt & Parks Team", leader_name="Sandhya Rane", ward="Ward H-West"),
        ]
        for t in teams:
            if not db.query(Team).filter(Team.id == t.id).first():
                db.add(t)
        db.commit()

        for idx, (cname, dept_id, sla, prio) in enumerate(CATEGORY_ROSTER, start=1):
            cat_id = f"cat-{idx}"
            existing = db.query(Category).filter(Category.name == cname).first()
            if not existing:
                db.add(Category(id=cat_id, name=cname, department_id=dept_id, default_sla_hours=sla, default_priority=prio))
            else:
                if not existing.department_id:
                    existing.department_id = dept_id
        db.commit()

        demo_pwd = hash_password("password123")
        users = [
            User(id="usr-citizen-demo", email="citizen@demo.org", hashed_password=demo_pwd, name="Aarav Sharma", role=UserRole.Citizen, ward="Ward K-West"),
            User(id="usr-citizen-2", email="citizen2@demo.org", hashed_password=demo_pwd, name="Rohan Mehta", role=UserRole.Citizen, ward="Ward K-West"),
            User(id="usr-citizen-3", email="citizen3@demo.org", hashed_password=demo_pwd, name="Priya Desai", role=UserRole.Citizen, ward="Ward H-West"),
            User(id="usr-authority-demo", email="authority@demo.org", hashed_password=demo_pwd, name="Officer Rajesh Varma", role=UserRole.Authority, ward="Ward K-West", department_id="dept-roads"),
            User(id="usr-worker-demo", email="worker@demo.org", hashed_password=demo_pwd, name="Ramesh Shinde", role=UserRole.Worker, ward="Ward K-West", department_id="dept-roads"),
            User(id="usr-worker-2", email="worker2@demo.org", hashed_password=demo_pwd, name="Vijay Thorat", role=UserRole.Worker, ward="Ward H-West", department_id="dept-water"),
            User(id="usr-admin-demo", email="admin@demo.org", hashed_password=demo_pwd, name="Vikram Mehta", role=UserRole.Admin, ward="All Wards"),
        ]
        for u in users:
            if not db.query(User).filter(User.email == u.email).first():
                db.add(u)
        db.commit()

        now = datetime.utcnow()
        sample_issues = []

        master_id = "iss-master-1"
        child1_id = "iss-child-1"
        child2_id = "iss-child-2"

        base_lat, base_lng = 19.1197, 72.8464

        def jitter(val, delta=0.00045):
            return val + random.uniform(-delta, delta)

        master = Issue(
            id=master_id,
            tracking_number="CT-2026-00201",
            title="Deep Hazardous Pothole near SV Road Junction",
            description="Large 2-foot wide crater on the southbound carriageway causing severe vehicle damage and traffic bottlenecks during peak morning hours.",
            category_id="Roads & Potholes",
            status="Confirmed",
            severity="High",
            priority="High",
            ward="Ward K-West",
            address="SV Road, near Shoppers Stop, Andheri West, Mumbai",
            latitude=base_lat,
            longitude=base_lng,
            reporter_id="usr-citizen-demo",
            supporting_count=3,
            assigned_department_id="Public Works Department",
            assigned_team_id="team-kwest-roads",
            ai_confidence=0.94,
            ai_reasoning="Arterial roadway location and high traffic volume indicate high urgency.",
            created_at=now - timedelta(days=5),
            updated_at=now,
            priority_score=55,
        )

        child1 = Issue(
            id=child1_id,
            tracking_number="CT-2026-00206",
            title="Large crater on road outer lane",
            description="Big pothole causing cars to swerve dangerously, observed near bus stop.",
            category_id="Roads & Potholes",
            status="Duplicate",
            severity="High",
            priority="Medium",
            ward="Ward K-West",
            address="SV Road, near Bandra Railway Station West",
            latitude=jitter(base_lat, 0.0002),
            longitude=jitter(base_lng, 0.0002),
            reporter_id="usr-citizen-2",
            supporting_count=1,
            assigned_department_id="Public Works Department",
            is_duplicate=True,
            parent_issue_id=master_id,
            ai_confidence=0.87,
            ai_reasoning="Matches Roads & Potholes classification, medium severity default.",
            created_at=now - timedelta(days=4, hours=2),
            updated_at=now,
        )

        child2 = Issue(
            id=child2_id,
            tracking_number="CT-2026-00215",
            title="Pothole outside Andheri metro entrance",
            description="Wheel of my car got stuck in this pothole, needs immediate repair.",
            category_id="Roads & Potholes",
            status="Duplicate",
            severity="High",
            priority="Medium",
            ward="Ward K-West",
            address="Near Andheri West Metro Station Gate 2",
            latitude=jitter(base_lat, 0.0003),
            longitude=jitter(base_lng, 0.0002),
            reporter_id="usr-citizen-3",
            supporting_count=1,
            assigned_department_id="Public Works Department",
            is_duplicate=True,
            parent_issue_id=master_id,
            ai_confidence=0.89,
            ai_reasoning="Vehicle damage report implies moderate severity.",
            created_at=now - timedelta(days=3, hours=6),
            updated_at=now,
        )

        issue_await = Issue(
            id="iss-verification-1",
            tracking_number="CT-2026-00303",
            title="Broken street light pole (hazardous)",
            description="Street light pole is tilted dangerously after recent storm, risk of falling on pedestrians.",
            category_id="Street Lighting",
            status="Awaiting Verification",
            severity="Critical",
            priority="High",
            ward="Ward H-West",
            address="Hill Road, near Holy Family Hospital, Bandra West",
            latitude=19.0596,
            longitude=72.8295,
            reporter_id="usr-citizen-3",
            supporting_count=4,
            assigned_department_id="Electrical Services",
            assigned_team_id="team-lighting-a",
            ai_confidence=0.95,
            ai_reasoning="Critical risk: structural hazard on high-foot-traffic sidewalk.",
            created_at=now - timedelta(days=7),
            updated_at=now,
            priority_score=68,
        )

        issue_work = Issue(
            id="iss-work-1",
            tracking_number="CT-2026-00420",
            title="Water pipe burst on 5th Lane",
            description="Underground water pipe has been leaking profusely for past 24 hours, flooding road.",
            category_id="Water Supply & Leakage",
            status="Assigned",
            severity="Critical",
            priority="Critical",
            ward="Ward H-West",
            address="5th Lane, Khar West",
            latitude=19.0791,
            longitude=72.8331,
            reporter_id="usr-citizen-2",
            supporting_count=2,
            assigned_department_id="Water Supply & Sewage Board",
            assigned_team_id="team-water-crew",
            ai_confidence=0.97,
            ai_reasoning="Burst water pipe on residential street - critical infrastructure emergency.",
            created_at=now - timedelta(days=2),
            updated_at=now,
            priority_score=65,
        )

        issue_reported = Issue(
            id="iss-reported-1",
            tracking_number="CT-2026-00501",
            title="Overflowing garbage bin outside school",
            description="Garbage bin near SVVM school has been overflowing for 2 days, serious health risk for children.",
            category_id="Garbage & Sanitation",
            status="Reported",
            severity="High",
            priority="Medium",
            ward="Ward K-West",
            address="Outside SVVM School, JP Road, Andheri West",
            latitude=19.1277,
            longitude=72.8415,
            reporter_id="usr-citizen-demo",
            supporting_count=1,
            assigned_department_id="Sanitation & Waste Management",
            ai_confidence=0.90,
            ai_reasoning="Overflow near educational zone elevates sanitation urgency.",
            created_at=now - timedelta(hours=6),
            updated_at=now,
            priority_score=35,
        )

        for issue in [master, child1, child2, issue_await, issue_work, issue_reported]:
            if not db.query(Issue).filter(Issue.id == issue.id).first():
                db.add(issue)
        db.commit()

        seeded_issues = db.query(Issue).filter(Issue.id.in_([master_id, child1_id, child2_id, issue_await.id, issue_work.id, issue_reported.id])).all()
        for issue in seeded_issues:
            if issue.status_history and len(issue.status_history) > 0:
                continue
            first = IssueStatusEvent(
                id=f"evt-seed-{issue.id}",
                issue_id=issue.id,
                status="Reported",
                updated_by=issue.reporter.name if issue.reporter else "System",
                user_role="Citizen",
                timestamp=issue.created_at,
                comment="Initial complaint filed by citizen."
            )
            db.add(first)
            if issue.status != "Reported":
                db.add(IssueStatusEvent(
                    id=f"evt-seed2-{issue.id}",
                    issue_id=issue.id,
                    status=issue.status,
                    updated_by="Officer Rajesh Varma",
                    user_role="Authority",
                    timestamp=issue.updated_at,
                    comment=f"Status updated to {issue.status} during triage."
                ))
        db.commit()

        print("[SUCCESS] Demo database successfully seeded!")
        print("--------------------------------------------------")
        print(f"Departments: {db.query(Department).count()} seeded")
        print(f"Teams: {db.query(Team).count()} seeded")
        print(f"Categories: {db.query(Category).count()} seeded")
        print(f"Issues: {db.query(Issue).count()} seeded (including master + 2 linked duplicates)")
        print("--------------------------------------------------")
        print("Demo User Credentials (Password: password123):")
        print("  - Citizen:   citizen@demo.org / citizen2@demo.org / citizen3@demo.org")
        print("  - Authority: authority@demo.org")
        print("  - Worker:    worker@demo.org / worker2@demo.org")
        print("  - Admin:     admin@demo.org")
        print("--------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
