from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.issue import NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationOut])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return [
        NotificationOut(
            id=n.id,
            userId=n.user_id,
            userRole=n.user_role,
            title=n.title,
            message=n.message,
            type=n.type,
            issueId=n.issue_id,
            read=n.read,
            createdAt=n.created_at.isoformat() + "Z"
        )
        for n in notifs
    ]

@router.patch("/{notif_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.read = True
    db.commit()
    db.refresh(notif)
    return NotificationOut(
        id=notif.id,
        userId=notif.user_id,
        userRole=notif.user_role,
        title=notif.title,
        message=notif.message,
        type=notif.type,
        issueId=notif.issue_id,
        read=notif.read,
        createdAt=notif.created_at.isoformat() + "Z"
    )


@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.read == False)
        .update({"read": True}, synchronize_session=False)
    )
    db.commit()
    return {"marked_read": int(updated or 0)}
