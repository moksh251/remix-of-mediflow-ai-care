"""Smart doctor recommendation and care navigation.

Ranking contract: suitability first, then availability, then wait time.
Wait time can never override care-category suitability.
"""
from pymongo.database import Database

from ..config import settings
from ..errors import NotFound
from ..models.enums import DoctorStatus, Urgency
from ..utils.validators import require_hospital
from . import queue_service
from .screening_content import URGENT_MESSAGE

STATUS_SCORE = {
    DoctorStatus.AVAILABLE.value: 40,
    DoctorStatus.IN_CONSULTATION.value: 26,
    DoctorStatus.ON_BREAK.value: 14,
    DoctorStatus.FULLY_BOOKED.value: 4,
    DoctorStatus.OFFLINE.value: 0,
}


def _department_id(db: Database, hospital_id: str, care_category: str) -> str:
    dept = db.departments.find_one({"hospital_id": hospital_id, "code": care_category})
    if not dept:
        raise NotFound(
            "DEPARTMENT_NOT_AVAILABLE",
            "This hospital does not currently offer the suggested care category.",
        )
    return dept["_id"]


def recommend_doctors(
    db: Database, *, hospital_id: str, care_category: str, urgency: Urgency = Urgency.ROUTINE
) -> list[dict]:
    require_hospital(db, hospital_id)
    department_id = _department_id(db, hospital_id, care_category)
    doctors = list(db.doctors.find({"hospital_id": hospital_id, "department_id": department_id}))
    options = []
    for doctor in doctors:
        wait = queue_service.calculate_wait_time(db, doctor["_id"])
        reasons = ["Appropriate specialization for the suggested care category"]
        status = doctor["status"]
        if status == DoctorStatus.AVAILABLE.value:
            reasons.append("Currently available")
        elif status == DoctorStatus.IN_CONSULTATION.value:
            reasons.append("Currently consulting, queue is moving")
        elif status == DoctorStatus.ON_BREAK.value:
            reasons.append("On a short break")
        if doctor["experience_years"] >= 12:
            reasons.append(f"{doctor['experience_years']} years of experience")
        reasons.append(f"About {wait['estimated_wait_minutes']} minutes estimated wait")

        wait_score = max(0.0, 40 - wait["estimated_wait_minutes"] * 0.6)
        slot_score = 10 if doctor.get("available_slots") else 0
        priority_boost = 8 if urgency is not Urgency.ROUTINE and status == DoctorStatus.AVAILABLE.value else 0
        score = (
            STATUS_SCORE.get(status, 0)
            + wait_score
            + slot_score
            + priority_boost
            + doctor["experience_years"] * 0.3
        )
        slots = doctor.get("available_slots", [])
        options.append({
            "doctor": queue_service.serialize_doctor(doctor),
            "patients_ahead": wait["patients_ahead"],
            "estimated_wait_minutes": wait["estimated_wait_minutes"],
            "next_slot": slots[0] if slots else None,
            "score": round(score, 1),
            "reasons": reasons,
            "bookable": status not in (DoctorStatus.OFFLINE.value, DoctorStatus.FULLY_BOOKED.value)
            and bool(slots),
        })
    options.sort(key=lambda o: o["score"], reverse=True)
    return options


def navigate_care(db: Database, *, hospital_id: str, session: dict) -> dict:
    """Turns a completed screening session into a bookable care plan."""
    urgency = Urgency(session.get("urgency") or Urgency.ROUTINE.value)
    categories = session.get("care_categories") or []
    chosen, options, unavailable = None, [], []
    for category in categories:
        try:
            found = recommend_doctors(
                db, hospital_id=hospital_id, care_category=category, urgency=urgency
            )
        except NotFound:
            unavailable.append(category)
            continue
        if found:
            chosen, options = category, found
            break
        unavailable.append(category)
    return {
        "urgency": urgency.value,
        "recommended_category": chosen,
        "alternative_categories": [c for c in categories if c != chosen],
        "unavailable_categories": unavailable,
        "urgent_message": URGENT_MESSAGE if urgency is Urgency.URGENT else None,
        "emergency_signs": session.get("emergency_signs", []),
        "summary": session.get("summary", {}),
        "doctors": options,
        "message": (
            "No doctor in the suggested care category is available at this hospital right now. "
            "Please ask the reception desk for guidance."
            if not options
            else "Doctors ranked by suitability, availability and waiting time."
        ),
        "disclaimer": settings.DISCLAIMER,
    }


def queue_imbalance(db: Database, hospital_id: str) -> list[dict]:
    """Detects load imbalance between doctors of the same department."""
    out = []
    for dept in db.departments.find({"hospital_id": hospital_id}):
        docs = list(db.doctors.find({
            "hospital_id": hospital_id,
            "department_id": dept["_id"],
            "status": {"$ne": DoctorStatus.OFFLINE.value},
        }))
        if len(docs) < 2:
            continue
        waits = sorted(
            (
                {
                    "doctor_id": d["_id"],
                    "name": d["name"],
                    "wait": queue_service.calculate_wait_time(db, d["_id"])["estimated_wait_minutes"],
                }
                for d in docs
            ),
            key=lambda x: x["wait"],
        )
        lightest, busiest = waits[0], waits[-1]
        if busiest["wait"] - lightest["wait"] < 15:
            continue
        out.append({
            "department": dept["name"],
            "department_code": dept["code"],
            "busiest_doctor": busiest["name"],
            "busiest_wait_minutes": busiest["wait"],
            "lightest_doctor": lightest["name"],
            "lightest_wait_minutes": lightest["wait"],
            "suggestion": (
                f"Consider routing new patients to {lightest['name']} to balance the "
                f"{dept['name']} queue."
            ),
        })
    return out
