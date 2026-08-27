"""AI symptom screening and care navigation."""
from fastapi import APIRouter, Query

from ..config import settings
from ..deps import DB
from ..errors import ok
from ..schemas.recommendation import CareNavigationRequest, DoctorRecommendationRequest
from ..schemas.screening import ScreeningCompleteRequest, ScreeningStartRequest
from ..services import ai_service, recommendation_service, screening_service

router = APIRouter(prefix="/api", tags=["screening"])


@router.get("/symptoms")
def symptoms():
    return ok(screening_service.list_symptoms())


@router.get("/screening/questions")
def questions(symptoms: list[str] = Query(default=[])):
    return ok(ai_service.build_questions([s.upper() for s in symptoms]))


@router.post("/screening/start")
def start(payload: ScreeningStartRequest, db: DB):
    data = screening_service.start_session(
        db,
        patient_id=payload.patient_id,
        symptoms=payload.symptoms,
        age=payload.age,
        sex=payload.sex,
        free_text=payload.free_text,
    )
    return ok({**data, "disclaimer": settings.DISCLAIMER}, "Screening started.")


@router.post("/screening/complete")
async def complete(payload: ScreeningCompleteRequest, db: DB):
    data = await screening_service.complete_session(
        db,
        session_id=payload.screening_session_id,
        patient_id=payload.patient_id,
        answers=payload.answers,
    )
    return ok(data, "Screening completed.")


@router.get("/screening/{session_id}")
def get_session(session_id: str, db: DB):
    return ok(screening_service.serialize(screening_service.get_session(db, session_id)))


@router.post("/recommendations/care-navigation")
def care_navigation(payload: CareNavigationRequest, db: DB, hospital_id: str = Query(...)):
    session = screening_service.get_session(db, payload.screening_session_id)
    return ok(recommendation_service.navigate_care(db, hospital_id=hospital_id, session=session))


@router.post("/recommendations/doctors")
def recommend(payload: DoctorRecommendationRequest, db: DB):
    data = recommendation_service.recommend_doctors(
        db,
        hospital_id=payload.hospital_id,
        care_category=payload.care_category,
        urgency=payload.urgency,
    )
    return ok({"doctors": data, "disclaimer": settings.DISCLAIMER})
