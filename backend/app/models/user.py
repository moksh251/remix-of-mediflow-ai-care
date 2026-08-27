from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field

from .enums import Role


class UserDoc(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    password_hash: str
    role: Role
    name: str
    hospital_id: str | None = None
    doctor_id: str | None = None
    patient_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}
