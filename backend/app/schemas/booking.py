from pydantic import BaseModel, Field

from ..models.enums import AppointmentStatus


class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    hospital_id: str
    slot: str = Field(examples=["3:40 PM"])
    appointment_type: str = "IN_PERSON"
    generate_token: bool = False


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class BookingCreate(BaseModel):
    patient_id: str
    doctor_id: str
    hospital_id: str
    slot: str = Field(examples=["3:40 PM"])
    appointment_type: str = "IN_PERSON"
    screening_session_id: str | None = None


class DemoPaymentRequest(BaseModel):
    booking_id: str
    amount: int = Field(gt=0, le=100000, examples=[500])
    method: str = "DEMO_UPI"
