from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class SLARuleOut(BaseModel):
    id: str
    category_id: str
    target_hours: int
    at_risk_pct: float
    overdue_pct: float
    breached_pct: float
    escalation1_hours: int
    escalation2_hours: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SLARuleUpdate(BaseModel):
    target_hours: Optional[int] = None
    at_risk_pct: Optional[float] = None
    overdue_pct: Optional[float] = None
    breached_pct: Optional[float] = None
    escalation1_hours: Optional[int] = None
    escalation2_hours: Optional[int] = None


class EscalationOut(BaseModel):
    id: str
    issue_id: str
    tier: int
    escalated_at: datetime
    escalated_to_role: str
    acknowledged: bool

    class Config:
        from_attributes = True


class IssueSLAStateOut(BaseModel):
    state: str
    remaining_minutes: float
    thresholds: Dict[str, Any]
    escalations: List[EscalationOut]
    target_hours: int
    hours_elapsed: float
