"""MongoDB connection and index management."""
import logging
from typing import Any

from pymongo import ASCENDING, MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError

from .config import settings

logger = logging.getLogger("mediflow.db")

COLLECTIONS = [
    "users", "patients", "hospitals", "doctors", "departments", "appointments",
    "bookings", "queues", "queue_entries", "payments", "screening_questions",
    "screening_sessions", "symptoms", "notifications", "priority_arrivals", "admin_logs",
]

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000, tz_aware=True)
    return _client


def get_db() -> Database[dict[str, Any]]:
    return get_client()[settings.DATABASE_NAME]


def ping() -> bool:
    try:
        get_client().admin.command("ping")
        return True
    except PyMongoError as exc:  # pragma: no cover - environment dependent
        logger.error("MongoDB unavailable: %s", exc)
        return False


def ensure_indexes() -> None:
    db = get_db()
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.patients.create_index([("hospital_id", ASCENDING)])
    db.patients.create_index([("created_at", ASCENDING)])
    db.doctors.create_index([("hospital_id", ASCENDING), ("department_id", ASCENDING)])
    db.doctors.create_index([("status", ASCENDING)])
    db.departments.create_index([("hospital_id", ASCENDING), ("code", ASCENDING)])
    db.appointments.create_index([("patient_id", ASCENDING)])
    db.appointments.create_index([("doctor_id", ASCENDING), ("status", ASCENDING)])
    db.appointments.create_index([("hospital_id", ASCENDING), ("created_at", ASCENDING)])
    db.bookings.create_index([("appointment_id", ASCENDING)])
    db.bookings.create_index(
        [("doctor_id", ASCENDING), ("slot", ASCENDING), ("active", ASCENDING)]
    )
    db.queue_entries.create_index([("doctor_id", ASCENDING), ("status", ASCENDING)])
    db.queue_entries.create_index([("queue_id", ASCENDING)])
    db.queue_entries.create_index([("patient_id", ASCENDING)])
    db.queue_entries.create_index([("token", ASCENDING), ("hospital_id", ASCENDING)], unique=True)
    db.queues.create_index([("doctor_id", ASCENDING)], unique=True)
    db.payments.create_index([("booking_id", ASCENDING)])
    db.notifications.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
    db.screening_sessions.create_index([("patient_id", ASCENDING)])
    db.priority_arrivals.create_index([("hospital_id", ASCENDING), ("status", ASCENDING)])
