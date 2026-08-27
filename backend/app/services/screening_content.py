"""Symptom catalogue, symptom-specific question sets, and red-flag rules.

All content is configuration data: it is stored in MongoDB by the seed script
and read back at runtime, so a hospital can tune it without code changes.
"""
from ..models.enums import CareCategory

SYMPTOMS: list[dict] = [
    {"code": "FEVER", "label": "Fever", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "HEADACHE", "label": "Headache", "category": CareCategory.NEUROLOGY},
    {"code": "STOMACH_PAIN", "label": "Stomach pain", "category": CareCategory.GASTROENTEROLOGY},
    {"code": "VOMITING", "label": "Vomiting", "category": CareCategory.GASTROENTEROLOGY},
    {"code": "COUGH", "label": "Cough / cold", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "BREATHING_DIFFICULTY", "label": "Breathing difficulty", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "CHEST_DISCOMFORT", "label": "Chest discomfort", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "PREGNANCY", "label": "Pregnancy related", "category": CareCategory.GYNECOLOGY},
    {"code": "CHILD_HEALTH", "label": "Child health", "category": CareCategory.PEDIATRICS},
    {"code": "JOINT_PAIN", "label": "Joint / muscle pain", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "SKIN_PROBLEM", "label": "Skin problem", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "EYE_PROBLEM", "label": "Eye problem", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "ENT_PROBLEM", "label": "Ear / nose / throat problem", "category": CareCategory.GENERAL_MEDICINE},
    {"code": "GENERAL_CHECKUP", "label": "General check-up", "category": CareCategory.GENERAL_MEDICINE},
]


def q(key: str, text: str, type_: str, options: list | None = None, red_flag=None) -> dict:
    """red_flag: value (or callable-free comparator dict) that marks an emergency sign."""
    item = {"key": key, "text": text, "type": type_}
    if options:
        item["options"] = options
    if red_flag is not None:
        item["red_flag"] = red_flag
    return item


DURATION_OPTIONS = ["Less than 1 day", "1-2 days", "3-7 days", "More than a week"]
SEVERITY = {"key": "severity", "text": "How severe is it right now (1-10)?", "type": "scale"}

