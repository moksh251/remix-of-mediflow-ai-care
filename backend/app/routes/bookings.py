"""Appointments, bookings and demo payments."""
from fastapi import APIRouter

from ..deps import DB
from ..errors import ok
from ..schemas.booking import (
    AppointmentCreate,
    AppointmentStatusUpdate,
    BookingCreate,
    DemoPaymentRequest,
)
from ..services import booking_service, queue_service
from ..utils.validators import require_appointment, require_booking

router = APIRouter(prefix="/api", tags=["bookings"])


@router.post("/appointments")
def create_appointment(payload: AppointmentCreate, db: DB):
    appointment = booking_service.create_appointment(
        db,
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        hospital_id=payload.hospital_id,
        slot=payload.slot,
        appointment_type=payload.appointment_type,
    )
    result = {"appointment": appointment}
    if payload.generate_token:
        result["queue"] = queue_service.add_to_queue(
            db,
            patient_id=payload.patient_id,
            doctor_id=payload.doctor_id,
            appointment_id=appointment["id"],
        )
    return ok(result, "Appointment confirmed.")


@router.get("/appointments/{appointment_id}")
def get_appointment(appointment_id: str, db: DB):
    return ok(booking_service.serialize_appointment(require_appointment(db, appointment_id)))


@router.patch("/appointments/{appointment_id}/status")
def update_appointment(appointment_id: str, payload: AppointmentStatusUpdate, db: DB):
    require_appointment(db, appointment_id)
    db.appointments.update_one({"_id": appointment_id}, {"$set": {"status": payload.status.value}})
    return ok(
        booking_service.serialize_appointment(db.appointments.find_one({"_id": appointment_id})),
        "Appointment updated.",
    )


@router.post("/bookings")
def create_booking(payload: BookingCreate, db: DB):
    return ok(
        booking_service.create_booking(
            db,
            patient_id=payload.patient_id,
            doctor_id=payload.doctor_id,
            hospital_id=payload.hospital_id,
            slot=payload.slot,
            appointment_type=payload.appointment_type,
            screening_session_id=payload.screening_session_id,
        ),
        "Booking created.",
    )


@router.get("/bookings/{booking_id}")
def get_booking(booking_id: str, db: DB):
    return ok(booking_service.serialize_booking(require_booking(db, booking_id)))


@router.delete("/bookings/{booking_id}")
def cancel_booking(booking_id: str, db: DB):
    return ok(booking_service.cancel_booking(db, booking_id), "Booking cancelled.")


@router.post("/payments/demo")
def demo_payment(payload: DemoPaymentRequest, db: DB):
    return ok(
        booking_service.process_demo_payment(
            db, booking_id=payload.booking_id, amount=payload.amount, method=payload.method
        ),
        "Demo payment successful.",
    )


@router.get("/payments/{booking_id}/receipt")
def receipt(booking_id: str, db: DB):
    return ok(booking_service.get_receipt(db, booking_id))
