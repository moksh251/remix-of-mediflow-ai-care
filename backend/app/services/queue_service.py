"""Queue engine: waiting-time estimation and queue lifecycle."""
from datetime import datetime, timezone

from pymongo.database import Database

from ..errors import AppError, Conflict
from ..models.enums import AppointmentStatus, DoctorStatus, NotificationType, QueueEntryStatus
from ..utils.ids import new_id
from ..utils.token_generator import next_token
from ..utils.validators import require_doctor, require_patient
from .notification_service import create_notification

STATUS_OVERHEAD = {
    DoctorStatus.ON_BREAK.value: 15,
    DoctorStatus.OFFLINE.value: 60,
}


def ensure_queue(db: Database, doctor: dict) -> dict:
    queue = db.queues.find_one({"doctor_id": doctor["_id"]})
    if queue:
        return queue
    queue = {"_id": new_id("que"), "doctor_id": doctor["_id"], "hospital_id": doctor["hospital_id"]}
    db.queues.insert_one(queue)
    return queue


def _waiting_entries(db: Database, doctor_id: str) -> list[dict]:
    entries = list(db.queue_entries.find({"doctor_id": doctor_id, "status": QueueEntryStatus.WAITING.value}))
    entries.sort(key=lambda e: (not e.get("priority", False), e["created_at"]))
    return entries


def get_queue(db: Database, doctor_id: str) -> dict:
    doctor = require_doctor(db, doctor_id)
    waiting = _waiting_entries(db, doctor_id)
    current = db.queue_entries.find_one(
        {"doctor_id": doctor_id, "status": QueueEntryStatus.IN_CONSULTATION.value}
    )
    return {
        "doctor": serialize_doctor(doctor),
        "current_patient": serialize_entry(db, current) if current else None,
        "patients_ahead": len(waiting),
        "estimated_wait_minutes": calculate_wait_time(db, doctor_id)["estimated_wait_minutes"],
        "queue_entries": [serialize_entry(db, e) for e in waiting],
    }


def _remaining_current_consult(doctor: dict, has_current: bool) -> int:
    if not has_current:
        return 0
    started = doctor.get("consultation_started_at")
    avg = int(doctor.get("average_consultation_minutes", 10))
    if not started:
        return avg
    try:
        started_dt = datetime.fromisoformat(started)
    except (TypeError, ValueError):
        return avg
    elapsed = (datetime.now(timezone.utc) - started_dt).total_seconds() / 60
    return max(1, int(round(avg - elapsed)))


def calculate_wait_time(db: Database, doctor_id: str, entry_id: str | None = None) -> dict:
    """patients ahead x average duration + remaining current consult + status overhead."""
    doctor = require_doctor(db, doctor_id)
    waiting = _waiting_entries(db, doctor_id)
    current = db.queue_entries.find_one(
        {"doctor_id": doctor_id, "status": QueueEntryStatus.IN_CONSULTATION.value}
    )
    if entry_id:
        ids = [e["_id"] for e in waiting]
        ahead = ids.index(entry_id) if entry_id in ids else len(waiting)
    else:
        ahead = len(waiting)
    minutes = ahead * int(doctor.get("average_consultation_minutes", 10))
    minutes += _remaining_current_consult(doctor, bool(current))
    minutes += STATUS_OVERHEAD.get(doctor.get("status"), 0)
    return {
        "patients_ahead": ahead,
        "estimated_wait_minutes": int(round(minutes)),
        "position": ahead + 1,
    }


def get_queue_position(db: Database, entry_id: str) -> dict:
    entry = db.queue_entries.find_one({"_id": entry_id})
    if not entry:
        raise AppError("QUEUE_ENTRY_NOT_FOUND", "Queue entry not found.", 404)
    wait = calculate_wait_time(db, entry["doctor_id"], entry_id)
    return {"token": entry["token"], "status": entry["status"], **wait}


