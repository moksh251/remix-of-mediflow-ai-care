"""Reception desk operations."""
from datetime import datetime, timezone

from fastapi import APIRouter

from ..deps import DB, StaffUser
from ..errors import ok
from ..models.enums import AppointmentStatus, NotificationType, QueueEntryStatus
from ..schemas.staff import EntryAction, NotificationCreate, PriorityArrivalCreate, StaffRegisterPatient
from ..services import queue_service
from ..services.notification_service import create_notification
from ..utils.ids import new_id
from ..utils.validators import require_hospital, require_patient, require_queue_entry

router = APIRouter(prefix="/api/staff", tags=["staff"])


@router.post("/patients")
def register_walk_in(payload: StaffRegisterPatient, db: DB, _user: StaffUser):
    require_hospital(db, payload.hospital_id)
    data = payload.model_dump()
    doctor_id = data.pop("doctor_id", None)
    concern = data.pop("concern", None)
    patient = {"_id": new_id("pat"), **data, "created_at": datetime.now(timezone.utc)}
    db.patients.insert_one(patient)
    result: dict = {"patient_id": patient["_id"], "name": patient["name"]}
    if doctor_id:
        result["queue"] = queue_service.add_to_queue(
            db, patient_id=patient["_id"], doctor_id=doctor_id, source="reception", summary=concern
        )
    return ok(result, "Walk-in patient registered.")


@router.get("/queues/{hospital_id}")
def hospital_queues(hospital_id: str, db: DB, _user: StaffUser):
    require_hospital(db, hospital_id)
    doctors = db.doctors.find({"hospital_id": hospital_id}).sort("name", 1)
    return ok([queue_service.get_queue(db, d["_id"]) for d in doctors])


@router.post("/arrival")
def mark_arrived(payload: EntryAction, db: DB, _user: StaffUser):
    entry = require_queue_entry(db, payload.queue_entry_id)
    db.queue_entries.update_one(
        {"_id": entry["_id"]}, {"$set": {"status": QueueEntryStatus.WAITING.value}}
    )
    if entry.get("appointment_id"):
        db.appointments.update_one(
            {"_id": entry["appointment_id"]}, {"$set": {"status": AppointmentStatus.ARRIVED.value}}
        )
    return ok(queue_service.recalculate_queue(db, entry["doctor_id"]), "Marked as arrived.")


@router.post("/no-show")
def mark_no_show(payload: EntryAction, db: DB, _user: StaffUser):
    data = queue_service.remove_from_queue(db, payload.queue_entry_id, QueueEntryStatus.NO_SHOW)
    return ok(data, "Marked as no-show.")


@router.post("/priority-arrival")
def priority_arrival(payload: PriorityArrivalCreate, db: DB, user: StaffUser):
    patient = require_patient(db, payload.patient_id)
    doc = {
        "_id": new_id("pri"),
        "patient_id": payload.patient_id,
        "appointment_id": payload.appointment_id,
        "hospital_id": patient["hospital_id"],
        "eta_minutes": payload.eta_minutes,
        "reason": payload.reason,
        "status": "OPEN",
        "raised_by": user["_id"],
        "created_at": datetime.now(timezone.utc),
    }
    db.priority_arrivals.insert_one(doc)
    entry = db.queue_entries.find_one({
        "patient_id": payload.patient_id, "status": QueueEntryStatus.WAITING.value
    })
    if entry:
        db.queue_entries.update_one({"_id": entry["_id"]}, {"$set": {"priority": True}})
        queue_service.recalculate_queue(db, entry["doctor_id"])
    create_notification(
        db,
        user_id=payload.patient_id,
        type_=NotificationType.PRIORITY_ALERT,
        title="Priority arrival recorded",
        body=payload.reason,
        data={"eta_minutes": payload.eta_minutes},
    )
    return ok({"id": doc["_id"], "status": doc["status"]}, "Priority arrival recorded.")


@router.get("/priority-arrivals/{hospital_id}")
def list_priority(hospital_id: str, db: DB, _user: StaffUser):
    docs = db.priority_arrivals.find({"hospital_id": hospital_id, "status": "OPEN"}).sort("created_at", -1)
    out = []
    for d in docs:
        patient = db.patients.find_one({"_id": d["patient_id"]})
        out.append({
            "id": d["_id"],
            "patient_name": patient["name"] if patient else "Unknown",
            "eta_minutes": d["eta_minutes"],
            "reason": d["reason"],
            "created_at": d["created_at"],
        })
    return ok(out)


@router.post("/priority-arrivals/{arrival_id}/acknowledge")
def acknowledge(arrival_id: str, db: DB, _user: StaffUser):
    db.priority_arrivals.update_one({"_id": arrival_id}, {"$set": {"status": "ACKNOWLEDGED"}})
    return ok({"id": arrival_id, "status": "ACKNOWLEDGED"}, "Alert acknowledged.")


@router.post("/notify")
def notify(payload: NotificationCreate, db: DB, _user: StaffUser):
    return ok(
        create_notification(
            db,
            user_id=payload.user_id,
            type_=payload.type,
            title=payload.title,
            body=payload.body,
            data=payload.data,
        ),
        "Notification sent.",
    )
