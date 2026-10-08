import uuid
import asyncio
import json
import threading
from typing import Dict, Set, Any, Optional, Tuple
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import UserRole


NOTIF_TYPES = {"Info", "StatusUpdate", "Assignment", "VerificationRequest", "Alert"}


class ConnectionManager:
    def __init__(self):
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock: Optional[asyncio.Lock] = None
        self._init_lock = threading.Lock()

    def _get_lock(self) -> asyncio.Lock:
        if self._lock is None:
            with self._init_lock:
                if self._lock is None:
                    self._lock = asyncio.Lock()
        return self._lock

    async def connect(self, user_id: str, ws: WebSocket):
        lock = self._get_lock()
        async with lock:
            await ws.accept()
            bucket = self._connections.setdefault(user_id, set())
            bucket.add(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        bucket = self._connections.get(user_id)
        if bucket is not None:
            if ws in bucket:
                bucket.discard(ws)
            if not bucket:
                self._connections.pop(user_id, None)

    def connection_count(self, user_id: str) -> int:
        bucket = self._connections.get(user_id)
        return len(bucket) if bucket else 0

    def has_connections(self, user_id: str) -> bool:
        return self.connection_count(user_id) > 0

    async def broadcast_to_user(self, user_id: str, payload: Dict[str, Any]):
        bucket = self._connections.get(user_id)
        if not bucket:
            return
        message = json.dumps(payload, default=str)
        stale: Set[WebSocket] = set()
        for ws in list(bucket):
            try:
                await ws.send_text(message)
            except Exception:
                stale.add(ws)
        if stale:
            for ws in stale:
                bucket.discard(ws)
            if not bucket:
                self._connections.pop(user_id, None)


manager = ConnectionManager()


def _notif_id() -> str:
    return f"notif-{uuid.uuid4().hex[:8]}"


def _notification_payload(notif: Notification) -> Dict[str, Any]:
    return {
        "type": "new_notification",
        "notification": {
            "id": notif.id,
            "userId": notif.user_id,
            "userRole": notif.user_role,
            "title": notif.title,
            "message": notif.message,
            "type": notif.type,
            "issueId": notif.issue_id,
            "read": notif.read,
            "createdAt": notif.created_at.isoformat() + "Z" if notif.created_at else None,
        },
    }


def _schedule_broadcast(user_id: str, payload: Dict[str, Any]):
    if not manager.has_connections(user_id):
        return
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast_to_user(user_id, payload))
            return
    except RuntimeError:
        pass
    try:
        loop = asyncio.new_event_loop()
        loop.run_until_complete(manager.broadcast_to_user(user_id, payload))
        loop.close()
    except Exception:
        pass


def notify_user_sync(
    db: Session,
    user_id: str,
    user_role: str,
    type: str,
    title: str,
    message: str,
    issue_id: Optional[str] = None,
    broadcast: bool = True,
) -> Notification:
    if type not in NOTIF_TYPES:
        type = "Info"
    notif = Notification(
        id=_notif_id(),
        user_id=user_id,
        user_role=user_role,
        title=title,
        message=message,
        type=type,
        issue_id=issue_id,
        read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.flush()

    if broadcast and manager.has_connections(user_id):
        try:
            payload = _notification_payload(notif)
            _schedule_broadcast(user_id, payload)
        except Exception:
            pass

    return notif


async def notify_user(
    db: Session,
    user_id: str,
    user_role: str,
    type: str,
    title: str,
    message: str,
    issue_id: Optional[str] = None,
    broadcast: bool = True,
) -> Notification:
    if type not in NOTIF_TYPES:
        type = "Info"
    notif = Notification(
        id=_notif_id(),
        user_id=user_id,
        user_role=user_role,
        title=title,
        message=message,
        type=type,
        issue_id=issue_id,
        read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.flush()

    if broadcast and manager.has_connections(user_id):
        payload = _notification_payload(notif)
        try:
            await manager.broadcast_to_user(user_id, payload)
        except Exception:
            pass

    return notif


def get_unread_count(db: Session, user_id: str) -> int:
    from sqlalchemy import func
    return int(
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == user_id, Notification.read == False)
        .scalar()
        or 0
    )

