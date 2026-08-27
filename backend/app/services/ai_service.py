"""AI integration with a deterministic rule-based fallback.

Safety contract enforced here, never delegated to the model:
  * no diagnosis, no medicine names, no treatment advice;
  * red-flag answers always escalate to URGENT regardless of AI output;
  * care category is decided by rules; AI may only phrase the explanation.
"""
from __future__ import annotations

import json
import logging

import httpx

from ..config import settings
from ..models.enums import CareCategory, Urgency
from .screening_content import CATEGORY_ROUTES, QUESTIONS, URGENT_MESSAGE

logger = logging.getLogger("mediflow.ai")

BANNED_TERMS = [
    "mg", "tablet", "capsule", "syrup", "antibiotic", "paracetamol", "ibuprofen",
    "prescribe", "prescription", "dose", "dosage", "diagnosis", "diagnosed", "you have",
]

SYSTEM_PROMPT = (
    "You are Mediflow's care-navigation assistant for a hospital front desk.\n"
    "STRICT RULES:\n"
    "1. Never provide a diagnosis, disease name, medicine, dosage or treatment advice.\n"
    "2. Only help decide which care category (department) fits and summarise reported symptoms.\n"
    "3. If any emergency sign is present, say the patient should seek immediate medical attention.\n"
    "4. Always neutral, calm, non-alarming, plain language.\n"
    "5. Respond with strict JSON only, no markdown."
)


def _clean(text: str) -> str:
    lowered = text.lower()
    if any(term in lowered for term in BANNED_TERMS):
        return ""
    return text.strip()


def build_questions(symptoms: list[str]) -> list[dict]:
    """Symptom-specific question set, de-duplicated across selected symptoms."""
    seen: set[str] = set()
    out: list[dict] = []
    for code in symptoms:
        for item in QUESTIONS.get(code.upper(), []):
            key = item["key"]
            if key in seen:
                continue
            seen.add(key)
            out.append({**item, "symptom": code.upper()})
    if not out:
        out = [dict(item, symptom="GENERAL_CHECKUP") for item in QUESTIONS["GENERAL_CHECKUP"]]
    return out


def detect_red_flags(symptoms: list[str], answers: dict) -> list[str]:
    flags: list[str] = []
    for item in build_questions(symptoms):
        if "red_flag" not in item:
            continue
        value = answers.get(item["key"])
        if value is True or (isinstance(value, str) and value.strip().lower() == "yes"):
            flags.append(item["text"])
    # Objective thresholds that are red flags regardless of the question set.
    severity = answers.get("severity")
    if isinstance(severity, (int, float)) and severity >= 9:
        flags.append("Very severe pain reported (9-10 out of 10)")
    temperature = answers.get("temperature")
    if isinstance(temperature, (int, float)) and temperature >= 104:
        flags.append("Very high fever reported")
    if answers.get("eating_drinking") is False:
        flags.append("Child is not eating or drinking normally")
    if answers.get("keep_fluids") is False:
        flags.append("Unable to keep fluids down")
    return flags


def determine_urgency(red_flags: list[str], answers: dict) -> Urgency:
    if red_flags:
        return Urgency.URGENT
    severity = answers.get("severity")
    if isinstance(severity, (int, float)) and severity >= 7:
        return Urgency.PRIORITY
    if answers.get("worsening") is True or answers.get("spreading") is True:
        return Urgency.PRIORITY
    if answers.get("duration") == "More than a week":
        return Urgency.PRIORITY
    return Urgency.ROUTINE


def determine_categories(symptoms: list[str], age: int, answers: dict) -> list[str]:
    if age is not None and age < 14:
        return [CareCategory.PEDIATRICS.value, CareCategory.GENERAL_MEDICINE.value]
    ordered: list[str] = []
    for code in symptoms:
        for cat in CATEGORY_ROUTES.get(code.upper(), [CareCategory.GENERAL_MEDICINE]):
            if cat.value not in ordered:
                ordered.append(cat.value)
    return ordered or [CareCategory.GENERAL_MEDICINE.value]


def rule_based_summary(symptoms: list[str], answers: dict, red_flags: list[str]) -> dict:
    reported = []
    for item in build_questions(symptoms):
        value = answers.get(item["key"])
        if value in (None, "", False):
            continue
        reported.append(f"{item['text']} {'Yes' if value is True else value}")
    return {
        "patient_summary": (
            "Based on your answers we have matched you to the most suitable care category. "
            "This is care navigation, not a medical diagnosis."
        ),
        "doctor_summary": "; ".join(reported[:10]) or "No additional details reported.",
        "reported_symptoms": reported,
        "emergency_signs": red_flags,
    }


async def _call_ai(payload: dict) -> dict | None:
    if not settings.ai_enabled:
        return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"{settings.AI_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {settings.AI_API_KEY}"},
                json={
                    "model": settings.AI_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": json.dumps(payload)},
                    ],
                },
            )
        if resp.status_code in (429, 402):
            logger.warning("AI rate/credit limit (%s); using rule-based fallback", resp.status_code)
            return None
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return json.loads(content[content.find("{") : content.rfind("}") + 1])
    except Exception as exc:  # noqa: BLE001 - fallback must never break the flow
        logger.warning("AI call failed (%s); using rule-based fallback", exc)
        return None


async def analyze_screening(
    *, symptoms: list[str], answers: dict, age: int, sex: str, free_text: str | None
) -> dict:
    """Returns the full screening analysis. Rules decide, AI only phrases."""
    red_flags = detect_red_flags(symptoms, answers)
    urgency = determine_urgency(red_flags, answers)
    categories = determine_categories(symptoms, age, answers)
    summary = rule_based_summary(symptoms, answers, red_flags)

    ai = await _call_ai({
        "task": "Summarise the reported symptoms for the patient and for the doctor.",
        "symptoms": symptoms,
        "answers": answers,
        "age": age,
        "sex": sex,
        "free_text": free_text,
        "emergency_signs": red_flags,
        "care_category": categories[0],
        "response_schema": {"patient_summary": "string", "doctor_summary": "string"},
    })
    if ai:
        patient_text = _clean(str(ai.get("patient_summary", "")))
        doctor_text = _clean(str(ai.get("doctor_summary", "")))
        if patient_text:
            summary["patient_summary"] = patient_text
        if doctor_text:
            summary["doctor_summary"] = doctor_text

    return {
        "urgency": urgency.value,
        "care_categories": categories,
        "recommended_category": categories[0],
        "emergency_signs": red_flags,
        "urgent_message": URGENT_MESSAGE if urgency is Urgency.URGENT else None,
        "summary": summary,
        "disclaimer": settings.DISCLAIMER,
        "ai_used": bool(ai),
    }


async def answer_assistant_question(question: str, context: dict) -> str:
    """Ask-Mediflow helper. Answers only about the hospital and the live queue."""
    fallback = (
        "I can help with doctor availability, waiting times, fees and how the queue works. "
        "For anything clinical, please speak to the doctor. " + settings.DISCLAIMER
    )
    ai = await _call_ai({
        "task": "Answer a patient's non-clinical question using only the provided hospital context.",
        "question": question,
        "context": context,
        "response_schema": {"answer": "string"},
    })
    if not ai:
        return fallback
    return _clean(str(ai.get("answer", ""))) or fallback
