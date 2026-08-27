"""Appointments, slot booking and demo payments."""
from datetime import datetime, timezone

from pymongo.database import Database

from ..errors import Conflict, NotFound
from ..models.enums import AppointmentStatus, DoctorStatus, NotificationType, PaymentStatus
from ..utils.ids import new_id
from ..utils.validators import require_booking, require_doctor, require_hospital, require_patient
from . import queue_service
from .notification_service import create_notification


def create_appointment(
    db: Database,
    *,
    patient_id: str,
    doctor_id: str,
    hospital_id: str,
    slot: str,
    appointment_type: str = "IN_PERSON",
) -> dict:
    require_patient(db, patient_id)
    doctor = require_doctor(db, doctor_id)
    hospital = require_hospital(db, hospital_id)
    if doctor["hospital_id"] != hospital_id:
        raise Conflict("DOCTOR_HOSPITAL_MISMATCH", "This doctor does not work at the selected hospital.")
    if not hospital.get("is_open", True):
        raise Conflict("HOSPITAL_CLOSED", "The selected hospital is currently closed.")
    if doctor["status"] == DoctorStatus.OFFLINE.value:
        raise Conflict("DOCTOR_UNAVAILABLE", "The selected doctor is currently unavailable.")
    if slot not in doctor.get("available_slots", []):
        raise Conflict("SLOT_UNAVAILABLE", "That time slot is no longer available.")
    if db.bookings.find_one({"doctor_id": doctor_id, "slot": slot, "active": True}):
        raise Conflict("SLOT_ALREADY_BOOKED", "That time slot has just been booked by someone else.")
    if db.appointments.find_one({
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "status": {"$in": [AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value]},
    }):
        raise Conflict("DUPLICATE_APPOINTMENT", "This patient already has an open appointment with this doctor.")

    appointment = {
        "_id": new_id("apt"),
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "hospital_id": hospital_id,
        "slot": slot,
        "appointment_type": appointment_type,
        "status": AppointmentStatus.CONFIRMED.value,
        "token": None,
        "created_at": datetime.now(timezone.utc),
    }
    db.appointments.insert_one(appointment)
    return serialize_appointment(appointment)


def create_booking(
    db: Database,
    *,
    patient_id: str,
    doctor_id: str,
    hospital_id: str,
    slot: str,
    appointment_type: str = "IN_PERSON",
    screening_session_id: str | None = None,
) -> dict:
    appointment = create_appointment(
        db,
        patient_id=patient_id,
        doctor_id=doctor_id,
        hospital_id=hospital_id,
        slot=slot,
        appointment_type=appointment_type,
    )
    doctor = require_doctor(db, doctor_id)
    booking = {
        "_id": new_id("bkg"),
        "appointment_id": appointment["id"],
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "hospital_id": hospital_id,
        "slot": slot,
        "fee": doctor["consultation_fee"],
        "paid": False,
        "active": True,
        "screening_session_id": screening_session_id,
        "created_at": datetime.now(timezone.utc),
    }
    db.bookings.insert_one(booking)
    db.doctors.update_one({"_id": doctor_id}, {"$pull": {"available_slots": slot}})
    create_notification(
        db,
        user_id=patient_id,
        type_=NotificationType.BOOKING_CONFIRMED,
        title="Appointment confirmed",
        body=f"{doctor['name']} at {slot}. Consultation fee Rs {doctor['consultation_fee']}.",
        data={"booking_id": booking["_id"], "slot": slot},
    )
    return {"booking": serialize_booking(booking), "appointment": appointment}


def cancel_booking(db: Database, booking_id: str) -> dict:
    booking = require_booking(db, booking_id)
    if not booking.get("active", True):
        raise Conflict("BOOKING_ALREADY_CANCELLED", "This booking has already been cancelled.")
    db.bookings.update_one({"_id": booking_id}, {"$set": {"active": False}})
    db.appointments.update_one(
        {"_id": booking["appointment_id"]}, {"$set": {"status": AppointmentStatus.CANCELLED.value}}
    )
    db.doctors.update_one({"_id": booking["doctor_id"]}, {"$addToSet": {"available_slots": booking["slot"]}})
    entry = db.queue_entries.find_one({"appointment_id": booking["appointment_id"]})
    if entry:
        queue_service.remove_from_queue(db, entry["_id"])
    create_notification(
        db,
        user_id=booking["patient_id"],
        type_=NotificationType.APPOINTMENT_CANCELLED,
        title="Appointment cancelled",
        body=f"Your {booking['slot']} appointment has been cancelled.",
        data={"booking_id": booking_id},
    )
    return serialize_booking(db.bookings.find_one({"_id": booking_id}))


