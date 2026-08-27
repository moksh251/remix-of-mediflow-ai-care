from pydantic import BaseModel, EmailStr, Field

from ..models.enums import Role


class LoginRequest(BaseModel):
    email: EmailStr = Field(examples=["reception@demo.com"])
    password: str = Field(min_length=4, examples=["mediflow123"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2, max_length=80)
    role: Role = Role.PATIENT
    hospital_id: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    name: str
    user_id: str
    hospital_id: str | None = None
