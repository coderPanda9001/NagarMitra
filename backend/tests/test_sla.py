import pytest
from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.core.sla_engine import compute_sla_state
from app.models.issue import Issue

def test_sla_computation_for_issue():
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        issue = session.query(Issue).first()
        if issue:
            state = compute_sla_state(session, issue)
            assert state is not None
            assert state.state in ("Normal", "At Risk", "Overdue", "Breached")
    finally:
        session.close()
