"""Screening session lifecycle: start -> answer -> analysis stored for the doctor."""
from datetime import datetime, timezone

from pymongo.database import Database

from ..errors import Conflict, NotFound
from ..utils.ids import new_id
from ..utils.validators import require_patient
from . import ai_service
from .screening_content import ALWAYS_SAFETY_SCREENED, SYMPTOMS


def list_symptoms() -> list[dict]:
    return [{"code": s["code"], "label": s["label"], "care_category": s["category"].value} for s in SYMPTOMS]


def start_session(
    db: Database, *, patient_id: str, symptoms: list[str], age: int, sex: str, free_text: str | None
) -> dict:
    require_patient(db, patient_id)
    codes = [s.upper() for s in symptoms]
    known = {s["code"] for s in SYMPTOMS}
    unknown = [c for c in codes if c not in known]
    if unknown:
        raise NotFound("SYMPTOM_NOT_FOUND", f"Unknown symptom(s): {', '.join(unknown)}.")
    # Safety-critical symptoms are screened first.
    codes.sort(key=lambda c: c not in ALWAYS_SAFETY_SCREENED)
    session = {
        "_id": new_id("scr"),
        "patient_id": patient_id,
        "symptoms": codes,
        "free_text": free_text,
        "age": age,
        "sex": sex,
        "answers": {},
        "urgency": None,
        "care_categories": [],
        "summary": {},
        "completed": False,
        "created_at": datetime.now(timezone.utc),
    }
    db.screening_sessions.insert_one(session)
    return {
        "screening_session_id": session["_id"],
        "symptoms": codes,
        "questions": ai_service.build_questions(codes),
    }


def get_session(db: Database, session_id: str) -> dict:
    session = db.screening_sessions.find_one({"_id": session_id})
    if not session:
        raise NotFound("SCREENING_NOT_FOUND", "Screening session not found.")
    return session


async def complete_session(db: Database, *, session_id: str, patient_id: str, answers: dict) -> dict:
    session = get_session(db, session_id)
    if session["patient_id"] != patient_id:
        raise Conflict("SCREENING_MISMATCH", "This screening session belongs to a different patient.")
    analysis = await ai_service.analyze_screening(
        symptoms=session["symptoms"],
        answers=answers,
        age=session["age"],
        sex=session["sex"],
        free_text=session.get("free_text"),
    )
    db.screening_sessions.update_one(
        {"_id": session_id},
        {"$set": {
            "answers": answers,
            "urgency": analysis["urgency"],
            "care_categories": analysis["care_categories"],
            "summary": analysis["summary"],
            "emergency_signs": analysis["emergency_signs"],
            "completed": True,
            "completed_at": datetime.now(timezone.utc),
        }},
    )
    return {"screening_session_id": session_id, **analysis}


def serialize(session: dict) -> dict:
    return {
        "id": session["_id"],
        "patient_id": session["patient_id"],
        "symptoms": session["symptoms"],
        "free_text": session.get("free_text"),
        "answers": session.get("answers", {}),
        "urgency": session.get("urgency"),
        "care_categories": session.get("care_categories", []),
        "emergency_signs": session.get("emergency_signs", []),
        "summary": session.get("summary", {}),
        "completed": session.get("completed", False),
        "created_at": session["created_at"],
    }
