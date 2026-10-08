from typing import Optional, List
import uuid
import random
from sqlalchemy.orm import Session
from app.models.issue import Issue
from app.schemas.issue import IssueCreate, IssueUpdate

class IssueRepository:
    def get_by_id(self, db: Session, issue_id: str) -> Optional[Issue]:
        return db.query(Issue).filter(Issue.id == issue_id).first()

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Issue]:
        return db.query(Issue).order_by(Issue.created_at.desc()).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: IssueCreate, reporter_id: str) -> Issue:
        tracking_num = f"CT-2026-{random.randint(10000, 99999)}"
        db_issue = Issue(
            id=f"iss-{uuid.uuid4().hex[:8]}",
            tracking_number=tracking_num,
            title=obj_in.title,
            description=obj_in.description,
            category_id=obj_in.category_id,
            ward=obj_in.ward,
            address=obj_in.address,
            latitude=obj_in.latitude,
            longitude=obj_in.longitude,
            reporter_id=reporter_id,
            status="Reported",
            severity="Medium",
            priority="Medium",
        )
        db.add(db_issue)
        db.commit()
        db.refresh(db_issue)
        return db_issue

    def update(self, db: Session, db_issue: Issue, obj_in: IssueUpdate) -> Issue:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_issue, field, value)
        db.commit()
        db.refresh(db_issue)
        return db_issue

issue_repo = IssueRepository()
