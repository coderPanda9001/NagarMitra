from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class SLARule(Base):
    __tablename__ = "sla_rules"

    id = Column(String, primary_key=True, index=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False, unique=True)
    target_hours = Column(Integer, nullable=False)
    at_risk_pct = Column(Float, default=0.6, nullable=False)
    overdue_pct = Column(Float, default=1.0, nullable=False)
    breached_pct = Column(Float, default=1.2, nullable=False)
    escalation1_hours = Column(Integer, nullable=False)
    escalation2_hours = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category")


class EscalationRecord(Base):
    __tablename__ = "escalation_records"

    id = Column(String, primary_key=True, index=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    tier = Column(Integer, nullable=False)
    escalated_at = Column(DateTime, default=datetime.utcnow)
    escalated_to_role = Column(String, nullable=False)
    acknowledged = Column(Boolean, default=False, nullable=False)

    issue = relationship("Issue")
