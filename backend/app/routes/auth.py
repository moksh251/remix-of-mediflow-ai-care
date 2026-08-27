"""Authentication: register, login, profile."""
from fastapi import APIRouter

from ..deps import DB, CurrentUser
from ..errors import Conflict, Unauthorized, ok
from ..models.enums import Role
from ..schemas.auth import LoginRequest, RegisterRequest
from ..utils.ids import new_id
from ..utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _public(user: dict) -> dict:
    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "hospital_id": user.get("hospital_id"),
        "doctor_id": user.get("doctor_id"),
        "patient_id": user.get("patient_id"),
    }


@router.post("/register")
def register(payload: RegisterRequest, db: DB):
    if db.users.find_one({"email": payload.email.lower()}):
        raise Conflict("EMAIL_TAKEN", "An account with this email already exists.")
    user = {
        "_id": new_id("usr"),
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "role": payload.role.value,
        "name": payload.name,
        "hospital_id": payload.hospital_id,
    }
    db.users.insert_one(user)
    token = create_access_token(user["_id"], user["role"], {"name": user["name"]})
    return ok({"access_token": token, "token_type": "bearer", "user": _public(user)}, "Account created.")


@router.post("/login")
def login(payload: LoginRequest, db: DB):
    user = db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise Unauthorized("Incorrect email or password.")
    token = create_access_token(user["_id"], user["role"], {"name": user["name"]})
    return ok({"access_token": token, "token_type": "bearer", "user": _public(user)}, "Signed in.")


@router.get("/me")
def me(user: CurrentUser):
    return ok(_public(user))


@router.get("/roles")
def roles():
    return ok([r.value for r in Role])
