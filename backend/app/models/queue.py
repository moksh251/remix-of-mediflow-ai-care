from datetime import datetime, timezone

from pydantic import BaseModel, Field

from .enums import QueueEntryStatus


class QueueDoc(BaseModel):
    id: str = Field(alias="_id")
    doctor_id: str
    hospital_id: str

    model_config = {"populate_by_name": True}


class QueueEntryDoc(BaseModel):
    id: str = Field(alias="_id")
    queue_id: str
    token: str
    hospital_id: str
    doctor_id: str
    patient_id: str
    appointment_id: str | None = None
    priority: bool = False
    status: QueueEntryStatus = QueueEntryStatus.WAITING
    source: str = "patient-app"
    summary: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None

    model_config = {"populate_by_name": True}
