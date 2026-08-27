"""Populates MongoDB with a complete, demo-ready hospital dataset.

Run:  python -m app.seed.seed_database
All patient names and clinical details are fictional demo data.
"""
from datetime import datetime, timedelta, timezone

from ..database import ensure_indexes, get_db
from ..models.enums import (
    AppointmentStatus,
    CareCategory,
    DoctorStatus,
    QueueEntryStatus,
    Role,
)
from ..services.screening_content import QUESTIONS, SYMPTOMS
from ..utils.ids import new_id
from ..utils.security import hash_password
from ..config import settings

HOSPITALS = [
    {"_id": "h1", "name": "Mediflow City Hospital", "city": "Ahmedabad", "open_hours": "08:00 - 21:00", "is_open": True},
    {"_id": "h2", "name": "CarePoint Hospital", "city": "Pune", "open_hours": "09:00 - 20:00", "is_open": True},
    {"_id": "h3", "name": "Aarogya Multispeciality", "city": "Surat", "open_hours": "08:30 - 19:30", "is_open": True},
    {"_id": "h4", "name": "LifeBridge Hospital", "city": "Nagpur", "open_hours": "09:00 - 18:00", "is_open": True},
    {"_id": "h5", "name": "Unity Medical Center", "city": "Indore", "open_hours": "10:00 - 17:00", "is_open": False},
]

DEPARTMENT_NAMES = {
    CareCategory.GENERAL_MEDICINE.value: "General Medicine",
    CareCategory.GASTROENTEROLOGY.value: "Gastroenterology",
    CareCategory.GYNECOLOGY.value: "Gynecology",
    CareCategory.PEDIATRICS.value: "Pediatrics",
    CareCategory.NEUROLOGY.value: "Neurology",
}

DOCTORS = [
    ("d1", "Dr. Rajesh Mehta", "General Physician (MBBS)", "h1", "GENERAL_MEDICINE", 12, 400, 8, DoctorStatus.IN_CONSULTATION),
    ("d2", "Dr. Amit Shah", "General Physician (MBBS)", "h1", "GENERAL_MEDICINE", 8, 350, 10, DoctorStatus.AVAILABLE),
    ("d3", "Dr. Priya Desai", "Gynecologist", "h1", "GYNECOLOGY", 14, 700, 14, DoctorStatus.AVAILABLE),
    ("d4", "Dr. Neha Patel", "Gynecologist", "h1", "GYNECOLOGY", 10, 600, 12, DoctorStatus.IN_CONSULTATION),
    ("d5", "Dr. Suresh Patel", "Gastroenterologist", "h1", "GASTROENTEROLOGY", 16, 500, 6, DoctorStatus.AVAILABLE),
    ("d6", "Dr. Ashish Joshi", "Gastroenterologist", "h1", "GASTROENTEROLOGY", 11, 450, 7, DoctorStatus.IN_CONSULTATION),
    ("d7", "Dr. Kavita Mehta", "Pediatrician", "h1", "PEDIATRICS", 13, 550, 6, DoctorStatus.AVAILABLE),
    ("d8", "Dr. Rohan Shah", "Pediatrician", "h1", "PEDIATRICS", 7, 450, 8, DoctorStatus.IN_CONSULTATION),
    ("d9", "Dr. Anjali Desai", "Neurologist", "h1", "NEUROLOGY", 15, 900, 15, DoctorStatus.AVAILABLE),
    ("d10", "Dr. Vivek Shah", "Neurologist", "h1", "NEUROLOGY", 18, 1100, 18, DoctorStatus.ON_BREAK),
    ("d11", "Dr. Meera Kulkarni", "General Physician (MBBS)", "h2", "GENERAL_MEDICINE", 9, 300, 9, DoctorStatus.AVAILABLE),
    ("d12", "Dr. Farhan Qureshi", "Gastroenterologist", "h2", "GASTROENTEROLOGY", 12, 480, 8, DoctorStatus.AVAILABLE),
    ("d13", "Dr. Sneha Rao", "Pediatrician", "h3", "PEDIATRICS", 11, 420, 7, DoctorStatus.AVAILABLE),
    ("d14", "Dr. Karan Bhatt", "Gynecologist", "h4", "GYNECOLOGY", 13, 520, 12, DoctorStatus.AVAILABLE),
]

