from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, and_
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.issue import Issue, IssueStatusEvent
from app.models.category import Category
from app.models.department import Department
from app.ai.hotspots import find_hotspots, label_recurring, get_last_sklearn_used

router = APIRouter(prefix="/analytics", tags=["Analytics"])

RESOLVED_STATUSES = {"Verified", "Resolved"}
PENDING_STATUSES = {
    "Reported", "Under Review", "Confirmed", "Assigned",
    "Work Scheduled", "In Progress", "Resolution Submitted",
    "Awaiting Verification", "Reopened",
}


def _avg_resolution_hours(db: Session) -> float:
    try:
        verified_ids = [
            r[0] for r in db.query(Issue.id)
            .filter(Issue.status == "Verified")
            .all()
        ]
        if not verified_ids:
            return 0.0
        total_hours = 0.0
        count = 0
        for iid in verified_ids:
            assigned = (
                db.query(func.min(IssueStatusEvent.timestamp))
                .filter(
                    IssueStatusEvent.issue_id == iid,
                    IssueStatusEvent.status == "Assigned",
                )
                .scalar()
            )
            verified = (
                db.query(func.max(IssueStatusEvent.timestamp))
                .filter(
                    IssueStatusEvent.issue_id == iid,
                    IssueStatusEvent.status == "Verified",
                )
                .scalar()
            )
            if assigned and verified and verified > assigned:
                delta = verified - assigned
                total_hours += delta.total_seconds() / 3600.0
                count += 1
        if count == 0:
            return 0.0
        return round(total_hours / count, 2)
    except Exception:
        return 0.0


def _compute_sla_counts(db: Session) -> Dict[str, int]:
    counts = {"Normal": 0, "At Risk": 0, "Overdue": 0, "Breached": 0}
    try:
        from app.core.sla_engine import compute_sla_state
        all_issues = db.query(Issue).all()
        for iss in all_issues:
            status = iss.status or ""
            if status in RESOLVED_STATUSES:
                counts["Normal"] += 1
                continue
            sla = compute_sla_state(db, iss)
            state = sla.state or "Normal"
            if state in counts:
                counts[state] += 1
            else:
                counts["Normal"] += 1
    except Exception:
        pass
    return counts


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    totalReported = db.query(func.count(Issue.id)).scalar() or 0

    totalResolved = (
        db.query(func.count(Issue.id))
        .filter(Issue.status.in_(list(RESOLVED_STATUSES)))
        .scalar()
    ) or 0

    totalPending = (
        db.query(func.count(Issue.id))
        .filter(Issue.status.in_(list(PENDING_STATUSES)))
        .scalar()
    ) or 0

    duplicatesMerged = (
        db.query(func.count(Issue.id))
        .filter(Issue.is_duplicate == True)
        .scalar()
    ) or 0

    reopenedCount = (
        db.query(func.count(IssueStatusEvent.id))
        .filter(IssueStatusEvent.status == "Reopened")
        .scalar()
    ) or 0

    avgResolutionHours = _avg_resolution_hours(db)

    byCategoryRows = (
        db.query(Category.name, func.count(Issue.id))
        .outerjoin(Issue, Issue.category_id == Category.id)
        .group_by(Category.name)
        .all()
    )
    byCategory = {name: (cnt or 0) for (name, cnt) in byCategoryRows}
    uncat = (
        db.query(func.count(Issue.id))
        .filter(Issue.category_id.is_(None))
        .scalar()
    ) or 0
    if uncat:
        byCategory["Uncategorized"] = uncat

    byStatusRows = (
        db.query(Issue.status, func.count(Issue.id))
        .group_by(Issue.status)
        .all()
    )
    byStatus = {(s or "Unknown"): (cnt or 0) for (s, cnt) in byStatusRows}

    byWardRows = (
        db.query(Issue.ward, func.count(Issue.id))
        .group_by(Issue.ward)
        .all()
    )
    byWard = {(w or "Unknown"): (cnt or 0) for (w, cnt) in byWardRows}

    slaCounts = _compute_sla_counts(db)

    verifiedCount = (
        db.query(func.count(Issue.id))
        .filter(Issue.status == "Verified")
        .scalar()
    ) or 0
    if totalResolved > 0:
        satisfactionPct = round((float(verifiedCount) / float(totalResolved)) * 100.0, 2)
    else:
        satisfactionPct = 0.0

    return {
        "totalReported": int(totalReported),
        "totalResolved": int(totalResolved),
        "totalPending": int(totalPending),
        "duplicatesMerged": int(duplicatesMerged),
        "reopenedCount": int(reopenedCount),
        "avgResolutionHours": float(avgResolutionHours),
        "byCategory": byCategory,
        "byStatus": byStatus,
        "byWard": byWard,
        "slaCounts": slaCounts,
        "citizenSatisfactionPct": satisfactionPct,
    }


