"""Doctor console: live queue, patient summaries and consultation control."""
from fastapi import APIRouter

from ..deps import DB, DoctorUser
from ..errors import ok
from ..models.enums import DoctorStatus, QueueEntryStatus
from ..services import queue_service
from ..utils.validators import require_doctor, require_patient

router = APIRouter(prefix="/api/doctor", tags=["doctor"])


@router.get("/{doctor_id}/dashboard")
def dashboard(doctor_id: str, db: DB, _user: DoctorUser):
    doctor = require_doctor(db, doctor_id)
    queue = queue_service.get_queue(db, doctor_id)
    completed = db.queue_entries.count_documents(
        {"doctor_id": doctor_id, "status": QueueEntryStatus.COMPLETED.value}
    )
    no_shows = db.queue_entries.count_documents(
        {"doctor_id": doctor_id, "status": QueueEntryStatus.NO_SHOW.value}
    )
    return ok({
        **queue,
        "consultations_completed": completed,
        "no_shows": no_shows,
        "average_consultation_minutes": doctor["average_consultation_minutes"],
    })


@router.get("/{doctor_id}/patients/{patient_id}/summary")
def patient_summary(doctor_id: str, patient_id: str, db: DB, _user: DoctorUser):
    require_doctor(db, doctor_id)
    patient = require_patient(db, patient_id)
    session = db.screening_sessions.find_one(
        {"patient_id": patient_id, "completed": True}, sort=[("created_at", -1)]
    )
    return ok({
        "patient": {"id": patient["_id"], "name": patient["name"], "age": patient["age"], "sex": patient["sex"]},
        "symptoms": session["symptoms"] if session else [],
        "urgency": session.get("urgency") if session else None,
        "emergency_signs": session.get("emergency_signs", []) if session else [],
        "summary": session.get("summary", {}) if session else {},
        "answers": session.get("answers", {}) if session else {},
        "note": "Screening summary only. Not a diagnosis.",
    })


@router.post("/{doctor_id}/status/{status}")
def set_status(doctor_id: str, status: DoctorStatus, db: DB, _user: DoctorUser):
    require_doctor(db, doctor_id)
    db.doctors.update_one({"_id": doctor_id}, {"$set": {"status": status.value}})
    return ok(queue_service.serialize_doctor(db.doctors.find_one({"_id": doctor_id})), "Status updated.")
