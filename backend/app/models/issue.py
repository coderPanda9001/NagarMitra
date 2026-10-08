from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category_id = Column(String, ForeignKey("categories.id"), nullable=True)
    status = Column(String, default="Reported", nullable=False)
    severity = Column(String, default="Medium", nullable=False)
    priority = Column(String, default="Medium", nullable=False)
    ward = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    supporting_count = Column(Integer, default=1)
    assigned_department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    assigned_team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    parent_issue_id = Column(String, nullable=True)
    is_duplicate = Column(Boolean, default=False)
    duplicate_candidates = Column(String, nullable=True)
    ai_confidence = Column(Float, default=0.0)
    ai_reasoning = Column(String, nullable=True)
    priority_score = Column(Integer, default=0)
    priority_factors_json = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = relationship("IssueImage", back_populates="issue", cascade="all, delete-orphan")
    status_history = relationship("IssueStatusEvent", back_populates="issue", cascade="all, delete-orphan")
    supporting_reports = relationship("SupportingReport", back_populates="issue", cascade="all, delete-orphan")
    reporter = relationship("User", foreign_keys=[reporter_id])

class IssueImage(Base):
    __tablename__ = "issue_images"

    id = Column(String, primary_key=True, index=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    url = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by_role = Column(String, default="Citizen")

    issue = relationship("Issue", back_populates="images")

class IssueStatusEvent(Base):
    __tablename__ = "issue_status_events"

    id = Column(String, primary_key=True, index=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    status = Column(String, nullable=False)
    updated_by = Column(String, nullable=False)
    user_role = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    comment = Column(String, nullable=True)

    issue = relationship("Issue", back_populates="status_history")

class SupportingReport(Base):
    __tablename__ = "supporting_reports"

    id = Column(String, primary_key=True, index=True)
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    issue = relationship("Issue", back_populates="supporting_reports")
