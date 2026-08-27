from pydantic import BaseModel, Field

from .enums import DoctorStatus


class DoctorDoc(BaseModel):
    id: str = Field(alias="_id")
    name: str
    specialization: str
    hospital_id: str
    department_id: str
    experience_years: int
    consultation_fee: int
    average_consultation_minutes: int
    status: DoctorStatus = DoctorStatus.AVAILABLE
    available_slots: list[str] = []
    current_queue_count: int = 0
    consultation_started_at: str | None = None

    model_config = {"populate_by_name": True}
