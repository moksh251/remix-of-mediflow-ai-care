from datetime import datetime, timezone

from pydantic import BaseModel, Field


class BookingDoc(BaseModel):
    id: str = Field(alias="_id")
    appointment_id: str
    patient_id: str
    doctor_id: str
    hospital_id: str
    slot: str
    fee: int
    paid: bool = False
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}