QUESTIONS: dict[str, list[dict]] = {
    "STOMACH_PAIN": [
        q("duration", "How long have you had the stomach pain?", "choice", DURATION_OPTIONS),
        q("location", "Where is the pain mainly located?", "choice",
          ["Upper abdomen", "Around the navel", "Lower abdomen", "Whole abdomen"]),
        SEVERITY,
        q("vomiting", "Have you been vomiting?", "boolean"),
        q("fever", "Do you also have a fever?", "boolean"),
        q("diarrhea", "Do you have diarrhea?", "boolean"),
        q("blood", "Have you noticed blood in your stool or vomit?", "boolean", red_flag=True),
        q("worsening", "Is the pain rapidly getting worse?", "boolean"),
    ],
    "HEADACHE": [
        q("duration", "How long have you had the headache?", "choice", DURATION_OPTIONS),
        SEVERITY,
        q("fever", "Do you also have a fever?", "boolean"),
        q("vomiting", "Any vomiting with the headache?", "boolean"),
        q("vision_changes", "Any changes in your vision?", "boolean", red_flag=True),
        q("head_injury", "Any recent head injury?", "boolean", red_flag=True),
        q("sudden_severe", "Did it start suddenly and very severely (thunderclap)?", "boolean", red_flag=True),
        q("weakness", "Any weakness or numbness in the face, arm or leg?", "boolean", red_flag=True),
        q("speech_difficulty", "Any difficulty speaking?", "boolean", red_flag=True),
    ],
    "FEVER": [
        q("duration", "How long have you had the fever?", "choice", DURATION_OPTIONS),
        q("temperature", "Highest measured temperature (°F), if known", "number"),
        q("chills", "Any chills or shivering?", "boolean"),
        q("cough", "Do you also have a cough?", "boolean"),
        q("vomiting", "Any vomiting?", "boolean"),
        q("body_pain", "Any body pain?", "boolean"),
        q("breathing_difficulty", "Any difficulty breathing?", "boolean", red_flag=True),
        q("rash", "Any skin rash?", "boolean"),
    ],
    "COUGH": [
        q("duration", "How long have you had the cough?", "choice", DURATION_OPTIONS),
        q("fever", "Do you also have a fever?", "boolean"),
        q("breathing_difficulty", "Any difficulty breathing?", "boolean", red_flag=True),
        q("chest_discomfort", "Any chest discomfort?", "boolean"),
        q("phlegm", "Are you bringing up phlegm?", "boolean"),
        q("blood", "Any blood when you cough?", "boolean", red_flag=True),
        SEVERITY,
    ],
    "PREGNANCY": [
        q("pregnancy_week", "Which week of pregnancy are you in?", "number"),
        q("abdominal_pain", "Any abdominal pain?", "boolean"),
        q("bleeding", "Any bleeding?", "boolean", red_flag=True),
        q("contractions", "Are you having contractions?", "boolean"),
        q("fluid_leakage", "Any fluid leakage?", "boolean", red_flag=True),
        q("severe_headache", "Any severe headache?", "boolean", red_flag=True),
        q("vision_changes", "Any changes in vision?", "boolean", red_flag=True),
    ],
    "CHILD_HEALTH": [
        q("child_age", "How old is the child (years)?", "number"),
        q("fever", "Does the child have a fever?", "boolean"),
        q("temperature", "Highest measured temperature (°F), if known", "number"),
        q("duration", "How long have the symptoms lasted?", "choice", DURATION_OPTIONS),
        q("vomiting", "Any vomiting?", "boolean"),
        q("breathing_difficulty", "Any difficulty breathing?", "boolean", red_flag=True),
        q("eating_drinking", "Is the child eating and drinking normally?", "boolean"),
        q("unusual_sleepiness", "Is the child unusually sleepy or hard to wake?", "boolean", red_flag=True),
        q("rash", "Any skin rash?", "boolean"),
    ],
    "CHEST_DISCOMFORT": [
        q("duration", "How long have you had the chest discomfort?", "choice",
          ["Right now / minutes", "Hours", "1-2 days", "Longer"]),
        q("pressure", "Does it feel like pressure, tightness or crushing?", "boolean", red_flag=True),
        q("radiating", "Does it spread to the arm, jaw, neck or back?", "boolean", red_flag=True),
        q("breathing_difficulty", "Any difficulty breathing?", "boolean", red_flag=True),
        q("sweating", "Any cold sweating, nausea or fainting?", "boolean", red_flag=True),
        q("exertion", "Does it worsen with exertion?", "boolean"),
    ],
    "BREATHING_DIFFICULTY": [
        q("duration", "How long have you had breathing difficulty?", "choice",
          ["Right now / minutes", "Hours", "1-2 days", "Longer"]),
        q("at_rest", "Is it present even at rest?", "boolean", red_flag=True),
        q("speaking_difficulty", "Is it hard to speak full sentences?", "boolean", red_flag=True),
        q("blue_lips", "Any bluish lips or fingertips?", "boolean", red_flag=True),
        q("wheezing", "Any wheezing?", "boolean"),
        q("fever", "Any fever?", "boolean"),
    ],
    "VOMITING": [
        q("duration", "How long have you been vomiting?", "choice", DURATION_OPTIONS),
        q("frequency", "How many times in the last 24 hours?", "number"),
        q("blood", "Any blood in the vomit?", "boolean", red_flag=True),
        q("keep_fluids", "Are you able to keep fluids down?", "boolean"),
        q("abdominal_pain", "Any abdominal pain?", "boolean"),
        q("fever", "Any fever?", "boolean"),
    ],
    "JOINT_PAIN": [
        q("duration", "How long have you had joint pain?", "choice", DURATION_OPTIONS),
        SEVERITY,
        q("swelling", "Any swelling or redness?", "boolean"),
        q("injury", "Any recent injury?", "boolean"),
        q("fever", "Any fever?", "boolean"),
        q("movement_limited", "Is movement limited?", "boolean"),
    ],
    "SKIN_PROBLEM": [
        q("duration", "How long have you had the skin problem?", "choice", DURATION_OPTIONS),
        q("itching", "Is it itchy?", "boolean"),
        q("spreading", "Is it spreading quickly?", "boolean"),
        q("fever", "Any fever?", "boolean"),
        q("blistering", "Any blistering or open sores?", "boolean"),
    ],
    "EYE_PROBLEM": [
        q("duration", "How long have you had the eye problem?", "choice", DURATION_OPTIONS),
        q("vision_loss", "Any sudden loss of vision?", "boolean", red_flag=True),
        q("pain", "Any eye pain?", "boolean"),
        q("redness", "Any redness or discharge?", "boolean"),
        q("injury", "Any recent eye injury?", "boolean", red_flag=True),
    ],
    "ENT_PROBLEM": [
        q("duration", "How long have you had the symptoms?", "choice", DURATION_OPTIONS),
        q("area", "Which area is mainly affected?", "choice", ["Ear", "Nose", "Throat"]),
        q("fever", "Any fever?", "boolean"),
        q("swallowing_difficulty", "Any difficulty swallowing or breathing?", "boolean", red_flag=True),
        q("discharge", "Any discharge or bleeding?", "boolean"),
    ],
    "GENERAL_CHECKUP": [
        q("reason", "What is the main reason for the check-up?", "choice",
          ["Routine health check", "Follow-up visit", "Report review", "Medication review"]),
        q("ongoing_symptoms", "Any ongoing symptoms right now?", "boolean"),
        q("chronic_conditions", "Any known chronic conditions?", "boolean"),
    ],
}

# Care-category routing per symptom, in priority order.
CATEGORY_ROUTES: dict[str, list[CareCategory]] = {
    "STOMACH_PAIN": [CareCategory.GASTROENTEROLOGY, CareCategory.GENERAL_MEDICINE],
    "VOMITING": [CareCategory.GASTROENTEROLOGY, CareCategory.GENERAL_MEDICINE],
    "HEADACHE": [CareCategory.NEUROLOGY, CareCategory.GENERAL_MEDICINE],
    "PREGNANCY": [CareCategory.GYNECOLOGY],
    "CHILD_HEALTH": [CareCategory.PEDIATRICS],
    "FEVER": [CareCategory.GENERAL_MEDICINE],
    "COUGH": [CareCategory.GENERAL_MEDICINE],
    "BREATHING_DIFFICULTY": [CareCategory.GENERAL_MEDICINE],
    "CHEST_DISCOMFORT": [CareCategory.GENERAL_MEDICINE],
    "JOINT_PAIN": [CareCategory.GENERAL_MEDICINE],
    "SKIN_PROBLEM": [CareCategory.GENERAL_MEDICINE],
    "EYE_PROBLEM": [CareCategory.GENERAL_MEDICINE],
    "ENT_PROBLEM": [CareCategory.GENERAL_MEDICINE],
    "GENERAL_CHECKUP": [CareCategory.GENERAL_MEDICINE],
}

# Symptoms that are always screened with urgent-care questions first.
ALWAYS_SAFETY_SCREENED = {"CHEST_DISCOMFORT", "BREATHING_DIFFICULTY"}

URGENT_MESSAGE = (
    "Your responses may indicate a potentially urgent situation. Please seek immediate "
    "medical attention or contact the hospital emergency department according to hospital protocol."
)
