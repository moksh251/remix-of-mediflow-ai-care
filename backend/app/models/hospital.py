from pydantic import BaseModel, Field


class HospitalDoc(BaseModel):
    id: str = Field(alias="_id")
    name: str
    city: str
    open_hours: str
    is_open: bool = True

    model_config = {"populate_by_name": True}


class DepartmentDoc(BaseModel):
    id: str = Field(alias="_id")
    hospital_id: str
    code: str
    name: str

    model_config = {"populate_by_name": True}
