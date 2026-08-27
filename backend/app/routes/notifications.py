"""Notification feed (polled by the frontend)."""
from fastapi import APIRouter

from ..deps import DB
from ..errors import ok
from ..services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/{user_id}")
def list_for_user(user_id: str, db: DB, limit: int = 50):
    return ok(notification_service.list_notifications(db, user_id, limit))


@router.post("/{notification_id}/read")
def mark_read(notification_id: str, db: DB):
    notification_service.mark_read(db, notification_id)
    return ok({"id": notification_id, "read": True}, "Notification marked as read.")
