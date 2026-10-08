import os
import uuid
import random
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.status_fsm import validate_transition
from app.models.user import User, UserRole
from app.models.issue import Issue, IssueImage, IssueStatusEvent, SupportingReport
from app.models.notification import Notification
from app.models.category import Category
from app.models.department import Department
from app.models.team import Team
from app.models.audit_log import AuditLog
from app.core.notifications_manager import notify_user_sync
from app.schemas.issue import (
    IssueOut, CitizenReportOut, IssueImageOut, AIAnalysisOut, IssueStatusEventOut,
    MergeRequest, AssignRequest, WorkNoteRequest, DepartmentOverrideRequest, PriorityFactorsOut,
    FactorDetail
)
from app.ai.classifier import classifier_service, CATEGORY_TO_DEPT
from app.ai.duplicates import duplicate_detector
from app.ai.priority import priority_engine
from app.schemas.sla import IssueSLAStateOut

router = APIRouter(prefix="/issues", tags=["Issues"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def _serialize(d: Dict[str, Any]) -> str:
    try:
        return json.dumps(d, default=str)
    except Exception:
        return str(d)


def _write_audit(
    db: Session,
    current_user: User,
    action: str,
    target_type: str,
    target_id: str,
    old: Optional[Dict[str, Any]] = None,
    new: Optional[Dict[str, Any]] = None,
    extra: Optional[Dict[str, Any]] = None,
):
    details: Dict[str, Any] = {}
    if old is not None:
        details["old"] = old
    if new is not None:
        details["new"] = new
    if old is not None and new is not None:
        changes = {}
        for k in set(list(old.keys()) + list(new.keys())):
            if old.get(k) != new.get(k):
                changes[k] = {"old": old.get(k), "new": new.get(k)}
        details["changes"] = changes
    if extra:
        details["extra"] = extra
    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    audit = AuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=role_val,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=_serialize(details),
        timestamp=datetime.utcnow(),
    )
    db.add(audit)


def _uploads_dir() -> str:
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")


def _event_id() -> str:
    return f"evt-{uuid.uuid4().hex[:8]}"


def _write_status_event(
    db: Session,
    issue: Issue,
    target_status: str,
    user_name: str,
    user_role: str,
    comment: Optional[str] = None,
    force: bool = False,
    audit_user: Optional[User] = None,
) -> bool:
    old_status = issue.status
    status_changed = False
    if not force and issue.status != target_status:
        ok, reason = validate_transition(issue.status, target_status)
        if not ok:
            raise HTTPException(status_code=400, detail=reason)
        issue.status = target_status
        status_changed = True
    elif force and target_status and issue.status != target_status:
        issue.status = target_status
        status_changed = True
    event = IssueStatusEvent(
        id=_event_id(),
        issue_id=issue.id,
        status=issue.status if issue.status else target_status,
        updated_by=user_name,
        user_role=user_role,
        comment=comment,
    )
    db.add(event)
    if status_changed and audit_user is not None:
        _write_audit(
            db,
            audit_user,
            action="Status Transition",
            target_type="Issue",
            target_id=issue.id,
            old={"status": old_status},
            new={"status": issue.status},
            extra={"comment": comment} if comment else None,
        )
    elif comment and audit_user is not None:
        _write_audit(
            db,
            audit_user,
            action="Work Note Added",
            target_type="Issue",
            target_id=issue.id,
            extra={"status": issue.status, "note": comment},
        )
    return True


def _lookup_department_id(db: Session, category_id: str) -> Optional[str]:
    if not category_id:
        return None
    cat = db.query(Category).filter(Category.name == category_id).first()
    if not cat:
        cat = db.query(Category).filter(Category.id == category_id).first()
    if cat and cat.department_id:
        dept = db.query(Department).filter(Department.id == cat.department_id).first()
        if dept:
            return dept.name
    fallback = CATEGORY_TO_DEPT.get(category_id)
    return fallback


def _parse_duplicate_ids(issue: Issue) -> List[str]:
    raw = getattr(issue, "duplicate_candidates", None)
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(x) for x in parsed if x]
    except Exception:
        return [x.strip() for x in raw.split(",") if x.strip()]
    return []


