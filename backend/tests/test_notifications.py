import pytest
from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.core.notifications_manager import notify_user_sync, get_unread_count

def test_notifications_creation_and_unread_count(citizen_user):
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        initial = get_unread_count(session, citizen_user.id)
        notify_user_sync(
            session,
            user_id=citizen_user.id,
            user_role="Citizen",
            type="StatusUpdate",
            title="Test Notification Title",
            message="Test Notification Body message content",
            issue_id="iss-test-01"
        )
        new_count = get_unread_count(session, citizen_user.id)
        assert new_count == initial + 1
    finally:
        session.close()