PATIENT_NAMES = [
    ("Aarav Shah", 34, "male"), ("Ishita Rao", 28, "female"), ("Vikram Nair", 45, "male"),
    ("Riya Menon", 31, "female"), ("Kabir Sethi", 8, "male"), ("Ananya Bose", 26, "female"),
    ("Rehan Khan", 52, "male"), ("Diya Kapoor", 6, "female"), ("Manav Trivedi", 39, "male"),
    ("Sara Iyer", 29, "female"), ("Nikhil Rane", 47, "male"), ("Tara Bhatt", 33, "female"),
    ("Om Prakash", 61, "male"), ("Zoya Mirza", 24, "female"), ("Yash Solanki", 19, "male"),
    ("Naina Gupta", 41, "female"), ("Arjun Pillai", 36, "male"), ("Mira Joshi", 30, "female"),
    ("Dev Malhotra", 55, "male"), ("Pooja Verma", 27, "female"), ("Rahul Sinha", 22, "male"),
    ("Kritika Jain", 35, "female"), ("Aman Kohli", 43, "male"), ("Sneha Dutta", 32, "female"),
]

CONCERNS = ["FEVER", "STOMACH_PAIN", "COUGH", "HEADACHE", "JOINT_PAIN", "GENERAL_CHECKUP"]


def slots(start_minutes: int, count: int, step: int = 20) -> list[str]:
    out = []
    for i in range(count):
        total = start_minutes + i * step
        hour, minute = divmod(total, 60)
        suffix = "PM" if hour >= 12 else "AM"
        display = hour - 12 if hour > 12 else hour
        out.append(f"{display}:{minute:02d} {suffix}")
    return out


def reset(db) -> None:
    for name in (
        "users", "patients", "hospitals", "doctors", "departments", "appointments", "bookings",
        "queues", "counters", "queue_entries", "payments", "screening_questions",
        "screening_sessions", "symptoms", "notifications", "priority_arrivals",
    ):
        db[name].delete_many({})


