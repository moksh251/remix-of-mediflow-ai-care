"""Patient records."""
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from ..deps import DB
from ..errors import ok
from ..schemas.patient import PatientCreate, PatientUpdate
from ..services import booking_service, queue_service
from ..utils.ids import new_id
from ..utils.validators import require_hospital, require_patient

router = APIRouter(prefix="/api/patients", tags=["patients"])


def serialize(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "name": doc["name"],
        "age": doc["age"],
        "sex": doc["sex"],
        "height": doc.get("height"),
        "weight": doc.get("weight"),
        "phone": doc["phone"],
        "hospital_id": doc["hospital_id"],
        "created_at": doc["created_at"],
    }


@router.post("")
def create_patient(payload: PatientCreate, db: DB):
    require_hospital(db, payload.hospital_id)
    doc = {"_id": new_id("pat"), **payload.model_dump(), "created_at": datetime.now(timezone.utc)}
    db.patients.insert_one(doc)
    return ok(serialize(doc), "Patient registered.")


@router.get("")
def list_patients(db: DB, hospital_id: str | None = Query(default=None), limit: int = 100):
    query = {"hospital_id": hospital_id} if hospital_id else {}
    docs = db.patients.find(query).sort("created_at", -1).limit(limit)
    return ok([serialize(d) for d in docs])


@router.get("/{patient_id}")
def get_patient(patient_id: str, db: DB):
    return ok(serialize(require_patient(db, patient_id)))


@router.patch("/{patient_id}")
def update_patient(patient_id: str, payload: PatientUpdate, db: DB):
    require_patient(db, patient_id)
    changes = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if changes:
        db.patients.update_one({"_id": patient_id}, {"$set": changes})
    return ok(serialize(db.patients.find_one({"_id": patient_id})), "Patient updated.")


@router.get("/{patient_id}/appointments")
def patient_appointments(patient_id: str, db: DB):
    require_patient(db, patient_id)
    docs = db.appointments.find({"patient_id": patient_id}).sort("created_at", -1)
    return ok([booking_service.serialize_appointment(d) for d in docs])


@router.get("/{patient_id}/queue")
def patient_queue(patient_id: str, db: DB):
    require_patient(db, patient_id)
    entries = db.queue_entries.find({
        "patient_id": patient_id,
        "status": {"$in": ["WAITING", "IN_CONSULTATION"]},
    })
    out = []
    for entry in entries:
        wait = queue_service.calculate_wait_time(db, entry["doctor_id"], entry["_id"])
        out.append({**queue_service.serialize_entry(db, entry), **wait})
    return ok(out)
