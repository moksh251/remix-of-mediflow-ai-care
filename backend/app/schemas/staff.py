from pydantic import BaseModel, Field

from .patient import PatientCreate


class StaffRegisterPatient(PatientCreate):
    doctor_id: str | None = Field(default=None, description="Optionally queue immediately.")
    concern: str | None = None


class EntryAction(BaseModel):
    queue_entry_id: str


class PriorityArrivalCreate(BaseModel):
    patient_id: str
    appointment_id: str | None = None
    eta_minutes: int = Field(ge=0, le=600, examples=[20])
    reason: str = Field(examples=["Patient reports worsening symptoms on the way"])


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    body: str
    data: dict = {}
