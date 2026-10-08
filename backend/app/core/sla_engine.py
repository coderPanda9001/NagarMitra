import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.user import User, UserRole
from app.models.issue import Issue, IssueStatusEvent
from app.models.sla import SLARule, EscalationRecord
from app.models.audit_log import AuditLog
from app.core.notifications_manager import notify_user_sync
from app.schemas.sla import IssueSLAStateOut, EscalationOut


ASSIGNMENT_STATUSES = {"Assigned", "Work Scheduled", "In Progress"}


def _get_assigned_at(db: Session, issue: Issue) -> datetime:
    first_assignment = (
        db.query(IssueStatusEvent)
        .filter(
            IssueStatusEvent.issue_id == issue.id,
            IssueStatusEvent.status.in_(ASSIGNMENT_STATUSES),
        )
        .order_by(IssueStatusEvent.timestamp.asc())
        .first()
    )
    if first_assignment:
        return first_assignment.timestamp
    return issue.created_at


def get_sla_rule(db: Session, category_id: str) -> SLARule:
    rule = db.query(SLARule).filter(SLARule.category_id == category_id).first()
    if rule:
        return rule

    category = db.query(Category).filter(Category.id == category_id).first()
    target_hours = category.default_sla_hours if category else 24
    esc1 = int(target_hours * 0.5)
    esc2 = int(target_hours * 0.9)

    new_rule = SLARule(
        id=f"sla-{uuid.uuid4().hex[:8]}",
        category_id=category_id,
        target_hours=target_hours,
        at_risk_pct=0.6,
        overdue_pct=1.0,
        breached_pct=1.2,
        escalation1_hours=esc1,
        escalation2_hours=esc2,
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule


def _is_unassigned(issue: Issue) -> bool:
    return issue.assigned_department_id is None and issue.assigned_team_id is None


def compute_sla_state(db: Session, issue: Issue) -> IssueSLAStateOut:
    escalations_q = db.query(EscalationRecord).filter(EscalationRecord.issue_id == issue.id).all()
    escalations = [EscalationOut.model_validate(e) for e in escalations_q]

    if _is_unassigned(issue):
        return IssueSLAStateOut(
            state="Normal",
            remaining_minutes=0.0,
            thresholds={},
            escalations=escalations,
            target_hours=0,
            hours_elapsed=0.0,
        )

    rule = get_sla_rule(db, issue.category_id) if issue.category_id else None
    if rule is None:
        return IssueSLAStateOut(
            state="Normal",
            remaining_minutes=0.0,
            thresholds={},
            escalations=escalations,
            target_hours=24,
            hours_elapsed=0.0,
        )

    assigned_at = _get_assigned_at(db, issue)
    now = datetime.utcnow()
    elapsed_td = now - assigned_at
    hours_elapsed = elapsed_td.total_seconds() / 3600.0
    target_hours = rule.target_hours

    at_risk_hours = target_hours * rule.at_risk_pct
    overdue_hours = target_hours * rule.overdue_pct
    breached_hours = target_hours * rule.breached_pct

    if hours_elapsed >= breached_hours:
        state = "Breached"
    elif hours_elapsed >= overdue_hours:
        state = "Overdue"
    elif hours_elapsed >= at_risk_hours:
        state = "At Risk"
    else:
        state = "Normal"

    remaining_hours = max(0.0, target_hours - hours_elapsed)
    remaining_minutes = remaining_hours * 60.0

    thresholds = {
        "at_risk_hours": at_risk_hours,
        "overdue_hours": overdue_hours,
        "breached_hours": breached_hours,
        "escalation1_hours": rule.escalation1_hours,
        "escalation2_hours": rule.escalation2_hours,
    }

    return IssueSLAStateOut(
        state=state,
        remaining_minutes=remaining_minutes,
        thresholds=thresholds,
        escalations=escalations,
        target_hours=target_hours,
        hours_elapsed=hours_elapsed,
    )


def _write_audit(
    db: Session,
    actor_id: str,
    actor_name: str,
    actor_role: str,
    action: str,
    target_type: str,
    target_id: str,
    details: str,
):
    log = AuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        actor_id=actor_id,
        actor_name=actor_name,
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        timestamp=datetime.utcnow(),
    )
    db.add(log)


def check_and_create_escalations(db: Session, issue: Issue) -> int:
    if _is_unassigned(issue):
        return 0

    rule = get_sla_rule(db, issue.category_id) if issue.category_id else None
    if rule is None:
        return 0

    assigned_at = _get_assigned_at(db, issue)
    now = datetime.utcnow()
    elapsed_td = now - assigned_at
    hours_elapsed = elapsed_td.total_seconds() / 3600.0

    created_count = 0

    existing_t1 = (
        db.query(EscalationRecord)
        .filter(EscalationRecord.issue_id == issue.id, EscalationRecord.tier == 1)
        .first()
    )
    if not existing_t1 and hours_elapsed > rule.escalation1_hours:
        t1 = EscalationRecord(
            id=f"esc-{uuid.uuid4().hex[:8]}",
            issue_id=issue.id,
            tier=1,
            escalated_at=now,
            escalated_to_role="Authority",
            acknowledged=False,
        )
        db.add(t1)
        _write_audit(
            db,
            actor_id="system-sla",
            actor_name="SLA Engine",
            actor_role="System",
            action="SLA_ESCALATION_T1",
            target_type="Issue",
            target_id=issue.id,
            details=f"Tier 1 escalation triggered after {hours_elapsed:.2f}h (threshold {rule.escalation1_hours}h)",
        )
        try:
            authorities = db.query(User).filter(User.role == UserRole.Authority).all()
            for u in authorities:
                notify_user_sync(
                    db,
                    user_id=u.id,
                    user_role=u.role.value,
                    type="Alert",
                    title="SLA TIER-1 ESCALATION",
                    message=f"Issue #{issue.tracking_number or issue.id} breached Tier-1 ({rule.escalation1_hours}h threshold). Elapsed: {hours_elapsed:.1f}h. Please review assignment and priority.",
                    issue_id=issue.id,
                )
        except Exception:
            pass
        created_count += 1

    existing_t2 = (
        db.query(EscalationRecord)
        .filter(EscalationRecord.issue_id == issue.id, EscalationRecord.tier == 2)
        .first()
    )
    if not existing_t2 and hours_elapsed > rule.escalation2_hours:
        t2 = EscalationRecord(
            id=f"esc-{uuid.uuid4().hex[:8]}",
            issue_id=issue.id,
            tier=2,
            escalated_at=now,
            escalated_to_role="Admin",
            acknowledged=False,
        )
        db.add(t2)
        _write_audit(
            db,
            actor_id="system-sla",
            actor_name="SLA Engine",
            actor_role="System",
            action="SLA_ESCALATION_T2",
            target_type="Issue",
            target_id=issue.id,
            details=f"Tier 2 escalation triggered after {hours_elapsed:.2f}h (threshold {rule.escalation2_hours}h)",
        )
        try:
            admins = db.query(User).filter(User.role == UserRole.Admin).all()
            for u in admins:
                notify_user_sync(
                    db,
                    user_id=u.id,
                    user_role=u.role.value,
                    type="Alert",
                    title="SLA TIER-2 ESCALATION (CRITICAL)",
                    message=f"CRITICAL: Issue #{issue.tracking_number or issue.id} breached Tier-2 ({rule.escalation2_hours}h threshold). Elapsed: {hours_elapsed:.1f}h. Immediate action required.",
                    issue_id=issue.id,
                )
        except Exception:
            pass
        created_count += 1

    if created_count > 0:
        db.commit()

    return created_count