def add_to_queue(
    db: Database,
    *,
    patient_id: str,
    doctor_id: str,
    appointment_id: str | None = None,
    priority: bool = False,
    source: str = "patient-app",
    summary: str | None = None,
) -> dict:
    patient = require_patient(db, patient_id)
    doctor = require_doctor(db, doctor_id)
    if doctor["status"] == DoctorStatus.OFFLINE.value:
        raise Conflict("DOCTOR_UNAVAILABLE", "The selected doctor is currently unavailable.")
    hospital = db.hospitals.find_one({"_id": doctor["hospital_id"]})
    if hospital and not hospital.get("is_open", True):
        raise Conflict("HOSPITAL_CLOSED", "The selected hospital is currently closed.")

    existing = db.queue_entries.find_one({
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "status": {"$in": [QueueEntryStatus.WAITING.value, QueueEntryStatus.IN_CONSULTATION.value]},
    })
    if existing:
        raise Conflict("ALREADY_IN_QUEUE", "This patient is already in the queue for this doctor.")

    queue = ensure_queue(db, doctor)
    entry = {
        "_id": new_id("qen"),
        "queue_id": queue["_id"],
        "token": next_token(db, doctor["hospital_id"]),
        "hospital_id": doctor["hospital_id"],
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "appointment_id": appointment_id,
        "priority": priority,
        "status": QueueEntryStatus.WAITING.value,
        "source": source,
        "summary": summary,
        "created_at": datetime.now(timezone.utc),
        "completed_at": None,
    }
    db.queue_entries.insert_one(entry)
    _sync_doctor_counts(db, doctor_id)
    if appointment_id:
        db.appointments.update_one({"_id": appointment_id}, {"$set": {"token": entry["token"]}})
    wait = calculate_wait_time(db, doctor_id, entry["_id"])
    create_notification(
        db,
        user_id=patient_id,
        type_=NotificationType.QUEUE_UPDATED,
        title=f"Token {entry['token']} confirmed",
        body=(
            f"{patient['name']}, you are number {wait['position']} for {doctor['name']}. "
            f"Estimated wait: about {wait['estimated_wait_minutes']} minutes."
        ),
        data={"token": entry["token"], **wait},
    )
    return {"entry": serialize_entry(db, entry), **wait}


def remove_from_queue(db: Database, entry_id: str, status: QueueEntryStatus = QueueEntryStatus.REMOVED) -> dict:
    entry = db.queue_entries.find_one({"_id": entry_id})
    if not entry:
        raise AppError("QUEUE_ENTRY_NOT_FOUND", "Queue entry not found.", 404)
    db.queue_entries.update_one(
        {"_id": entry_id},
        {"$set": {"status": status.value, "completed_at": datetime.now(timezone.utc)}},
    )
    if entry.get("appointment_id"):
        mapping = {
            QueueEntryStatus.NO_SHOW: AppointmentStatus.NO_SHOW,
            QueueEntryStatus.REMOVED: AppointmentStatus.CANCELLED,
        }
        if status in mapping:
            db.appointments.update_one(
                {"_id": entry["appointment_id"]}, {"$set": {"status": mapping[status].value}}
            )
    _sync_doctor_counts(db, entry["doctor_id"])
    return recalculate_queue(db, entry["doctor_id"])


def start_consultation(db: Database, doctor_id: str) -> dict:
    doctor = require_doctor(db, doctor_id)
    current = db.queue_entries.find_one(
        {"doctor_id": doctor_id, "status": QueueEntryStatus.IN_CONSULTATION.value}
    )
    if current:
        raise Conflict("CONSULTATION_IN_PROGRESS", "A consultation is already in progress.")
    waiting = _waiting_entries(db, doctor_id)
    if not waiting:
        raise Conflict("QUEUE_EMPTY", "There are no patients waiting in this queue.")
    nxt = waiting[0]
    _move_into_consultation(db, doctor, nxt)
    return get_queue(db, doctor_id)


def complete_patient(db: Database, doctor_id: str, entry_id: str | None = None) -> dict:
    doctor = require_doctor(db, doctor_id)
    query = {"_id": entry_id} if entry_id else {
        "doctor_id": doctor_id, "status": QueueEntryStatus.IN_CONSULTATION.value
    }
    current = db.queue_entries.find_one(query)
    if not current:
        raise Conflict("NO_ACTIVE_CONSULTATION", "There is no consultation in progress for this doctor.")
    db.queue_entries.update_one(
        {"_id": current["_id"]},
        {"$set": {"status": QueueEntryStatus.COMPLETED.value, "completed_at": datetime.now(timezone.utc)}},
    )
    if current.get("appointment_id"):
        db.appointments.update_one(
            {"_id": current["appointment_id"]}, {"$set": {"status": AppointmentStatus.COMPLETED.value}}
        )
    create_notification(
        db,
        user_id=current["patient_id"],
        type_=NotificationType.QUEUE_UPDATED,
        title="Consultation completed",
        body=f"Token {current['token']} has been marked completed.",
        data={"token": current["token"]},
    )
    waiting = _waiting_entries(db, doctor_id)
    if waiting:
        _move_into_consultation(db, doctor, waiting[0])
    else:
        db.doctors.update_one(
            {"_id": doctor_id},
            {"$set": {"status": DoctorStatus.AVAILABLE.value, "consultation_started_at": None}},
        )
    return recalculate_queue(db, doctor_id)


