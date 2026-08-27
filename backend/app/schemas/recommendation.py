from pydantic import BaseModel, Field

from ..models.enums import Urgency


class CareNavigationRequest(BaseModel):
    patient_id: str
    screening_session_id: str


class DoctorRecommendationRequest(BaseModel):
    hospital_id: str = Field(examples=["h1"])
    care_category: str = Field(examples=["GASTROENTEROLOGY"])
    urgency: Urgency = Urgency.ROUTINE
    patient_id: str | None = None
