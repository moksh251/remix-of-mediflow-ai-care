"""Hospitals, departments and doctor directory."""
from fastapi import APIRouter, Query

from ..deps import DB, DoctorUser
from ..errors import ok
from ..models.enums import DoctorStatus
from ..services import queue_service
from ..utils.validators import require_doctor, require_hospital

router = APIRouter(prefix="/api", tags=["hospitals"])


@router.get("/hospitals")
def list_hospitals(db: DB):
    docs = list(db.hospitals.find().sort("name", 1))
    return ok([
        {
            "id": h["_id"],
            "name": h["name"],
            "city": h["city"],
            "open_hours": h["open_hours"],
            "is_open": h.get("is_open", True),
        }
        for h in docs
    ])


@router.get("/hospitals/{hospital_id}/departments")
def list_departments(hospital_id: str, db: DB):
    require_hospital(db, hospital_id)
    docs = list(db.departments.find({"hospital_id": hospital_id}))
    return ok([{"id": d["_id"], "code": d["code"], "name": d["name"]} for d in docs])


@router.get("/doctors")
def list_doctors(
    db: DB,
    hospital_id: str | None = Query(default=None),
    department_code: str | None = Query(default=None),
    status: DoctorStatus | None = Query(default=None),
):
    query: dict = {}
    if hospital_id:
        require_hospital(db, hospital_id)
        query["hospital_id"] = hospital_id
    if department_code:
        dept = db.departments.find_one({"hospital_id": hospital_id, "code": department_code})
        query["department_id"] = dept["_id"] if dept else "__none__"
    if status:
        query["status"] = status.value
    doctors = list(db.doctors.find(query).sort("name", 1))
    return ok([
        {
            **queue_service.serialize_doctor(d),
            "estimated_wait_minutes": queue_service.calculate_wait_time(db, d["_id"])[
                "estimated_wait_minutes"
            ],
        }
        for d in doctors
    ])


@router.get("/doctors/{doctor_id}")
def get_doctor(doctor_id: str, db: DB):
    doctor = require_doctor(db, doctor_id)
    wait = queue_service.calculate_wait_time(db, doctor_id)
    return ok({**queue_service.serialize_doctor(doctor), **wait})


@router.patch("/doctors/{doctor_id}/status")
def update_status(doctor_id: str, status: DoctorStatus, db: DB, _user: DoctorUser):
    require_doctor(db, doctor_id)
    db.doctors.update_one({"_id": doctor_id}, {"$set": {"status": status.value}})
    return ok(queue_service.serialize_doctor(db.doctors.find_one({"_id": doctor_id})), "Status updated.")
