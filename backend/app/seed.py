import uuid
import random
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.team import Team
from app.models.category import Category
from app.models.sla import SLARule
from app.models.issue import Issue, IssueStatusEvent, IssueImage
from app.core.security import hash_password


def _ensure(db: Session, model, lookup_field: str, lookup_value, data: dict, alt_fields: Optional[List[str]] = None):
    existing = db.query(model).filter(getattr(model, lookup_field) == lookup_value).first()
    if existing:
        return existing, False
    if alt_fields:
        for af in alt_fields:
            if af in data:
                alt = db.query(model).filter(getattr(model, af) == data[af]).first()
                if alt:
                    return alt, False
    obj = model(**data)
    db.add(obj)
    try:
        db.flush()
    except Exception:
        db.rollback()
        existing = db.query(model).filter(getattr(model, lookup_field) == lookup_value).first()
        if existing:
            return existing, False
        if alt_fields:
            for af in alt_fields:
                if af in data:
                    alt = db.query(model).filter(getattr(model, af) == data[af]).first()
                    if alt:
                        return alt, False
        raise
    return obj, True


def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        default_hashed = hash_password("password123")

        departments_data = [
            {"id": "dept-roads", "name": "Roads & Traffic Department", "code": "RTD", "head_name": "Dr. Pradeep Kulkarni"},
            {"id": "dept-water", "name": "Water Supply & Sewerage", "code": "WSD", "head_name": "Smt. Anjali Desai"},
            {"id": "dept-sanitation", "name": "Solid Waste Management", "code": "SWM", "head_name": "Shri. Mahesh Patil"},
            {"id": "dept-parks", "name": "Garden & Tree Authority", "code": "GTA", "head_name": "Dr. Meera Iyer"},
            {"id": "dept-electrical", "name": "Electrical & Street Lighting", "code": "ESL", "head_name": "Shri. Kiran More"},
        ]
        departments = {}
        for d in departments_data:
            obj, _ = _ensure(db, Department, "id", d["id"], d, alt_fields=["code", "name"])
            departments[obj.id] = obj

        teams_data = [
            {"id": "team-roads-pothole", "department_id": "dept-roads", "name": "Pothole Repair Unit - K West", "leader_name": "Shankar Gaikwad", "ward": "Ward K-West"},
            {"id": "team-roads-signal", "department_id": "dept-roads", "name": "Traffic Signal Maintenance", "leader_name": "Vijay Borate", "ward": "Ward K-West"},
            {"id": "team-water-main", "department_id": "dept-water", "name": "Water Mainline Crew", "leader_name": "Prakash Sawant", "ward": "Ward K-West"},
            {"id": "team-san-sweep", "department_id": "dept-sanitation", "name": "Lane Sweeping & Lifting", "leader_name": "Sachin Vaidya", "ward": "Ward K-West"},
            {"id": "team-parks-hort", "department_id": "dept-parks", "name": "Horticulture Squad", "leader_name": "Rohan Deshmukh", "ward": "Ward K-West"},
            {"id": "team-elect-street", "department_id": "dept-electrical", "name": "Street Light Maintenance", "leader_name": "Milind Chavan", "ward": "Ward K-West"},
        ]
        for t in teams_data:
            _ensure(db, Team, "id", t["id"], t, alt_fields=["name"])

        categories_data = [
            {"id": "cat-roads-potholes", "name": "Roads & Potholes", "department_id": "dept-roads", "default_sla_hours": 24, "default_priority": "High"},
            {"id": "cat-water-leak", "name": "Water Pipeline Leak", "department_id": "dept-water", "default_sla_hours": 12, "default_priority": "Critical"},
            {"id": "cat-water-supply", "name": "Water Supply Shortage", "department_id": "dept-water", "default_sla_hours": 24, "default_priority": "High"},
            {"id": "cat-san-garbage", "name": "Garbage Not Collected", "department_id": "dept-sanitation", "default_sla_hours": 18, "default_priority": "Medium"},
            {"id": "cat-san-public", "name": "Public Toilet Issue", "department_id": "dept-sanitation", "default_sla_hours": 12, "default_priority": "High"},
            {"id": "cat-park-maintain", "name": "Park Maintenance", "department_id": "dept-parks", "default_sla_hours": 72, "default_priority": "Low"},
            {"id": "cat-tree-fallen", "name": "Fallen Tree / Branch", "department_id": "dept-parks", "default_sla_hours": 6, "default_priority": "Critical"},
            {"id": "cat-streetlight", "name": "Street Light Not Working", "department_id": "dept-electrical", "default_sla_hours": 24, "default_priority": "Medium"},
            {"id": "cat-traffic-signal", "name": "Traffic Signal Fault", "department_id": "dept-roads", "default_sla_hours": 4, "default_priority": "Critical"},
            {"id": "cat-air-quality", "name": "Air Quality / Dust", "department_id": "dept-sanitation", "default_sla_hours": 48, "default_priority": "Medium"},
        ]
        categories = {}
        for c in categories_data:
            obj, created = _ensure(db, Category, "id", c["id"], c, alt_fields=["name"])
            categories[obj.id] = obj
            if created:
                target_hours = obj.default_sla_hours
                rule = SLARule(
                    id=f"sla-{uuid.uuid4().hex[:8]}",
                    category_id=obj.id,
                    target_hours=target_hours,
                    at_risk_pct=0.6,
                    overdue_pct=1.0,
                    breached_pct=1.2,
                    escalation1_hours=int(target_hours * 0.5),
                    escalation2_hours=int(target_hours * 0.9),
                )
                existing_rule = db.query(SLARule).filter(SLARule.category_id == obj.id).first()
                if not existing_rule:
                    db.add(rule)
        db.flush()

        demo_users = [
            {
                "id": "usr-citizen-demo",
                "email": "citizen@demo.org",
                "name": "Aarav Sharma",
                "role": UserRole.Citizen,
                "phone": "+91 98200 12345",
                "ward": "Ward K-West"
            },
            {
                "id": "usr-citizen-2",
                "email": "citizen2@demo.org",
                "name": "Priya Nair",
                "role": UserRole.Citizen,
                "phone": "+91 98200 22222",
                "ward": "Ward K-West"
            },
            {
                "id": "usr-citizen-3",
                "email": "citizen3@demo.org",
                "name": "Sameer Joshi",
                "role": UserRole.Citizen,
                "phone": "+91 98200 33333",
                "ward": "Ward K-West"
            },
            {
                "id": "usr-authority-demo",
                "email": "authority@demo.org",
                "name": "Officer Rajesh Varma",
                "role": UserRole.Authority,
                "phone": "+91 98211 54321",
                "ward": "Ward K-West",
                "department_id": "dept-roads"
            },
            {
                "id": "usr-worker-demo",
                "email": "worker@demo.org",
                "name": "Ramesh Shinde",
                "role": UserRole.Worker,
                "phone": "+91 98922 99887",
                "ward": "Ward K-West",
                "department_id": "dept-roads"
            },
            {
                "id": "usr-worker-water",
                "email": "worker-water@demo.org",
                "name": "Prakash Sawant",
                "role": UserRole.Worker,
                "phone": "+91 98922 11111",
                "ward": "Ward K-West",
                "department_id": "dept-water"
            },
            {
                "id": "usr-admin-demo",
                "email": "admin@demo.org",
                "name": "Vikram Mehta",
                "role": UserRole.Admin,
                "phone": "+91 98000 00001"
            }
        ]
        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_user = User(
                    id=u["id"],
                    email=u["email"],
                    name=u["name"],
                    role=u["role"],
                    hashed_password=default_hashed,
                    phone=u.get("phone"),
                    ward=u.get("ward"),
                    department_id=u.get("department_id")
                )
                db.add(new_user)
        db.flush()

        cnt = db.query(Issue).count()
        if cnt > 0:
            db.commit()
            print(f"Demo seed complete (issues already present: {cnt}).")
            return

        WARD = "Ward K-West"
        BASE_LAT = 19.1152
        BASE_LNG = 72.8355

        def _jitter(lat, lng, meters_lat, meters_lng):
            dlat = meters_lat / 111320.0
            dlng = meters_lng / (111320.0 * 0.92)
            return lat + random.uniform(-dlat, dlat), lng + random.uniform(-dlng, dlng)

        now = datetime.utcnow()

        issues_to_create = [
            {
                "cat_id": "cat-roads-potholes",
                "title": "Deep pothole on SV Road near Andheri station",
                "description": "Large 2ft-wide pothole has developed on the main carriageway of SV Road outside Andheri West station. Multiple vehicles damaged in last 24 hrs. Risk of serious accident.",
                "coord": _jitter(BASE_LAT, BASE_LNG, 12, 12),
                "severity": "High",
                "status": "Assigned",
                "team_id": "team-roads-pothole",
                "dept_id": "dept-roads",
                "assigned_days_ago": 3,
                "created_days_ago": 4,
                "ward": WARD,
                "address": "SV Road, Andheri West, near Railway Station East",
                "reporter_id": "usr-citizen-demo",
                "supporting_count": 7,
            },
            {
                "cat_id": "cat-roads-potholes",
                "title": "Cluster of potholes at JP Road junction",
                "description": "Series of 6-8 medium potholes within 50m stretch at JP Road / SV Road junction. Causes traffic bottleneck during peak hours. Water-logging risk.",
                "coord": _jitter(BASE_LAT, BASE_LNG, 10, 10),
                "severity": "High",
                "status": "In Progress",
                "team_id": "team-roads-pothole",
                "dept_id": "dept-roads",
                "assigned_days_ago": 1,
                "created_days_ago": 2,
                "ward": WARD,
                "address": "JP Road, Andheri West, near Telli Galli junction",
                "reporter_id": "usr-citizen-2",
                "supporting_count": 5,
            },
            {
                "cat_id": "cat-roads-potholes",
                "title": "Pothole on side lane near Versova bridge",
                "description": "Medium-sized pothole on the service lane approaching Versova bridge. Two-wheeler riders forced into main traffic, dangerous.",
                "coord": _jitter(BASE_LAT, BASE_LNG, 20, 20),
                "severity": "Medium",
                "status": "Reported",
                "team_id": None,
                "dept_id": "dept-roads",
                "assigned_days_ago": None,
                "created_days_ago": 0.4,
                "ward": WARD,
                "address": "Versova Bridge Service Road, Andheri West",
                "reporter_id": "usr-citizen-3",
                "supporting_count": 3,
            },
            {
                "cat_id": "cat-water-leak",
                "title": "Major water pipeline burst near 4 Bungalows",
                "description": "Underground water main (approx 8-inch) has burst opposite 4 Bungalows bus stop. Heavy water wastage, road surface flooding, adjacent buildings experiencing low pressure.",
                "coord": _jitter(BASE_LAT, BASE_LNG, 220, 220),
                "severity": "Critical",
                "status": "Verified",
                "team_id": "team-water-main",
                "dept_id": "dept-water",
                "assigned_days_ago": 1.5,
                "created_days_ago": 2.5,
                "ward": WARD,
                "address": "4 Bungalows, Andheri West, near bus depot",
                "reporter_id": "usr-citizen-2",
                "supporting_count": 11,
            },
            {
                "cat_id": "cat-san-garbage",
                "title": "Garbage pile not cleared for 4 days",
                "description": "Residential lane near Lokhandwala market has a garbage accumulation point that has not been lifted for 4 consecutive days. Pest activity visible, bad odor.",
                "coord": _jitter(BASE_LAT, BASE_LNG, 420, 420),
                "severity": "Medium",
                "status": "Assigned",
                "team_id": "team-san-sweep",
                "dept_id": "dept-sanitation",
                "assigned_days_ago": 0.5,
                "created_days_ago": 1.2,
                "ward": WARD,
                "address": "Lokhandwala Market Lane 3, Andheri West",
                "reporter_id": "usr-citizen-demo",
                "supporting_count": 2,
            },
            {
                "cat_id": "cat-streetlight",
                "title": "Entire street dark - pole 47 not working",
                "description": "Street light pole #47 on Yari Road is completely non-functional for 2 weeks. Whole stretch between bldg 12-18 is pitch black at night, multiple chain-snatching incidents reported nearby.",
                "coord": _jitter(BASE_LAT, BASE_LNG, 700, 700),
                "severity": "High",
                "status": "Reopened",
                "team_id": "team-elect-street",
                "dept_id": "dept-electrical",
                "assigned_days_ago": 6,
                "created_days_ago": 9,
                "ward": WARD,
                "address": "Yari Road, Pole #47, Andheri West",
                "reporter_id": "usr-citizen-3",
                "supporting_count": 4,
            },
        ]

        created_issues = []
        random.seed(42)
        for idx, spec in enumerate(issues_to_create):
            lat, lng = spec["coord"]
            created_at = now - timedelta(days=spec["created_days_ago"])
            iid = f"iss-seed-{idx+1:02d}"
            issue = Issue(
                id=iid,
                tracking_number=f"CT-2026-{10000 + idx + 1}",
                title=spec["title"],
                description=spec["description"],
                category_id=spec["cat_id"],
                status=spec["status"],
                severity=spec["severity"],
                priority="Medium",
                ward=spec["ward"],
                address=spec["address"],
                latitude=lat,
                longitude=lng,
                reporter_id=spec["reporter_id"],
                supporting_count=spec["supporting_count"],
                assigned_department_id=spec["dept_id"],
                assigned_team_id=spec["team_id"],
                ai_confidence=0.96,
                ai_reasoning=f"Rule-classified as {spec['cat_id']} from keywords in title+desc. Severity {spec['severity']} inferred from impact wording + location type.",
                priority_score=0,
                created_at=created_at,
                updated_at=created_at,
            )
            db.add(issue)
            db.flush()

            # Seed before image for issue
            img_urls = {
                "cat-roads-potholes": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop",
                "cat-water-leak": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?w=600&auto=format&fit=crop",
                "cat-san-garbage": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop",
                "cat-streetlight": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop",
            }
            before_url = img_urls.get(spec["cat_id"], "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop")
            db.add(IssueImage(
                id=f"img-seed-{idx+1:02d}-before",
                issue_id=issue.id,
                url=before_url,
                caption="Initial citizen site inspection photo",
                uploaded_by_role="Citizen",
                uploaded_at=created_at,
            ))

            # Seed after image if status is Verified or Reopened
            if spec["status"] in ("Verified", "Resolution Submitted", "Reopened"):
                db.add(IssueImage(
                    id=f"img-seed-{idx+1:02d}-after",
                    issue_id=issue.id,
                    url="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop",
                    caption="After-repair completion photo",
                    uploaded_by_role="Worker",
                    uploaded_at=created_at + timedelta(days=1),
                ))

            cat = categories.get(spec["cat_id"])
            if cat and cat.default_priority:
                issue.priority = cat.default_priority

            created_issues.append(issue)

            reporter = db.query(User).filter(User.id == spec["reporter_id"]).first()
            reporter_name = reporter.name if reporter else "Citizen"
            reporter_role = reporter.role.value if reporter else "Citizen"

            rep = IssueStatusEvent(
                id=f"evt-seed-{idx+1:02d}-0",
                issue_id=issue.id,
                status="Reported",
                updated_by=reporter_name,
                user_role=reporter_role,
                comment=f"Citizen reported from mobile. Category: {cat.name if cat else spec['cat_id']}",
                timestamp=created_at,
            )
            db.add(rep)

            if spec["assigned_days_ago"] is not None and spec["team_id"]:
                assigned_at = now - timedelta(days=spec["assigned_days_ago"])
                assigner = db.query(User).filter(User.id == "usr-authority-demo").first()
                aname = assigner.name if assigner else "Officer Rajesh Varma"
                arole = assigner.role.value if assigner else "Authority"
                asg = IssueStatusEvent(
                    id=f"evt-seed-{idx+1:02d}-1",
                    issue_id=issue.id,
                    status="Assigned",
                    updated_by=aname,
                    user_role=arole,
                    comment=f"Auto-routed to team {spec['team_id']} by ward dispatcher.",
                    timestamp=assigned_at,
                )
                db.add(asg)

                if spec["status"] == "In Progress":
                    start_at = now - timedelta(days=0.5)
                    worker = db.query(User).filter(User.id == "usr-worker-demo").first()
                    wname = worker.name if worker else "Ramesh Shinde"
                    wrole = worker.role.value if worker else "Worker"
                    st = IssueStatusEvent(
                        id=f"evt-seed-{idx+1:02d}-2",
                        issue_id=issue.id,
                        status="In Progress",
                        updated_by=wname,
                        user_role=wrole,
                        comment="Crew on site. Cold mix patch material applied; waiting for compaction.",
                        timestamp=start_at,
                    )
                    db.add(st)

                if spec["status"] == "Verified":
                    resolve_at = now - timedelta(days=0.8)
                    worker = db.query(User).filter(User.id == "usr-worker-water").first()
                    wname = worker.name if worker else "Prakash Sawant"
                    wrole = worker.role.value if worker else "Worker"
                    comp = IssueStatusEvent(
                        id=f"evt-seed-{idx+1:02d}-2",
                        issue_id=issue.id,
                        status="Resolution Submitted",
                        updated_by=wname,
                        user_role=wrole,
                        comment="Section of 8-inch GI pipe replaced. Joints sealed, pressure restored to 3.5 bar. Sample collected, no leak observed after 2h.",
                        timestamp=resolve_at,
                    )
                    db.add(comp)
                    verify_at = now - timedelta(days=0.2)
                    verifier = db.query(User).filter(User.id == "usr-citizen-2").first()
                    vname = verifier.name if verifier else reporter_name
                    vrole = verifier.role.value if verifier else "Citizen"
                    vfy = IssueStatusEvent(
                        id=f"evt-seed-{idx+1:02d}-3",
                        issue_id=issue.id,
                        status="Verified",
                        updated_by=vname,
                        user_role=vrole,
                        comment="Water supply back to normal in area. No flooding visible on site. Issue resolved to my satisfaction.",
                        timestamp=verify_at,
                    )
                    db.add(vfy)

                if spec["status"] == "Reopened":
                    resolve_at = now - timedelta(days=4)
                    worker = db.query(User).filter(User.id == "usr-worker-demo").first()
                    wname = worker.name if worker else "Ramesh Shinde"
                    wrole = worker.role.value if worker else "Worker"
                    comp = IssueStatusEvent(
                        id=f"evt-seed-{idx+1:02d}-2",
                        issue_id=issue.id,
                        status="Resolution Submitted",
                        updated_by=wname,
                        user_role=wrole,
                        comment="Bulb replaced in pole #47. Light functioning at time of testing.",
                        timestamp=resolve_at,
                    )
                    db.add(comp)
                    verify_at = now - timedelta(days=3)
                    vfy = IssueStatusEvent(
                        id=f"evt-seed-{idx+1:02d}-3",
                        issue_id=issue.id,
                        status="Verified",
                        updated_by=reporter_name,
                        user_role=reporter_role,
                        comment="Temporarily working. Citizen confirmed same night.",
                        timestamp=verify_at,
                    )
                    db.add(vfy)
                    reopen_at = now - timedelta(days=0.1)
                    ro = IssueStatusEvent(
                        id=f"evt-seed-{idx+1:02d}-4",
                        issue_id=issue.id,
                        status="Reopened",
                        updated_by=reporter_name,
                        user_role=reporter_role,
                        comment="Light failed again after 2 days. Ballast appears burnt. Same pole #47 still off after sunset.",
                        timestamp=reopen_at,
                    )
                    db.add(ro)
                    issue.updated_at = reopen_at

            issue.priority_score = 70 + (idx * 5)
            try:
                issue.priority_factors_json = json.dumps({
                    "severity": {"points": 25, "value": spec["severity"]},
                    "report_count": {"points": min(25, int(spec["supporting_count"]) * 4), "value": spec["supporting_count"]},
                    "category_sla": {"points": 20, "value": f"{cat.default_sla_hours if cat else 24}h SLA"},
                })
            except Exception:
                pass

        from app.ai.priority import priority_engine
        for issue in created_issues:
            all_issues = db.query(Issue).all()
            try:
                res = priority_engine.calculate_priority(
                    severity=issue.severity,
                    report_count=issue.supporting_count or 1,
                    created_at=issue.created_at,
                    is_recurrent=False,
                    issue_id=issue.id,
                    lat=issue.latitude,
                    lng=issue.longitude,
                    category=issue.category_id,
                    nearby_issues=all_issues,
                )
                issue.priority = res["priority"]
                issue.priority_score = int(res["total_score"])
                issue.priority_factors_json = json.dumps(res["factors"])
            except Exception:
                pass

        db.commit()
        print(f"Demo seed complete. Seeded: {len(departments)} depts, {len(teams_data)} teams, {len(categories)} categories (+ SLA rules), {len(demo_users)} users, {len(created_issues)} issues with status history.")
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error in seed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