@router.get("/trends")
def get_trends(
    days: int = Query(default=14, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)

    all_buckets: Dict[str, Dict[str, Any]] = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        all_buckets[key] = {"date": key, "category_counts": defaultdict(int), "total": 0}

    try:
        cat_map = {}
        for c in db.query(Category).all():
            cat_map[c.id] = c.name

        start_dt = datetime.combine(start_date, datetime.min.time())
        rows = (
            db.query(Issue)
            .filter(Issue.created_at >= start_dt)
            .all()
        )
        for iss in rows:
            if not iss.created_at:
                continue
            d_key = iss.created_at.date().strftime("%Y-%m-%d")
            if d_key not in all_buckets:
                continue
            cat_name = cat_map.get(iss.category_id) or "Uncategorized"
            all_buckets[d_key]["category_counts"][cat_name] += 1
            all_buckets[d_key]["total"] += 1
    except Exception:
        pass

    result = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        b = all_buckets[key]
        b["category_counts"] = dict(b["category_counts"])
        result.append(b)
    return result


@router.get("/workload")
def get_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dept_map: Dict[str, Dict[str, Any]] = {}
    for d in db.query(Department).all():
        dept_map[d.id] = {
            "department_id": d.id,
            "department_name": d.name,
            "open_count": 0,
            "in_progress_count": 0,
            "resolved_count": 0,
            "_open_age_seconds": 0.0,
            "_open_count_for_age": 0,
        }

    unassigned_id = "__unassigned__"
    dept_map[unassigned_id] = {
        "department_id": None,
        "department_name": "Unassigned",
        "open_count": 0,
        "in_progress_count": 0,
        "resolved_count": 0,
        "_open_age_seconds": 0.0,
        "_open_count_for_age": 0,
    }

    now = datetime.utcnow()

    for iss in db.query(Issue).all():
        key = iss.assigned_department_id or unassigned_id
        if key not in dept_map:
            dept_map[key] = {
                "department_id": iss.assigned_department_id,
                "department_name": f"Dept {key}",
                "open_count": 0,
                "in_progress_count": 0,
                "resolved_count": 0,
                "_open_age_seconds": 0.0,
                "_open_count_for_age": 0,
            }
        entry = dept_map[key]
        status = iss.status or ""
        if status in RESOLVED_STATUSES:
            entry["resolved_count"] += 1
        else:
            entry["open_count"] += 1
            if status == "In Progress":
                entry["in_progress_count"] += 1
            if iss.created_at:
                age = (now - iss.created_at).total_seconds()
                if age >= 0:
                    entry["_open_age_seconds"] += age
                    entry["_open_count_for_age"] += 1

    result = []
    for entry in dept_map.values():
        avg_age = 0.0
        if entry["_open_count_for_age"] > 0:
            avg_age = round(entry["_open_age_seconds"] / entry["_open_count_for_age"] / 3600.0, 2)
        result.append({
            "department_id": entry["department_id"],
            "department_name": entry["department_name"],
            "open_count": entry["open_count"],
            "in_progress_count": entry["in_progress_count"],
            "resolved_count": entry["resolved_count"],
            "avg_age_open_hours": avg_age,
        })
    return result


@router.get("/hotspots")
def get_hotspots(
    radius_m: float = Query(default=150, ge=1),
    min_samples: int = Query(default=3, ge=1),
    days: int = Query(default=30, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    issues_in_range = (
        db.query(Issue).filter(Issue.created_at >= cutoff).all()
    )

    clusters = find_hotspots(issues_in_range, radius_m=radius_m, min_samples=min_samples)
    sklearn_used = get_last_sklearn_used()

    recurring_labeled_ids: List[str] = []
    for iss in issues_in_range:
        if label_recurring(db, iss, radius_m=100, days=30):
            recurring_labeled_ids.append(iss.id)

    return {
        "clusters": clusters,
        "recurring_labeled_ids": recurring_labeled_ids,
        "total_issues_analyzed": len(issues_in_range),
        "sklearn_used": sklearn_used,
    }


@router.get("/issues/geo")
def get_issues_geo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    all_issues = db.query(Issue).all()
    result = []
    for iss in all_issues:
        is_recurring = label_recurring(db, iss, radius_m=100, days=30)
        result.append({
            "id": iss.id,
            "trackingNumber": iss.tracking_number,
            "lat": iss.latitude,
            "lng": iss.longitude,
            "status": iss.status,
            "category": iss.category_id,
            "title": iss.title,
            "ward": iss.ward,
            "isRecurring": is_recurring,
        })
    return result
