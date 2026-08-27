"""Queue engine endpoints, shared by the patient app, reception and doctors."""
from fastapi import APIRouter

from ..deps import DB, AnyStaffUser, DoctorUser
from ..errors import NotFound, ok
from ..models.enums import QueueEntryStatus
from ..schemas.queue import QueueJoinRequest, TokenRequest
from ..services import queue_service

router = APIRouter(prefix="/api/queue", tags=["queue"])


@router.post("/join")
def join(payload: QueueJoinRequest, db: DB):
    data = queue_service.add_to_queue(
        db,
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        appointment_id=payload.appointment_id,
        priority=payload.priority,
        source=payload.source,
        summary=payload.summary,
    )
    return ok(data, "Added to queue.")


@router.post("/token")
def generate_token(payload: TokenRequest, db: DB):
    data = queue_service.add_to_queue(
        db,
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        appointment_id=payload.appointment_id,
        priority=payload.priority,
        source="reception",
    )
    return ok(data, "Token generated.")


@router.get("/doctor/{doctor_id}")
def doctor_queue(doctor_id: str, db: DB):
    return ok(queue_service.get_queue(db, doctor_id))


@router.get("/entry/{entry_id}")
def entry_status(entry_id: str, db: DB):
    return ok(queue_service.get_queue_position(db, entry_id))


@router.get("/track/{token}")
def track(token: str, db: DB, hospital_id: str | None = None):
    query = {"token": token}
    if hospital_id:
        query["hospital_id"] = hospital_id
    entry = db.queue_entries.find_one(query)
    if not entry:
        raise NotFound("TOKEN_NOT_FOUND", "We could not find that token.")
    wait = queue_service.calculate_wait_time(db, entry["doctor_id"], entry["_id"])
    doctor = db.doctors.find_one({"_id": entry["doctor_id"]})
    return ok({
        "entry": queue_service.serialize_entry(db, entry),
        "doctor": queue_service.serialize_doctor(doctor),
        **wait,
    })


@router.post("/{doctor_id}/start")
def start(doctor_id: str, db: DB, _user: DoctorUser):
    return ok(queue_service.start_consultation(db, doctor_id), "Consultation started.")


@router.post("/{doctor_id}/complete")
def complete(doctor_id: str, db: DB, _user: DoctorUser, entry_id: str | None = None):
    return ok(queue_service.complete_patient(db, doctor_id, entry_id), "Consultation completed.")


@router.post("/{doctor_id}/pause")
def pause(doctor_id: str, db: DB, _user: DoctorUser, minutes: int = 15):
    return ok(queue_service.pause_queue(db, doctor_id, minutes), "Queue paused.")


@router.post("/{doctor_id}/resume")
def resume(doctor_id: str, db: DB, _user: DoctorUser):
    return ok(queue_service.resume_queue(db, doctor_id), "Queue resumed.")


@router.post("/{doctor_id}/recalculate")
def recalculate(doctor_id: str, db: DB, _user: AnyStaffUser):
    return ok(queue_service.recalculate_queue(db, doctor_id), "Queue recalculated.")


@router.delete("/entry/{entry_id}")
def remove(entry_id: str, db: DB, _user: AnyStaffUser, no_show: bool = False):
    status = QueueEntryStatus.NO_SHOW if no_show else QueueEntryStatus.REMOVED
    return ok(queue_service.remove_from_queue(db, entry_id, status), "Queue entry updated.")
