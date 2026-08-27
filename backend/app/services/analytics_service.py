"""Admin analytics computed from live collections."""
from collections import Counter

from pymongo.database import Database

from ..models.enums import DoctorStatus, QueueEntryStatus
from . import queue_service
from .recommendation_service import queue_imbalance


def hospital_overview(db: Database, hospital_id: str) -> dict:
    doctors = list(db.doctors.find({"hospital_id": hospital_id}))
    entries = list(db.queue_entries.find({"hospital_id": hospital_id}))
    counts = Counter(e["status"] for e in entries)
    waits = [queue_service.calculate_wait_time(db, d["_id"])["estimated_wait_minutes"] for d in doctors]
    bookings = list(db.bookings.find({"hospital_id": hospital_id, "active": True}))
    revenue = sum(b["fee"] for b in bookings if b.get("paid"))
    total_seen = counts[QueueEntryStatus.COMPLETED.value]
    no_shows = counts[QueueEntryStatus.NO_SHOW.value]
    handled = total_seen + no_shows
    return {
        "hospital_id": hospital_id,
        "total_doctors": len(doctors),
        "doctors_available": sum(1 for d in doctors if d["status"] == DoctorStatus.AVAILABLE.value),
        "patients_waiting": counts[QueueEntryStatus.WAITING.value],
        "in_consultation": counts[QueueEntryStatus.IN_CONSULTATION.value],
        "patients_completed": total_seen,
        "no_shows": no_shows,
        "no_show_rate": round(no_shows / handled * 100, 1) if handled else 0.0,
        "average_wait_minutes": round(sum(waits) / len(waits)) if waits else 0,
        "bookings": len(bookings),
        "revenue": revenue,
    }


def department_load(db: Database, hospital_id: str) -> list[dict]:
    out = []
    for dept in db.departments.find({"hospital_id": hospital_id}):
        docs = list(db.doctors.find({"hospital_id": hospital_id, "department_id": dept["_id"]}))
        waiting = sum(
            db.queue_entries.count_documents(
                {"doctor_id": d["_id"], "status": QueueEntryStatus.WAITING.value}
            )
            for d in docs
        )
        waits = [queue_service.calculate_wait_time(db, d["_id"])["estimated_wait_minutes"] for d in docs]
        out.append({
            "department": dept["name"],
            "department_code": dept["code"],
            "doctors": len(docs),
            "patients_waiting": waiting,
            "average_wait_minutes": round(sum(waits) / len(waits)) if waits else 0,
        })
    return sorted(out, key=lambda d: d["patients_waiting"], reverse=True)


def doctor_utilization(db: Database, hospital_id: str) -> list[dict]:
    out = []
    for doctor in db.doctors.find({"hospital_id": hospital_id}):
        completed = db.queue_entries.count_documents(
            {"doctor_id": doctor["_id"], "status": QueueEntryStatus.COMPLETED.value}
        )
        waiting = db.queue_entries.count_documents(
            {"doctor_id": doctor["_id"], "status": QueueEntryStatus.WAITING.value}
        )
        out.append({
            "doctor_id": doctor["_id"],
            "name": doctor["name"],
            "status": doctor["status"],
            "consultations_completed": completed,
            "patients_waiting": waiting,
            "minutes_consulting": completed * doctor["average_consultation_minutes"],
            "estimated_wait_minutes": queue_service.calculate_wait_time(db, doctor["_id"])[
                "estimated_wait_minutes"
            ],
        })
    return sorted(out, key=lambda d: d["consultations_completed"], reverse=True)


def peak_hours(db: Database, hospital_id: str) -> list[dict]:
    buckets: Counter[int] = Counter()
    for entry in db.queue_entries.find({"hospital_id": hospital_id}, {"created_at": 1}):
        buckets[entry["created_at"].hour] += 1
    return [{"hour": f"{h:02d}:00", "patients": buckets[h]} for h in sorted(buckets)]


def load_balancing(db: Database, hospital_id: str) -> list[dict]:
    return queue_imbalance(db, hospital_id)
