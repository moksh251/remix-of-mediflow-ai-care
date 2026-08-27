from datetime import datetime, timezone

from pydantic import BaseModel, Field

from .enums import AppointmentStatus


class AppointmentDoc(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    doctor_id: str
    hospital_id: str
    slot: str
    appointment_type: str = "IN_PERSON"
    status: AppointmentStatus = AppointmentStatus.PENDING
    token: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}
