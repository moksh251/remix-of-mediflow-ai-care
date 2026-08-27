"""Hospital admin analytics."""
from fastapi import APIRouter

from ..deps import DB, AdminUser
from ..errors import ok
from ..services import analytics_service
from ..utils.validators import require_hospital

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/{hospital_id}/overview")
def overview(hospital_id: str, db: DB, _user: AdminUser):
    require_hospital(db, hospital_id)
    return ok(analytics_service.hospital_overview(db, hospital_id))


@router.get("/{hospital_id}/departments")
def departments(hospital_id: str, db: DB, _user: AdminUser):
    require_hospital(db, hospital_id)
    return ok(analytics_service.department_load(db, hospital_id))


@router.get("/{hospital_id}/doctors")
def doctors(hospital_id: str, db: DB, _user: AdminUser):
    require_hospital(db, hospital_id)
    return ok(analytics_service.doctor_utilization(db, hospital_id))


@router.get("/{hospital_id}/peak-hours")
def peak_hours(hospital_id: str, db: DB, _user: AdminUser):
    require_hospital(db, hospital_id)
    return ok(analytics_service.peak_hours(db, hospital_id))


@router.get("/{hospital_id}/load-balancing")
def load_balancing(hospital_id: str, db: DB, _user: AdminUser):
    require_hospital(db, hospital_id)
    return ok(analytics_service.load_balancing(db, hospital_id))