def seed() -> dict:
    db = get_db()
    reset(db)
    ensure_indexes()
    now = datetime.now(timezone.utc)

    db.hospitals.insert_many(HOSPITALS)

    departments = []
    dept_index: dict[tuple[str, str], str] = {}
    for hospital in HOSPITALS:
        for code, name in DEPARTMENT_NAMES.items():
            dept_id = f"dep_{hospital['_id']}_{code.lower()}"
            dept_index[(hospital["_id"], code)] = dept_id
            departments.append({"_id": dept_id, "hospital_id": hospital["_id"], "code": code, "name": name})
    db.departments.insert_many(departments)

    db.symptoms.insert_many([
        {"_id": s["code"], "label": s["label"], "care_category": s["category"].value} for s in SYMPTOMS
    ])
    db.screening_questions.insert_many([
        {"_id": f"qs_{code}", "symptom": code, "questions": items} for code, items in QUESTIONS.items()
    ])

    doctor_docs = []
    for idx, (did, name, spec, hid, dept, exp, fee, avg, status) in enumerate(DOCTORS):
        doctor_docs.append({
            "_id": did,
            "name": name,
            "specialization": spec,
            "hospital_id": hid,
            "department_id": dept_index[(hid, dept)],
            "experience_years": exp,
            "consultation_fee": fee,
            "average_consultation_minutes": avg,
            "status": status.value,
            "available_slots": slots(15 * 60 + (idx % 4) * 20, 6 + idx % 3),
            "current_queue_count": 0,
            "consultation_started_at": (now - timedelta(minutes=3)).isoformat()
            if status is DoctorStatus.IN_CONSULTATION
            else None,
        })
    db.doctors.insert_many(doctor_docs)
    db.queues.insert_many([
        {"_id": f"que_{d['_id']}", "doctor_id": d["_id"], "hospital_id": d["hospital_id"]}
        for d in doctor_docs
    ])

    password = hash_password(settings.DEMO_PASSWORD)
    users = [
        {"_id": "usr_admin", "email": "admin@demo.com", "password_hash": password, "role": Role.ADMIN.value,
         "name": "Hospital Administrator", "hospital_id": "h1", "created_at": now},
        {"_id": "usr_reception", "email": "reception@demo.com", "password_hash": password,
         "role": Role.RECEPTIONIST.value, "name": "Front Desk", "hospital_id": "h1", "created_at": now},
        {"_id": "usr_patient", "email": "patient@demo.com", "password_hash": password,
         "role": Role.PATIENT.value, "name": "Demo Patient", "hospital_id": "h1", "created_at": now},
    ]
    for did, name, *_rest in DOCTORS:
        users.append({
            "_id": f"usr_{did}", "email": f"{did}@demo.com", "password_hash": password,
            "role": Role.DOCTOR.value, "name": name,
            "hospital_id": next(d["hospital_id"] for d in doctor_docs if d["_id"] == did),
            "doctor_id": did, "created_at": now,
        })
    db.users.insert_many(users)

    patients = []
    for i, (name, age, sex) in enumerate(PATIENT_NAMES):
        patients.append({
            "_id": f"pat_seed{i:02d}", "name": name, "age": age, "sex": sex,
            "height": None, "weight": None, "phone": f"+91 90000{10000 + i}",
            "hospital_id": HOSPITALS[i % 4]["_id"], "created_at": now - timedelta(hours=6 - i % 6),
        })
    db.patients.insert_many(patients)

    per_doctor = {"d1": 6, "d2": 4, "d3": 5, "d4": 7, "d5": 3, "d6": 8, "d7": 2, "d8": 4,
                  "d9": 3, "d10": 2, "d11": 3, "d12": 2, "d13": 3, "d14": 2}
    counters: dict[str, int] = {}
    prefix = {"h1": "A", "h2": "B", "h3": "C", "h4": "D", "h5": "E"}
    entries, appointments, bookings, payments, sessions = [], [], [], [], []
    n = 0

    def token_for(hospital_id: str) -> str:
        counters[hospital_id] = counters.get(hospital_id, 100) + 1
        return f"{prefix[hospital_id]}-{counters[hospital_id]}"

    for doctor in doctor_docs:
        hid = doctor["hospital_id"]
        history = (doctor["experience_years"] % 3) + 2
        for i in range(history):
            patient = patients[n % len(patients)]
            status = QueueEntryStatus.NO_SHOW if n % 11 == 0 else QueueEntryStatus.COMPLETED
            entries.append({
                "_id": new_id("qen"), "queue_id": f"que_{doctor['_id']}", "token": token_for(hid),
                "hospital_id": hid, "doctor_id": doctor["_id"], "patient_id": patient["_id"],
                "appointment_id": None, "priority": False, "status": status.value,
                "source": "reception", "summary": None,
                "created_at": now - timedelta(hours=5, minutes=n * 4),
                "completed_at": now - timedelta(hours=4, minutes=n * 3),
            })
            n += 1
        if doctor["status"] == DoctorStatus.IN_CONSULTATION.value:
            patient = patients[(n + 3) % len(patients)]
            entries.append({
                "_id": new_id("qen"), "queue_id": f"que_{doctor['_id']}", "token": token_for(hid),
                "hospital_id": hid, "doctor_id": doctor["_id"], "patient_id": patient["_id"],
                "appointment_id": None, "priority": False,
                "status": QueueEntryStatus.IN_CONSULTATION.value, "source": "reception",
                "summary": "Reported fever and body pain for two days.",
                "created_at": now - timedelta(minutes=30), "completed_at": None,
            })
            n += 1
        waiting_count = per_doctor.get(doctor["_id"], 2)
        for i in range(waiting_count):
            patient = patients[(n + 5) % len(patients)]
            concern = CONCERNS[n % len(CONCERNS)]
            entries.append({
                "_id": new_id("qen"), "queue_id": f"que_{doctor['_id']}", "token": token_for(hid),
                "hospital_id": hid, "doctor_id": doctor["_id"], "patient_id": patient["_id"],
                "appointment_id": None, "priority": i == 0 and doctor["_id"] == "d6",
                "status": QueueEntryStatus.WAITING.value,
                "source": "patient-app" if i % 3 == 0 else "reception",
                "summary": f"Reported concern: {concern.replace('_', ' ').title()}.",
                "position": i + 1, "eta": (i + 1) * doctor["average_consultation_minutes"],
                "created_at": now - timedelta(minutes=40 - i * 3), "completed_at": None,
            })
            n += 1
        db.doctors.update_one({"_id": doctor["_id"]}, {"$set": {"current_queue_count": waiting_count}})
        counters.setdefault(hid, 100)

    db.queue_entries.insert_many(entries)
    db.counters.insert_many([
        {"_id": f"counter:{hid}", "seq": value - 100} for hid, value in counters.items()
    ])

    # A few paid bookings so the admin dashboard shows revenue on first load.
    for doctor in doctor_docs[:6]:
        patient = patients[doctor_docs.index(doctor)]
        slot = doctor["available_slots"][0]
        # the slot is taken by this seeded booking, so it is no longer offered
        db.doctors.update_one({"_id": doctor["_id"]}, {"$pull": {"available_slots": slot}})
        appointment_id, booking_id = new_id("apt"), new_id("bkg")
        appointments.append({
            "_id": appointment_id, "patient_id": patient["_id"], "doctor_id": doctor["_id"],
            "hospital_id": doctor["hospital_id"], "slot": slot, "appointment_type": "IN_PERSON",
            "status": AppointmentStatus.CONFIRMED.value, "token": None, "created_at": now - timedelta(hours=1),
        })
        bookings.append({
            "_id": booking_id, "appointment_id": appointment_id, "patient_id": patient["_id"],
            "doctor_id": doctor["_id"], "hospital_id": doctor["hospital_id"], "slot": slot,
            "fee": doctor["consultation_fee"], "paid": True, "active": True,
            "screening_session_id": None, "created_at": now - timedelta(hours=1),
        })
        payments.append({
            "_id": new_id("pay"), "booking_id": booking_id, "amount": doctor["consultation_fee"],
            "transaction_id": f"DEMO-TXN-{45000 + doctor_docs.index(doctor)}", "method": "DEMO_UPI",
            "status": "SUCCESS", "created_at": now - timedelta(hours=1),
        })
        sessions.append({
            "_id": new_id("scr"), "patient_id": patient["_id"], "symptoms": ["FEVER"],
            "free_text": None, "age": patient["age"], "sex": patient["sex"],
            "answers": {"duration": "1-2 days", "chills": True, "cough": False, "severity": 5},
            "urgency": "ROUTINE", "care_categories": ["GENERAL_MEDICINE"],
            "emergency_signs": [],
            "summary": {
                "patient_summary": "Matched to General Medicine based on your answers.",
                "doctor_summary": "Fever for 1-2 days with chills; severity 5/10; no emergency signs reported.",
            },
            "completed": True, "created_at": now - timedelta(hours=1),
        })
    db.appointments.insert_many(appointments)
    db.bookings.insert_many(bookings)
    db.payments.insert_many(payments)
    db.screening_sessions.insert_many(sessions)

    summary = {
        "hospitals": db.hospitals.count_documents({}),
        "departments": db.departments.count_documents({}),
        "doctors": db.doctors.count_documents({}),
        "users": db.users.count_documents({}),
        "patients": db.patients.count_documents({}),
        "queue_entries": db.queue_entries.count_documents({}),
        "bookings": db.bookings.count_documents({}),
        "symptoms": db.symptoms.count_documents({}),
    }
    return summary


if __name__ == "__main__":
    result = seed()
    print("Mediflow demo database seeded:")
    for key, value in result.items():
        print(f"  {key:>14}: {value}")
    print(f"\nDemo logins (password: {settings.DEMO_PASSWORD})")
    print("  admin@demo.com | reception@demo.com | d1@demo.com | patient@demo.com")