def _find_users_by_role(db: Session, roles: List[UserRole]) -> List[User]:
    return db.query(User).filter(User.role.in_(roles)).all()


def _find_assigned_workers(db: Session, issue: Issue) -> List[User]:
    users: List[User] = []
    if issue.assigned_team_id:
        team = db.query(Team).filter(Team.id == issue.assigned_team_id).first()
        if team and team.assigned_user_ids:
            try:
                ids = json.loads(team.assigned_user_ids) if isinstance(team.assigned_user_ids, str) else team.assigned_user_ids
                if isinstance(ids, list):
                    for uid in ids:
                        u = db.query(User).filter(User.id == str(uid)).first()
                        if u:
                            users.append(u)
            except Exception:
                pass
    if issue.assigned_department_id:
        dept_users = db.query(User).filter(User.department_id == issue.assigned_department_id, User.role == UserRole.Worker).all()
        for u in dept_users:
            if u.id not in [x.id for x in users]:
                users.append(u)
    return users


def _recompute_priority(
    db: Session,
    issue: Issue,
    audit_user: Optional[User] = None,
) -> None:
    old_priority = issue.priority
    old_score = int(issue.priority_score or 0)
    all_issues = db.query(Issue).all()
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
    try:
        issue.priority_factors_json = json.dumps(res["factors"])
    except Exception:
        issue.priority_factors_json = None
    if audit_user is not None and (old_priority != issue.priority or old_score != issue.priority_score):
        _write_audit(
            db,
            audit_user,
            action="Priority Recompute",
            target_type="Issue",
            target_id=issue.id,
            old={"priority": old_priority, "priority_score": old_score},
            new={"priority": issue.priority, "priority_score": issue.priority_score},
        )


def format_issue_to_schema(issue: Issue, request: Optional[Request] = None, db: Optional[Session] = None) -> IssueOut:
    base_url = str(request.base_url).rstrip('/') if request else "http://localhost:8000"

    formatted_images = []
    for img in issue.images:
        url = img.url if img.url.startswith("http") else f"{base_url}{img.url}"
        formatted_images.append(
            IssueImageOut(
                id=img.id,
                url=url,
                caption=img.caption,
                uploadedAt=img.uploaded_at.isoformat() + "Z",
                uploadedByRole=img.uploaded_by_role
            )
        )

    formatted_history = []
    for evt in issue.status_history:
        formatted_history.append(
            IssueStatusEventOut(
                id=evt.id,
                issueId=evt.issue_id,
                status=evt.status,
                updatedBy=evt.updated_by,
                userRole=evt.user_role,
                timestamp=evt.timestamp.isoformat() + "Z",
                comment=evt.comment
            )
        )

    report = CitizenReportOut(
        id=f"rep-{issue.id}",
        citizenId=issue.reporter_id,
        citizenName=issue.reporter.name if issue.reporter else "Anonymous Citizen",
        title=issue.title,
        description=issue.description,
        category=issue.category_id or "Other",
        latitude=issue.latitude,
        longitude=issue.longitude,
        address=issue.address,
        ward=issue.ward,
        images=formatted_images,
        reportedAt=issue.created_at.isoformat() + "Z"
    )

    ai_analysis = None
    if issue.ai_reasoning:
        ai_analysis = AIAnalysisOut(
            id=f"ai-{issue.id}",
            detectedCategory=issue.category_id or "Roads & Potholes",
            suggestedSeverity=issue.severity,
            confidenceScore=issue.ai_confidence or 0.92,
            aiReasoning=issue.ai_reasoning,
            duplicateDetected=bool(issue.is_duplicate),
            potentialDuplicateIds=_parse_duplicate_ids(issue),
            processedAt=issue.created_at.isoformat() + "Z",
            isDemo=False
        )

    linked_child_ids: List[str] = []
    report_count = max(1, issue.supporting_count or 1)
    if db is not None:
        children = db.query(Issue).filter(Issue.parent_issue_id == issue.id).all()
        linked_child_ids = [c.id for c in children]
        total = 1
        for c in children:
            total += max(1, c.supporting_count or 1)
        if total > report_count:
            report_count = total

    return IssueOut(
        id=issue.id,
        trackingNumber=issue.tracking_number,
        status=issue.status,
        severity=issue.severity,
        priority=issue.priority,
        isDuplicate=bool(issue.is_duplicate),
        parentIssueId=issue.parent_issue_id,
        assignedDepartmentId=issue.assigned_department_id,
        assignedTeamId=issue.assigned_team_id,
        createdAt=issue.created_at.isoformat() + "Z",
        updatedAt=issue.updated_at.isoformat() + "Z",
        report=report,
        statusHistory=formatted_history,
        aiAnalysis=ai_analysis,
        supportingCount=issue.supporting_count or 1,
        linkedChildIds=linked_child_ids,
        reportCount=report_count
    )


