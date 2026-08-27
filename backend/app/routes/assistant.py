"""Ask-Mediflow assistant: hospital and queue questions only, never clinical advice."""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..config import settings
from ..deps import DB
from ..errors import ok
from ..services import ai_service, queue_service

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


class AssistantQuestion(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    hospital_id: str = Field(examples=["h1"])


@router.post("/ask")
async def ask(payload: AssistantQuestion, db: DB):
    doctors = list(db.doctors.find({"hospital_id": payload.hospital_id}))
    context = {
        "hospital": db.hospitals.find_one({"_id": payload.hospital_id}, {"_id": 0}),
        "doctors": [
            {
                "name": d["name"],
                "specialization": d["specialization"],
                "status": d["status"],
                "fee": d["consultation_fee"],
                "estimated_wait_minutes": queue_service.calculate_wait_time(db, d["_id"])[
                    "estimated_wait_minutes"
                ],
                "next_slot": (d.get("available_slots") or [None])[0],
            }
            for d in doctors
        ],
    }
    answer = await ai_service.answer_assistant_question(payload.question, context)
    return ok({"answer": answer, "disclaimer": settings.DISCLAIMER})
