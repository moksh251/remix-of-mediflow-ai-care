from pydantic import BaseModel, Field


class ScreeningStartRequest(BaseModel):
    patient_id: str = Field(examples=["pat_abc123"])
    symptoms: list[str] = Field(min_length=1, examples=[["STOMACH_PAIN"]])
    free_text: str | None = Field(default=None, examples=["Pain since two days, vomiting twice"])
    age: int = Field(examples=[27])
    sex: str = Field(examples=["female"])


class ScreeningCompleteRequest(BaseModel):
    patient_id: str
    screening_session_id: str
    answers: dict = Field(
        examples=[{"duration": "2 days", "vomiting": True, "fever": False, "severity": 6}]
    )