@router.post("/", response_model=IssueOut, status_code=status.HTTP_201_CREATED)
async def create_issue(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    address: str = Form(...),
    ward: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    uploads_dir = _uploads_dir()
    os.makedirs(uploads_dir, exist_ok=True)

    saved_images: List[str] = []

    for file in images:
        if not file.filename:
            continue

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image type '{file.content_type}'."
            )

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension '{ext}'."
            )

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' exceeds 5MB."
            )

        safe_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(uploads_dir, safe_filename)
        with open(file_path, "wb") as f:
            f.write(contents)

        saved_images.append(f"/uploads/{safe_filename}")

    issue_id = f"iss-{uuid.uuid4().hex[:8]}"
    tracking_num = f"CT-2026-{random.randint(10000, 99999)}"

    image_bytes = None
    mime_type = None
    if saved_images:
        first_file_path = os.path.join(uploads_dir, os.path.basename(saved_images[0]))
        if os.path.exists(first_file_path):
            with open(first_file_path, "rb") as img_f:
                image_bytes = img_f.read()
            ext = os.path.splitext(first_file_path)[1].lower()
            mime_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else f"image/{ext.replace('.', '')}"

    ai_eval = classifier_service.classify(
        text=f"{title} {description}",
        image_bytes=image_bytes,
        mime_type=mime_type
    )

    now = datetime.utcnow()

    dept_id = _lookup_department_id(db, category or ai_eval["category"]) or ai_eval.get("suggested_department") or "General Administration"

    new_issue = Issue(
        id=issue_id,
        tracking_number=tracking_num,
        title=title,
        description=description,
        category_id=category or ai_eval["category"],
        status="Reported",
        severity=ai_eval["severity"],
        priority="Medium",
        ward=ward,
        address=address,
        latitude=latitude,
        longitude=longitude,
        reporter_id=current_user.id,
        supporting_count=1,
        assigned_department_id=dept_id,
        ai_confidence=ai_eval["confidence"],
        ai_reasoning=ai_eval["reasoning"],
        created_at=now,
        updated_at=now
    )
    db.add(new_issue)
    db.flush()

    for idx, img_url in enumerate(saved_images):
        img_rec = IssueImage(
            id=f"img-{uuid.uuid4().hex[:8]}",
            issue_id=new_issue.id,
            url=img_url,
            uploaded_by_role=current_user.role.value,
            caption="Citizen report photo" if idx == 0 else None
        )
        db.add(img_rec)

    db.flush()

    all_issues = db.query(Issue).filter(Issue.id != new_issue.id).all()
    new_first_image = saved_images[0] if saved_images else None
    candidates = duplicate_detector.find_duplicates(
        new_lat=latitude,
        new_lng=longitude,
        new_title=title,
        new_description=description,
        new_category=category or ai_eval["category"],
        new_created_at=now,
        new_image_url=new_first_image,
        existing_issues=all_issues,
        max_distance_meters=100.0,
        uploads_root=uploads_dir,
    )
    candidate_ids = [c["candidate_issue_id"] for c in candidates]
    if candidate_ids:
        try:
            new_issue.duplicate_candidates = json.dumps(candidate_ids)
        except Exception:
            new_issue.duplicate_candidates = ",".join(candidate_ids)

    _recompute_priority(db, new_issue, audit_user=current_user)

    _write_status_event(
        db, new_issue, "Reported",
        current_user.name, current_user.role.value,
        f"Reported issue & routed to {dept_id}",
        force=True,
        audit_user=current_user
    )

    _write_audit(
        db, current_user,
        action="Issue Created",
        target_type="Issue",
        target_id=new_issue.id,
        new={
            "title": title,
            "category": category or ai_eval.get("category"),
            "ward": ward,
            "severity": ai_eval.get("severity"),
            "assigned_department": dept_id,
        },
    )

    notify_user_sync(
        db,
        user_id=current_user.id,
        user_role=current_user.role.value,
        type="StatusUpdate",
        title="Report Submitted Successfully",
        message=f"Your issue '{title}' ({tracking_num}) has been logged for municipal review.",
        issue_id=new_issue.id,
    )
    for auth_user in _find_users_by_role(db, [UserRole.Authority, UserRole.Admin]):
        notify_user_sync(
            db,
            user_id=auth_user.id,
            user_role=auth_user.role.value,
            type="Info",
            title="New Issue Reported",
            message=f"Issue '{title}' ({tracking_num}) reported by {current_user.name} in {ward}.",
            issue_id=new_issue.id,
        )

    db.commit()
    db.refresh(new_issue)
    return format_issue_to_schema(new_issue, request, db)