def process_demo_payment(db: Database, *, booking_id: str, amount: int, method: str = "DEMO_UPI") -> dict:
    """Simulated payment only. No real gateway, no card data is ever collected."""
    booking = require_booking(db, booking_id)
    if booking.get("paid"):
        raise Conflict("ALREADY_PAID", "This booking has already been paid.")
    if not booking.get("active", True):
        raise Conflict("BOOKING_CANCELLED", "This booking has been cancelled.")
    if amount != booking["fee"]:
        raise Conflict("AMOUNT_MISMATCH", f"Expected amount Rs {booking['fee']}.")
    payment = {
        "_id": new_id("pay"),
        "booking_id": booking_id,
        "amount": amount,
        "transaction_id": f"DEMO-TXN-{new_id('')[1:9].upper()}",
        "method": method,
        "status": PaymentStatus.SUCCESS.value,
        "created_at": datetime.now(timezone.utc),
    }
    db.payments.insert_one(payment)
    db.bookings.update_one({"_id": booking_id}, {"$set": {"paid": True}})
    create_notification(
        db,
        user_id=booking["patient_id"],
        type_=NotificationType.PAYMENT_SUCCESS,
        title="Payment successful (demo)",
        body=f"Rs {amount} received. Transaction {payment['transaction_id']}.",
        data={"booking_id": booking_id, "transaction_id": payment["transaction_id"]},
    )
    return {
        "payment": serialize_payment(payment),
        "booking": serialize_booking(db.bookings.find_one({"_id": booking_id})),
        "note": "Demo payment only — no real money is processed.",
    }


def get_receipt(db: Database, booking_id: str) -> dict:
    booking = require_booking(db, booking_id)
    payment = db.payments.find_one({"booking_id": booking_id})
    if not payment:
        raise NotFound("PAYMENT_NOT_FOUND", "No payment has been recorded for this booking.")
    doctor = require_doctor(db, booking["doctor_id"])
    patient = require_patient(db, booking["patient_id"])
    entry = db.queue_entries.find_one({"appointment_id": booking["appointment_id"]})
    return {
        "booking_id": booking_id,
        "transaction_id": payment["transaction_id"],
        "amount": payment["amount"],
        "method": payment["method"],
        "status": payment["status"],
        "patient_name": patient["name"],
        "doctor_name": doctor["name"],
        "slot": booking["slot"],
        "token": entry["token"] if entry else None,
        "paid_at": payment["created_at"],
        "note": "Demo payment only — no real money is processed.",
    }


def serialize_appointment(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "patient_id": doc["patient_id"],
        "doctor_id": doc["doctor_id"],
        "hospital_id": doc["hospital_id"],
        "slot": doc["slot"],
        "appointment_type": doc.get("appointment_type", "IN_PERSON"),
        "status": doc["status"],
        "token": doc.get("token"),
        "created_at": doc["created_at"],
    }


def serialize_booking(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "appointment_id": doc["appointment_id"],
        "patient_id": doc["patient_id"],
        "doctor_id": doc["doctor_id"],
        "hospital_id": doc["hospital_id"],
        "slot": doc["slot"],
        "fee": doc["fee"],
        "paid": doc.get("paid", False),
        "active": doc.get("active", True),
        "screening_session_id": doc.get("screening_session_id"),
        "created_at": doc["created_at"],
    }


def serialize_payment(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "booking_id": doc["booking_id"],
        "amount": doc["amount"],
        "transaction_id": doc["transaction_id"],
        "method": doc["method"],
        "status": doc["status"],
        "created_at": doc["created_at"],
    }
