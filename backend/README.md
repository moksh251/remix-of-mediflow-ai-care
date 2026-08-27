# Mediflow Backend — FastAPI + MongoDB

**Right Care. Right Doctor. Less Waiting.**

Care-navigation and live queue-management API for hospitals.

> **Medical safety:** Mediflow never diagnoses, never names medicines and never gives
> treatment advice. It suggests the most suitable **care category**, flags emergency
> signs, and manages queues. Every clinical response carries a disclaimer.

## Quick start

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set MONGODB_URI, JWT_SECRET, AI_API_KEY (optional)
python -m app.seed.seed_database
python run.py                   # http://localhost:8000/docs
```

MongoDB must be running (local `mongodb://localhost:27017` or an Atlas URI).
`AI_API_KEY` is optional — without it the screening engine runs fully on its
deterministic rule-based fallback.

## Demo logins

Password for all demo accounts: `mediflow123`

| Role | Email |
| --- | --- |
| Admin | `admin@demo.com` |
| Receptionist | `reception@demo.com` |
| Doctor | `d1@demo.com` … `d14@demo.com` |
| Patient | `patient@demo.com` |

## Architecture

```
app/
  config.py       settings           database.py   Mongo client + indexes
  errors.py       error envelope     deps.py       DB + JWT role dependencies
  models/         document models    schemas/      request/response validation
  services/       business logic     routes/       HTTP layer
  seed/           demo dataset
```

Every response uses one envelope:

```json
{ "success": true, "data": { }, "message": "OK" }
{ "success": false, "error": { "code": "SLOT_UNAVAILABLE", "message": "…" } }
```

## Core engines

**Screening** (`services/ai_service.py`, `screening_content.py`)
Symptom-specific question sets for 14 concerns. Rules — never the model — decide
urgency and care category; red-flag answers always escalate to `URGENT`. The AI layer
only rephrases summaries and its output is filtered for banned clinical terms.

**Queue** (`services/queue_service.py`)
`wait = patients ahead x average consultation duration + remaining current consult +
doctor-status overhead`. Priority patients sort ahead; positions and ETAs are
recalculated on every state change and every affected patient is notified.

**Recommendation** (`services/recommendation_service.py`)
Suitability first, then availability, then wait time — wait time can never override
care-category suitability. Also detects queue imbalance between doctors of a department.

## Endpoints

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Directory | `GET /api/hospitals`, `/api/hospitals/{id}/departments`, `/api/doctors`, `/api/doctors/{id}` |
| Patients | `POST /api/patients`, `GET/PATCH /api/patients/{id}`, `/{id}/appointments`, `/{id}/queue` |
| Screening | `GET /api/symptoms`, `GET /api/screening/questions`, `POST /api/screening/start`, `POST /api/screening/complete` |
| Navigation | `POST /api/recommendations/care-navigation`, `POST /api/recommendations/doctors` |
| Booking | `POST /api/appointments`, `POST /api/bookings`, `DELETE /api/bookings/{id}` |
| Payments | `POST /api/payments/demo`, `GET /api/payments/{booking_id}/receipt` (simulated only) |
| Queue | `POST /api/queue/join`, `/token`, `GET /api/queue/track/{token}`, `POST /api/queue/{doctor_id}/start|complete|pause|resume` |
| Reception | `POST /api/staff/patients`, `/arrival`, `/no-show`, `/priority-arrival`, `GET /api/staff/queues/{hospital_id}` |
| Doctor | `GET /api/doctor/{id}/dashboard`, `/{id}/patients/{patient_id}/summary` |
| Admin | `GET /api/admin/{hospital_id}/overview|departments|doctors|peak-hours|load-balancing` |
| Assistant | `POST /api/assistant/ask` |

Interactive documentation: `/docs` (Swagger) and `/redoc`.

## Notes

- Payments are **simulated**: no gateway, no card data, transaction IDs are `DEMO-TXN-…`.
- All seeded patients, doctors and clinical details are fictional demo data.
- Role guards: reception endpoints need `RECEPTIONIST`/`ADMIN`, consultation control needs
  `DOCTOR`/`ADMIN`, analytics need `ADMIN`.
