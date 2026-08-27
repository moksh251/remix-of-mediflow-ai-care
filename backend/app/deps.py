"""Shared FastAPI dependencies: database handle and role-based auth."""
from typing import Annotated, Any

from fastapi import Depends, Header
from pymongo.database import Database

from .database import get_db
from .errors import Forbidden, Unauthorized
from .models.enums import Role
from .utils.security import decode_token


def db_dep() -> Database[dict[str, Any]]:
    return get_db()


DB = Annotated[Database, Depends(db_dep)]


def current_user(
    db: DB, authorization: Annotated[str | None, Header()] = None
) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise Unauthorized("Missing authentication token.")
    payload = decode_token(authorization.split(" ", 1)[1].strip())
    user = db.users.find_one({"_id": payload.get("sub")})
    if not user:
        raise Unauthorized("Account no longer exists.")
    return user


CurrentUser = Annotated[dict, Depends(current_user)]


def require_roles(*roles: Role):
    allowed = {r.value for r in roles}

    def dependency(user: CurrentUser) -> dict:
        if user["role"] not in allowed:
            raise Forbidden("This action requires a different staff role.")
        return user

    return dependency


StaffUser = Annotated[dict, Depends(require_roles(Role.RECEPTIONIST, Role.ADMIN))]
DoctorUser = Annotated[dict, Depends(require_roles(Role.DOCTOR, Role.ADMIN))]
AdminUser = Annotated[dict, Depends(require_roles(Role.ADMIN))]
AnyStaffUser = Annotated[dict, Depends(require_roles(Role.RECEPTIONIST, Role.DOCTOR, Role.ADMIN))]
