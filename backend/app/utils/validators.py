"""Reusable field validators and existence checks."""
import re

from pymongo.database import Database

from ..errors import NotFound

PHONE_RE = re.compile(r"^[0-9+][0-9\- ]{7,15}$")
SEXES = {"male", "female", "other"}


def validate_phone(value: str) -> str:
    value = value.strip()
    if not PHONE_RE.match(value):
        raise ValueError("Phone number must be 8-16 digits and may include + or -.")
    return value


def validate_sex(value: str) -> str:
    lowered = value.strip().lower()
    if lowered not in SEXES:
        raise ValueError("Sex must be one of: male, female, other.")
    return lowered


def validate_age(value: int) -> int:
    if value < 0 or value > 120:
        raise ValueError("Age must be between 0 and 120.")
    return value


def require_hospital(db: Database, hospital_id: str) -> dict:
    doc = db.hospitals.find_one({"_id": hospital_id})
    if not doc:
        raise NotFound("HOSPITAL_NOT_FOUND", "The selected hospital does not exist.")
    return doc


def require_doctor(db: Database, doctor_id: str) -> dict:
    doc = db.doctors.find_one({"_id": doctor_id})
    if not doc:
        raise NotFound("DOCTOR_NOT_FOUND", "The selected doctor does not exist.")
    return doc


def require_patient(db: Database, patient_id: str) -> dict:
    doc = db.patients.find_one({"_id": patient_id})
    if not doc:
        raise NotFound("PATIENT_NOT_FOUND", "The selected patient does not exist.")
    return doc


def require_appointment(db: Database, appointment_id: str) -> dict:
    doc = db.appointments.find_one({"_id": appointment_id})
    if not doc:
        raise NotFound("APPOINTMENT_NOT_FOUND", "The selected appointment does not exist.")
    return doc


def require_booking(db: Database, booking_id: str) -> dict:
    doc = db.bookings.find_one({"_id": booking_id})
    if not doc:
        raise NotFound("BOOKING_NOT_FOUND", "The selected booking does not exist.")
    return doc


def require_queue_entry(db: Database, entry_id: str) -> dict:
    doc = db.queue_entries.find_one({"_id": entry_id})
    if not doc:
        raise NotFound("QUEUE_ENTRY_NOT_FOUND", "The selected queue entry does not exist.")
    return doc
