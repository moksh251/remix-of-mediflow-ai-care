from datetime import datetime, timezone

from pydantic import BaseModel, Field

from .enums import Urgency


class ScreeningSessionDoc(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    symptoms: list[str]
    free_text: str | None = None
    age: int
    sex: str
    answers: dict = {}
    urgency: Urgency | None = None
    care_categories: list[str] = []
    summary: dict = {}
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}
