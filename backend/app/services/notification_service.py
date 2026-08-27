"""Notification storage. Hackathon scope: persisted in MongoDB, polled by the frontend."""
from datetime import datetime, timezone

from pymongo.database import Database

from ..models.enums import NotificationType
from ..utils.ids import new_id


def create_notification(
    db: Database,
    *,
    user_id: str,
    type_: NotificationType | str,
    title: str,
    body: str,
    data: dict | None = None,
) -> dict:
    doc = {
        "_id": new_id("ntf"),
        "user_id": user_id,
        "type": type_.value if isinstance(type_, NotificationType) else str(type_),
        "title": title,
        "body": body,
        "read": False,
        "data": data or {},
        "created_at": datetime.now(timezone.utc),
    }
    db.notifications.insert_one(doc)
    return serialize(doc)


def list_notifications(db: Database, user_id: str, limit: int = 50) -> list[dict]:
    docs = db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    return [serialize(d) for d in docs]


def mark_read(db: Database, notification_id: str) -> None:
    db.notifications.update_one({"_id": notification_id}, {"$set": {"read": True}})


def serialize(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "user_id": doc["user_id"],
        "type": doc["type"],
        "title": doc["title"],
        "body": doc["body"],
        "read": doc.get("read", False),
        "data": doc.get("data", {}),
        "created_at": doc["created_at"],
    }
