from pydantic import BaseModel, Field


class QueueJoinRequest(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_id: str | None = None
    priority: bool = False
    source: str = Field(default="patient-app", examples=["patient-app", "reception"])
    summary: str | None = None


class TokenRequest(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_id: str | None = None
    priority: bool = False
