from pydantic import BaseModel, Field, field_validator

from ..utils.validators import validate_age, validate_phone, validate_sex


class PatientCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80, examples=["Priya Shah"])
    age: int = Field(examples=[27])
    sex: str = Field(examples=["female"])
    phone: str = Field(examples=["+91 9876543210"])
    hospital_id: str = Field(examples=["h1"])
    height: str | None = Field(default=None, examples=["162 cm"])
    weight: str | None = Field(default=None, examples=["58 kg"])

    _age = field_validator("age")(lambda cls, v: validate_age(v))
    _sex = field_validator("sex")(lambda cls, v: validate_sex(v))
    _phone = field_validator("phone")(lambda cls, v: validate_phone(v))


class PatientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    age: int | None = None
    sex: str | None = None
    phone: str | None = None
    height: str | None = None
    weight: str | None = None
    hospital_id: str | None = None