@router.get("/", response_model=List[IssueOut])
def get_issues(
    request: Request,
    ward: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Issue)
    if ward:
        query = query.filter(Issue.ward == ward)
    if status:
        query = query.filter(Issue.status == status)

    issues = query.order_by(Issue.created_at.desc()).all()
    return [format_issue_to_schema(i, request, db) for i in issues]


@router.get("/duplicates/check")
def check_duplicates(
    lat: float,
    lng: float,
    title: str = "",
    description: str = "",
    category: str = "Other",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Issue).all()
    results = duplicate_detector.find_duplicates(
        new_lat=lat,
        new_lng=lng,
        new_title=title,
        new_description=description,
        new_category=category,
        new_created_at=datetime.utcnow(),
        new_image_url=None,
        existing_issues=existing,
        max_distance_meters=100.0
    )
    return results


@router.get("/{issue_id}/duplicates")
def get_issue_duplicates(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    others = db.query(Issue).filter(Issue.id != issue.id).all()
    first_img_url = None
    if issue.images and len(issue.images) > 0:
        first_img_url = issue.images[0].url
    return duplicate_detector.find_duplicates(
        new_lat=issue.latitude,
        new_lng=issue.longitude,
        new_title=issue.title,
        new_description=issue.description,
        new_category=issue.category_id or "",
        new_created_at=issue.created_at,
        new_image_url=first_img_url,
        existing_issues=others,
        max_distance_meters=100.0,
        uploads_root=_uploads_dir()
    )


@router.get("/{issue_id}", response_model=IssueOut)
def get_issue(
    issue_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return format_issue_to_schema(issue, request, db)


@router.get("/{issue_id}/priority-factors", response_model=PriorityFactorsOut)
def get_priority_factors(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    all_issues = db.query(Issue).all()
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
    return PriorityFactorsOut(
        priority=res["priority"],
        totalScore=res["total_score"],
        explanation=res["explanation"],
        factors=[
            FactorDetail(factor=f["factor"], value=str(f["value"]), points=int(f["points"]))
            for f in res["factors"]
        ]
    )


@router.post("/{issue_id}/merge", response_model=IssueOut)
def merge_issue(
    issue_id: str,
    body: MergeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    child = db.query(Issue).filter(Issue.id == issue_id).first()
    master = db.query(Issue).filter(Issue.id == body.masterIssueId).first()

    if not child or not master:
        raise HTTPException(status_code=404, detail="Child or Master issue not found")

    if child.id == master.id:
        raise HTTPException(status_code=400, detail="Cannot merge issue into itself")

    if child.parent_issue_id == master.id and child.is_duplicate:
        db.commit()
        db.refresh(master)
        return format_issue_to_schema(master, request, db)

    if child.parent_issue_id and child.parent_issue_id != master.id:
        old_master = db.query(Issue).filter(Issue.id == child.parent_issue_id).first()
        if old_master:
            old_master.supporting_count = max(1, (old_master.supporting_count or 1) - (child.supporting_count or 1))

    child.parent_issue_id = master.id
    child.is_duplicate = True

    ok, reason = validate_transition(child.status, "Duplicate")
    if ok:
        child.status = "Duplicate"
    else:
        child.is_duplicate = True

    old_child = {
        "parent_issue_id": child.parent_issue_id,
        "is_duplicate": bool(child.is_duplicate),
        "status": child.status,
    }
    old_master = {"supporting_count": int(master.supporting_count or 1)}

    added = max(1, child.supporting_count or 1)
    master.supporting_count = max(1, (master.supporting_count or 1) + added)

    _recompute_priority(db, master, audit_user=current_user)

    _write_status_event(
        db, child, child.status,
        current_user.name, current_user.role.value,
        f"Merged into master issue #{master.tracking_number}",
        force=True,
        audit_user=current_user
    )
    _write_status_event(
        db, master, master.status,
        current_user.name, current_user.role.value,
        f"Linked duplicate issue #{child.tracking_number} (Supporting count: {master.supporting_count})",
        force=True,
        audit_user=current_user
    )

    _write_audit(
        db, current_user,
        action="Issue Merge",
        target_type="Issue",
        target_id=master.id,
        old={
            "master_supporting_count": old_master["supporting_count"],
            "child": {"id": child.id, **old_child},
        },
        new={
            "master_supporting_count": int(master.supporting_count or 1),
            "child": {
                "id": child.id,
                "parent_issue_id": child.parent_issue_id,
                "is_duplicate": bool(child.is_duplicate),
                "status": child.status,
            },
        },
        extra={"child_id": child.id, "master_id": master.id},
    )

    if child.reporter_id and child.reporter_id != current_user.id:
        notify_user_sync(
            db,
            user_id=child.reporter_id,
            user_role="Citizen",
            type="StatusUpdate",
            title="Issue Merged with Master Report",
            message=f"Your issue #{child.tracking_number} has been merged with master report #{master.tracking_number}. Updates will be shared from the master report.",
            issue_id=child.id,
        )
    for auth_user in _find_users_by_role(db, [UserRole.Authority, UserRole.Admin]):
        notify_user_sync(
            db,
            user_id=auth_user.id,
            user_role=auth_user.role.value,
            type="Info",
            title="Issues Merged",
            message=f"Issue #{child.tracking_number} was merged into master #{master.tracking_number} by {current_user.name}.",
            issue_id=master.id,
        )

    db.commit()
    db.refresh(master)
    return format_issue_to_schema(master, request, db)


@router.post("/{issue_id}/split", response_model=IssueOut)
def split_issue(
    issue_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if not issue.parent_issue_id:
        raise HTTPException(status_code=400, detail="Issue is not currently merged under any master issue")

    parent = db.query(Issue).filter(Issue.id == issue.parent_issue_id).first()
    if parent:
        old_parent_count = int(parent.supporting_count or 1)
        parent.supporting_count = max(1, (parent.supporting_count or 1) - max(1, (issue.supporting_count or 1)))
        _recompute_priority(db, parent, audit_user=current_user)

    old_state = {
        "parent_issue_id": issue.parent_issue_id,
        "is_duplicate": bool(issue.is_duplicate),
        "status": issue.status,
    }

    issue.parent_issue_id = None
    issue.is_duplicate = False

    issue.status = "Reported"

    _write_status_event(
        db, issue, issue.status,
        current_user.name, current_user.role.value,
        comment="Unlinked/Split from master issue into standalone report",
        force=True,
        audit_user=current_user
    )

    _write_audit(
        db, current_user,
        action="Issue Split",
        target_type="Issue",
        target_id=issue.id,
        old=old_state,
        new={
            "parent_issue_id": issue.parent_issue_id,
            "is_duplicate": bool(issue.is_duplicate),
            "status": issue.status,
        },
        extra={"old_parent_id": old_state["parent_issue_id"]},
    )

    if issue.reporter_id and issue.reporter_id != current_user.id:
        notify_user_sync(
            db,
            user_id=issue.reporter_id,
            user_role="Citizen",
            type="StatusUpdate",
            title="Issue Reactivated as Standalone Report",
            message=f"Your issue #{issue.tracking_number} has been split from the master report and is now being tracked independently.",
            issue_id=issue.id,
        )
    for auth_user in _find_users_by_role(db, [UserRole.Authority, UserRole.Admin]):
        notify_user_sync(
            db,
            user_id=auth_user.id,
            user_role=auth_user.role.value,
            type="Info",
            title="Issue Split from Master",
            message=f"Issue #{issue.tracking_number} was split from master #{old_state['parent_issue_id']} by {current_user.name}.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.patch("/{issue_id}/department", response_model=IssueOut)
def override_department(
    issue_id: str,
    body: DepartmentOverrideRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_dept = issue.assigned_department_id
    issue.assigned_department_id = body.departmentId
    _write_status_event(
        db, issue, issue.status,
        current_user.name, current_user.role.value,
        f"Admin override department assignment to {body.departmentId}",
        force=True,
        audit_user=current_user
    )

    _write_audit(
        db, current_user,
        action="Department Override",
        target_type="Issue",
        target_id=issue.id,
        old={"assigned_department_id": old_dept},
        new={"assigned_department_id": body.departmentId},
    )

    if issue.reporter_id:
        notify_user_sync(
            db,
            user_id=issue.reporter_id,
            user_role="Citizen",
            type="StatusUpdate",
            title="Issue Rerouted to Different Department",
            message=f"Your issue '{issue.title}' ({issue.tracking_number}) has been reassigned to the {body.departmentId} department for handling.",
            issue_id=issue.id,
        )
    for worker in _find_assigned_workers(db, issue):
        notify_user_sync(
            db,
            user_id=worker.id,
            user_role=worker.role.value,
            type="Assignment",
            title="Issue Department Updated",
            message=f"Issue #{issue.tracking_number} department changed to {body.departmentId} by administrator.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/assign", response_model=IssueOut)
def assign_team(
    issue_id: str,
    body: AssignRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    old = {
        "assigned_department_id": issue.assigned_department_id,
        "assigned_team_id": issue.assigned_team_id,
        "status": issue.status,
    }

    if body.departmentId:
        issue.assigned_department_id = body.departmentId
    if body.teamId:
        issue.assigned_team_id = body.teamId

    issue.status = "Assigned"

    _write_status_event(
        db, issue, issue.status,
        current_user.name, current_user.role.value,
        f"Assigned team '{body.teamId or 'Primary Unit'}' to department '{body.departmentId or issue.assigned_department_id}'",
        force=True,
        audit_user=current_user
    )

    _write_audit(
        db, current_user,
        action="Assignment",
        target_type="Issue",
        target_id=issue.id,
        old=old,
        new={
            "assigned_department_id": issue.assigned_department_id,
            "assigned_team_id": issue.assigned_team_id,
            "status": issue.status,
        },
    )

    if issue.reporter_id:
        notify_user_sync(
            db,
            user_id=issue.reporter_id,
            user_role="Citizen",
            type="StatusUpdate",
            title="Issue Assigned to Work Team",
            message=f"Your issue '{issue.title}' ({issue.tracking_number}) has been assigned to team '{body.teamId or 'Primary Unit'}' for resolution.",
            issue_id=issue.id,
        )
    for worker in _find_assigned_workers(db, issue):
        notify_user_sync(
            db,
            user_id=worker.id,
            user_role=worker.role.value,
            type="Assignment",
            title="New Work Assignment",
            message=f"You have been assigned issue #{issue.tracking_number}: {issue.title}.",
            issue_id=issue.id,
        )
    for auth_user in _find_users_by_role(db, [UserRole.Authority]):
        notify_user_sync(
            db,
            user_id=auth_user.id,
            user_role=auth_user.role.value,
            type="Info",
            title="Issue Assigned to Team",
            message=f"Issue #{issue.tracking_number} assigned to team '{body.teamId or 'Primary Unit'}' by {current_user.name}.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/start-work", response_model=IssueOut)
def start_work(
    issue_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _write_status_event(
        db, issue, "In Progress",
        current_user.name, current_user.role.value,
        "Field crew commenced repair work on site",
        force=True,
        audit_user=current_user
    )

    if issue.reporter_id and issue.reporter_id != current_user.id:
        notify_user_sync(
            db,
            user_id=issue.reporter_id,
            user_role="Citizen",
            type="StatusUpdate",
            title="Work Commenced on Your Issue",
            message=f"A field crew has started work on '{issue.title}' ({issue.tracking_number}). We will keep you updated on progress.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/work-note", response_model=IssueOut)
def add_work_note(
    issue_id: str,
    body: WorkNoteRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _write_status_event(
        db, issue, issue.status,
        current_user.name, current_user.role.value,
        f"Field Note: {body.note}",
        force=True,
        audit_user=current_user
    )

    if issue.reporter_id and issue.reporter_id != current_user.id:
        notify_user_sync(
            db,
            user_id=issue.reporter_id,
            user_role="Citizen",
            type="Info",
            title="Work Note Added to Your Issue",
            message=f"New field note on '{issue.title}' ({issue.tracking_number}): {body.note[:80]}{'...' if len(body.note) > 80 else ''}",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/work-photos", response_model=IssueOut)
async def upload_work_photos(
    issue_id: str,
    request: Request,
    caption: str = Form("Field photo"),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    uploads_dir = _uploads_dir()
    os.makedirs(uploads_dir, exist_ok=True)

    ext = os.path.splitext(photo.filename or "")[1].lower() or ".jpg"
    safe_filename = f"work-{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(uploads_dir, safe_filename)

    contents = await photo.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    img_rec = IssueImage(
        id=f"img-{uuid.uuid4().hex[:8]}",
        issue_id=issue.id,
        url=f"/uploads/{safe_filename}",
        caption=caption,
        uploaded_by_role=current_user.role.value
    )
    db.add(img_rec)

    _write_status_event(
        db, issue, issue.status,
        current_user.name, current_user.role.value,
        f"Uploaded inspection photo: {caption}",
        force=True,
        audit_user=current_user
    )

    if issue.reporter_id and issue.reporter_id != current_user.id:
        notify_user_sync(
            db,
            user_id=issue.reporter_id,
            user_role="Citizen",
            type="Info",
            title="Inspection Photo Added",
            message=f"A work photo has been uploaded to '{issue.title}' ({issue.tracking_number}). Caption: {caption}.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/complete-work", response_model=IssueOut)
def complete_work(
    issue_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    target = "Resolution Submitted"
    ok, reason = validate_transition(issue.status, target)
    if not ok:
        alt_ok, alt_reason = validate_transition(issue.status, "Awaiting Verification")
        if alt_ok:
            target = "Awaiting Verification"
        else:
            raise HTTPException(status_code=400, detail=reason)

    _write_status_event(
        db, issue, target,
        current_user.name, current_user.role.value,
        "Field crew completed repair work. Pending citizen/authority verification.",
        audit_user=current_user
    )

    if issue.reporter_id:
        notify_user_sync(
            db,
            user_id=issue.reporter_id,
            user_role="Citizen",
            type="VerificationRequest",
            title="Issue Resolved - Verification Requested",
            message=f"Work on '{issue.title}' ({issue.tracking_number}) has been marked complete. Please verify the resolution.",
            issue_id=issue.id,
        )
    for worker in _find_assigned_workers(db, issue):
        if worker.id != current_user.id:
            notify_user_sync(
                db,
                user_id=worker.id,
                user_role=worker.role.value,
                type="StatusUpdate",
                title="Work Completed - Awaiting Verification",
                message=f"Work on issue #{issue.tracking_number} has been submitted for verification.",
                issue_id=issue.id,
            )
    for auth_user in _find_users_by_role(db, [UserRole.Authority]):
        notify_user_sync(
            db,
            user_id=auth_user.id,
            user_role=auth_user.role.value,
            type="VerificationRequest",
            title="Resolution Submitted for Review",
            message=f"Issue #{issue.tracking_number} marked complete by {current_user.name}. Citizen and authority verification pending.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/verify", response_model=IssueOut)
def verify_issue(
    issue_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _write_status_event(
        db, issue, "Verified",
        current_user.name, current_user.role.value,
        "Resolution verified & confirmed by citizen.",
        force=True,
        audit_user=current_user
    )

    for worker in _find_assigned_workers(db, issue):
        notify_user_sync(
            db,
            user_id=worker.id,
            user_role=worker.role.value,
            type="StatusUpdate",
            title="Resolution Verified - Issue Closed",
            message=f"Your work on issue #{issue.tracking_number} '{issue.title}' has been verified and marked as resolved.",
            issue_id=issue.id,
        )
    for auth_user in _find_users_by_role(db, [UserRole.Authority, UserRole.Admin]):
        notify_user_sync(
            db,
            user_id=auth_user.id,
            user_role=auth_user.role.value,
            type="Info",
            title="Issue Verified Closed",
            message=f"Issue #{issue.tracking_number} verified by citizen/authority. Status: Verified/Closed.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/reopen", response_model=IssueOut)
def reopen_issue(
    issue_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    _write_status_event(
        db, issue, "Reopened",
        current_user.name, current_user.role.value,
        "Citizen reopened issue: Work incomplete or issue recurring.",
        force=True,
        audit_user=current_user
    )

    for worker in _find_assigned_workers(db, issue):
        notify_user_sync(
            db,
            user_id=worker.id,
            user_role=worker.role.value,
            type="Alert",
            title="ISSUE RE-OPENED by Citizen",
            message=f"Issue #{issue.tracking_number} '{issue.title}' has been REOPENED. Prior work marked incomplete or issue returned. Please investigate.",
            issue_id=issue.id,
        )
    for auth_user in _find_users_by_role(db, [UserRole.Authority, UserRole.Admin]):
        notify_user_sync(
            db,
            user_id=auth_user.id,
            user_role=auth_user.role.value,
            type="Alert",
            title="Issue Reopened",
            message=f"Issue #{issue.tracking_number} '{issue.title}' was reopened. Assigned workers have been re-alerted.",
            issue_id=issue.id,
        )

    db.commit()
    db.refresh(issue)
    return format_issue_to_schema(issue, request, db)


@router.post("/{issue_id}/affected", response_model=IssueOut)
def support_issue(
    issue_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    existing = db.query(SupportingReport).filter(
        SupportingReport.issue_id == issue.id,
        SupportingReport.user_id == current_user.id
    ).first()

    if not existing:
        old_count = int(issue.supporting_count or 1)
        support_rec = SupportingReport(
            id=f"sup-{uuid.uuid4().hex[:8]}",
            issue_id=issue.id,
            user_id=current_user.id
        )
        db.add(support_rec)
        issue.supporting_count = old_count + 1
        _recompute_priority(db, issue, audit_user=current_user)
        _write_audit(
            db, current_user,
            action="Supporting Report Added",
            target_type="Issue",
            target_id=issue.id,
            old={"supporting_count": old_count},
            new={"supporting_count": int(issue.supporting_count)},
        )
        if issue.reporter_id and issue.reporter_id != current_user.id:
            notify_user_sync(
                db,
                user_id=issue.reporter_id,
                user_role="Citizen",
                type="Info",
                title="Another Citizen Supports Your Report",
                message=f"Your issue '{issue.title}' ({issue.tracking_number}) received another supporting report from a citizen. Total affected: {issue.supporting_count}.",
                issue_id=issue.id,
            )
        for auth_user in _find_users_by_role(db, [UserRole.Authority]):
            notify_user_sync(
                db,
                user_id=auth_user.id,
                user_role=auth_user.role.value,
                type="Info",
                title="Support Added to Issue",
                message=f"Citizen added support for issue #{issue.tracking_number} (now {issue.supporting_count} affected). Priority may have been updated.",
                issue_id=issue.id,
            )
        db.commit()
        db.refresh(issue)

    return format_issue_to_schema(issue, request, db)


@router.get("/{issue_id}/sla", response_model=IssueSLAStateOut)
def get_issue_sla(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    try:
        from app.core.sla_engine import compute_sla_state, check_and_create_escalations
        check_and_create_escalations(db, issue)
        db.commit()
    except Exception:
        db.rollback()
    from app.core.sla_engine import compute_sla_state
    return compute_sla_state(db, issue)