def _move_into_consultation(db: Database, doctor: dict, entry: dict) -> None:
    db.queue_entries.update_one(
        {"_id": entry["_id"]}, {"$set": {"status": QueueEntryStatus.IN_CONSULTATION.value}}
    )
    db.doctors.update_one(
        {"_id": doctor["_id"]},
        {"$set": {
            "status": DoctorStatus.IN_CONSULTATION.value,
            "consultation_started_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    if entry.get("appointment_id"):
        db.appointments.update_one(
            {"_id": entry["appointment_id"]},
            {"$set": {"status": AppointmentStatus.IN_CONSULTATION.value}},
        )
    create_notification(
        db,
        user_id=entry["patient_id"],
        type_=NotificationType.QUEUE_UPDATED,
        title="It is your turn",
        body=f"Token {entry['token']} — please proceed to {doctor['name']}.",
        data={"token": entry["token"]},
    )


def pause_queue(db: Database, doctor_id: str, minutes: int = 15) -> dict:
    require_doctor(db, doctor_id)
    db.doctors.update_one({"_id": doctor_id}, {"$set": {"status": DoctorStatus.ON_BREAK.value}})
    for entry in _waiting_entries(db, doctor_id):
        create_notification(
            db,
            user_id=entry["patient_id"],
            type_=NotificationType.DOCTOR_DELAY,
            title="Short delay expected",
            body=f"The doctor is on a short break. Estimated additional delay: {minutes} minutes.",
            data={"token": entry["token"]},
        )
    return recalculate_queue(db, doctor_id)


def resume_queue(db: Database, doctor_id: str) -> dict:
    require_doctor(db, doctor_id)
    db.doctors.update_one({"_id": doctor_id}, {"$set": {"status": DoctorStatus.AVAILABLE.value}})
    return recalculate_queue(db, doctor_id)


def recalculate_queue(db: Database, doctor_id: str) -> dict:
    """Recomputes positions and ETAs for every waiting patient of a doctor."""
    _sync_doctor_counts(db, doctor_id)
    waiting = _waiting_entries(db, doctor_id)
    doctor = require_doctor(db, doctor_id)
    current = db.queue_entries.find_one(
        {"doctor_id": doctor_id, "status": QueueEntryStatus.IN_CONSULTATION.value}
    )
    base = _remaining_current_consult(doctor, bool(current)) + STATUS_OVERHEAD.get(doctor.get("status"), 0)
    avg = int(doctor.get("average_consultation_minutes", 10))
    updated = []
    for index, entry in enumerate(waiting):
        eta = int(base + index * avg)
        db.queue_entries.update_one({"_id": entry["_id"]}, {"$set": {"position": index + 1, "eta": eta}})
        entry["position"] = index + 1
        entry["eta"] = eta
        updated.append(serialize_entry(db, entry))
    return {
        "doctor": serialize_doctor(db.doctors.find_one({"_id": doctor_id})),
        "current_patient": serialize_entry(db, current) if current else None,
        "patients_ahead": len(waiting),
        "estimated_wait_minutes": int(base + len(waiting) * avg),
        "queue_entries": updated,
    }


def _sync_doctor_counts(db: Database, doctor_id: str) -> None:
    count = db.queue_entries.count_documents(
        {"doctor_id": doctor_id, "status": QueueEntryStatus.WAITING.value}
    )
    db.doctors.update_one({"_id": doctor_id}, {"$set": {"current_queue_count": count}})


def serialize_doctor(doctor: dict | None) -> dict | None:
    if not doctor:
        return None
    return {
        "id": doctor["_id"],
        "name": doctor["name"],
        "specialization": doctor["specialization"],
        "hospital_id": doctor["hospital_id"],
        "department_id": doctor["department_id"],
        "experience_years": doctor["experience_years"],
        "consultation_fee": doctor["consultation_fee"],
        "average_consultation_minutes": doctor["average_consultation_minutes"],
        "status": doctor["status"],
        "available_slots": doctor.get("available_slots", []),
        "current_queue_count": doctor.get("current_queue_count", 0),
    }


def serialize_entry(db: Database, entry: dict | None) -> dict | None:
    if not entry:
        return None
    patient = db.patients.find_one({"_id": entry["patient_id"]})
    return {
        "id": entry["_id"],
        "token": entry["token"],
        "queue_id": entry["queue_id"],
        "doctor_id": entry["doctor_id"],
        "hospital_id": entry["hospital_id"],
        "patient_id": entry["patient_id"],
        "patient_name": patient["name"] if patient else "Unknown",
        "age": patient["age"] if patient else None,
        "appointment_id": entry.get("appointment_id"),
        "priority": entry.get("priority", False),
        "status": entry["status"],
        "source": entry.get("source", "reception"),
        "summary": entry.get("summary"),
        "position": entry.get("position"),
        "eta": entry.get("eta"),
        "created_at": entry["created_at"],
    }
