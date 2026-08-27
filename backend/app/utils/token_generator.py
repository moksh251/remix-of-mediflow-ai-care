"""Queue token generation: unique, human friendly, per hospital."""
from pymongo.database import Database

HOSPITAL_PREFIX = {
    "h1": "A", "h2": "B", "h3": "C", "h4": "D", "h5": "E",
}
START_NUMBER = 100


def prefix_for(hospital_id: str) -> str:
    return HOSPITAL_PREFIX.get(hospital_id, hospital_id[:1].upper() or "A")


def next_token(db: Database, hospital_id: str) -> str:
    """Atomically increments a per-hospital counter, then guarantees uniqueness."""
    prefix = prefix_for(hospital_id)
    doc = db.counters.find_one_and_update(
        {"_id": f"counter:{hospital_id}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = int(doc.get("seq", 1)) + START_NUMBER
    token = f"{prefix}-{seq}"
    while db.queue_entries.find_one({"hospital_id": hospital_id, "token": token}):
        seq += 1
        token = f"{prefix}-{seq}"
        db.counters.update_one({"_id": f"counter:{hospital_id}"}, {"$set": {"seq": seq - START_NUMBER}})
    return token
