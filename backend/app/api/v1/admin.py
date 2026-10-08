import json
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.sla import SLARule, EscalationRecord
from app.models.category import Category
from app.models.audit_log import AuditLog
from app.schemas.sla import SLARuleOut, SLARuleUpdate

router = APIRouter(tags=["Admin"])


def _serialize(d: Dict[str, Any]) -> str:
    try:
        return json.dumps(d, default=str)
    except Exception:
        return str(d)


@router.get("/admin/sla-rules", response_model=List[SLARuleOut])
def list_sla_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.Admin, UserRole.Authority])),
):
    all_cats = db.query(Category).all()
    rules = []
    for cat in all_cats:
        rule = db.query(SLARule).filter(SLARule.category_id == cat.id).first()
        if rule:
            rules.append(rule)
            continue
        target = cat.default_sla_hours or 24
        esc1 = int(target * 0.5)
        esc2 = int(target * 0.9)
        new_rule = SLARule(
            id=f"sla-{uuid.uuid4().hex[:8]}",
            category_id=cat.id,
            target_hours=target,
            at_risk_pct=0.6,
            overdue_pct=1.0,
            breached_pct=1.2,
            escalation1_hours=esc1,
            escalation2_hours=esc2,
        )
        db.add(new_rule)
        rules.append(new_rule)
    db.commit()
    for r in rules:
        db.refresh(r)
    return rules


@router.patch("/admin/sla-rules/{category_id}", response_model=SLARuleOut)
def update_sla_rule(
    category_id: str,
    body: SLARuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.Admin])),
):
    rule = db.query(SLARule).filter(SLARule.category_id == category_id).first()
    if not rule:
        cat = db.query(Category).filter(Category.id == category_id).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")
        target = cat.default_sla_hours or 24
        rule = SLARule(
            id=f"sla-{uuid.uuid4().hex[:8]}",
            category_id=category_id,
            target_hours=target,
            at_risk_pct=0.6,
            overdue_pct=1.0,
            breached_pct=1.2,
            escalation1_hours=int(target * 0.5),
            escalation2_hours=int(target * 0.9),
        )
        db.add(rule)
        db.flush()

    old = {
        "target_hours": rule.target_hours,
        "at_risk_pct": rule.at_risk_pct,
        "overdue_pct": rule.overdue_pct,
        "breached_pct": rule.breached_pct,
        "escalation1_hours": rule.escalation1_hours,
        "escalation2_hours": rule.escalation2_hours,
    }

    if body.target_hours is not None:
        rule.target_hours = int(body.target_hours)
    if body.at_risk_pct is not None:
        rule.at_risk_pct = float(body.at_risk_pct)
    if body.overdue_pct is not None:
        rule.overdue_pct = float(body.overdue_pct)
    if body.breached_pct is not None:
        rule.breached_pct = float(body.breached_pct)
    if body.escalation1_hours is not None:
        rule.escalation1_hours = int(body.escalation1_hours)
    if body.escalation2_hours is not None:
        rule.escalation2_hours = int(body.escalation2_hours)

    new = {
        "target_hours": rule.target_hours,
        "at_risk_pct": rule.at_risk_pct,
        "overdue_pct": rule.overdue_pct,
        "breached_pct": rule.breached_pct,
        "escalation1_hours": rule.escalation1_hours,
        "escalation2_hours": rule.escalation2_hours,
    }

    diffs = {}
    for k in old:
        if old[k] != new[k]:
            diffs[k] = {"old": old[k], "new": new[k]}

    audit = AuditLog(
        id=f"audit-{uuid.uuid4().hex[:8]}",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        action="SLA Rule Edit",
        target_type="SLARule",
        target_id=str(rule.id),
        details=_serialize({"category_id": category_id, "changes": diffs, "old": old, "new": new}),
        timestamp=datetime.utcnow(),
    )
    db.add(audit)
    rule.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rule)
    return rule


@router.get("/audit-logs")
def list_audit_logs(
    action: Optional[str] = Query(default=None),
    actor_id: Optional[str] = Query(default=None),
    target_type: Optional[str] = Query(default=None),
    target_id: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.Admin, UserRole.Authority])),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if actor_id:
        query = query.filter(AuditLog.actor_id == actor_id)
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    if target_id:
        query = query.filter(AuditLog.target_id == target_id)
    if from_date:
        try:
            start_dt = datetime.fromisoformat(from_date.replace("Z", "+00:00"))
            query = query.filter(AuditLog.timestamp >= start_dt)
        except Exception:
            pass
    if to_date:
        try:
            end_dt = datetime.fromisoformat(to_date.replace("Z", "+00:00"))
            query = query.filter(AuditLog.timestamp <= end_dt)
        except Exception:
            pass

    total = query.count()
    rows = (
        query.order_by(AuditLog.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    for r in rows:
        parsed_details: Any = None
        try:
            parsed_details = json.loads(r.details)
        except Exception:
            parsed_details = r.details
        items.append({
            "id": r.id,
            "actorId": r.actor_id,
            "actorName": r.actor_name,
            "actorRole": r.actor_role,
            "action": r.action,
            "targetType": r.target_type,
            "targetId": r.target_id,
            "details": parsed_details,
            "timestamp": r.timestamp.isoformat() + "Z" if r.timestamp else None,
        })

    return {
        "items": items,
        "total": int(total),
        "limit": int(limit),
        "offset": int(offset),
    }
