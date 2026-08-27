"""Application errors and consistent API envelopes."""
from typing import Any


class AppError(Exception):
    status_code = 400

    def __init__(self, code: str, message: str, status_code: int | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class NotFound(AppError):
    status_code = 404

    def __init__(self, code: str, message: str):
        super().__init__(code, message, 404)


class Conflict(AppError):
    status_code = 409

    def __init__(self, code: str, message: str):
        super().__init__(code, message, 409)


class Unauthorized(AppError):
    status_code = 401

    def __init__(self, message: str = "Authentication failed."):
        super().__init__("AUTH_FAILED", message, 401)


class Forbidden(AppError):
    status_code = 403

    def __init__(self, message: str = "You do not have access to this resource."):
        super().__init__("FORBIDDEN", message, 403)


def ok(data: Any, message: str = "OK") -> dict[str, Any]:
    return {"success": True, "data": data, "message": message}


def fail(code: str, message: str) -> dict[str, Any]:
    return {"success": False, "error": {"code": code, "message": message}}
