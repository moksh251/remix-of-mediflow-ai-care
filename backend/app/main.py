"""Mediflow API — FastAPI application factory."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import ensure_indexes, ping
from .errors import AppError, fail, ok
from .routes import (
    admin,
    assistant,
    auth,
    bookings,
    doctors,
    hospitals,
    notifications,
    patients,
    queue,
    screening,
    staff,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("mediflow")

DESCRIPTION = """
Mediflow — Right Care. Right Doctor. Less Waiting.

Care-navigation and live queue management API for hospitals.

**Medical safety:** Mediflow never diagnoses, never names medicines and never gives
treatment advice. It only suggests the most suitable care category and manages queues.
"""


def create_app() -> FastAPI:
    app = FastAPI(
        title="Mediflow API",
        description=DESCRIPTION,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"https://.*\.lovable\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    for module in (
        auth, hospitals, patients, screening, bookings, queue, staff, doctors, admin,
        notifications, assistant,
    ):
        app.include_router(module.router)

    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content=fail(exc.code, exc.message))

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_request: Request, exc: RequestValidationError):
        first = exc.errors()[0] if exc.errors() else {}
        field = ".".join(str(p) for p in first.get("loc", [])[1:]) or "request"
        return JSONResponse(
            status_code=422,
            content=fail("VALIDATION_ERROR", f"{field}: {first.get('msg', 'Invalid input.')}"),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(_request: Request, exc: StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content=fail("HTTP_ERROR", str(exc.detail)))

    @app.exception_handler(Exception)
    async def unhandled_handler(_request: Request, exc: Exception):  # pragma: no cover
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=fail("INTERNAL_ERROR", "Something went wrong. Please try again."),
        )

    @app.on_event("startup")
    def startup() -> None:
        if ping():
            ensure_indexes()
            logger.info("Connected to MongoDB database '%s'", settings.DATABASE_NAME)
        else:
            logger.warning("MongoDB is not reachable — start MongoDB and restart the API.")

    @app.get("/", tags=["health"])
    def root():
        return ok({
            "service": "Mediflow API",
            "version": "1.0.0",
            "docs": "/docs",
            "disclaimer": settings.DISCLAIMER,
        })

    @app.get("/health", tags=["health"])
    def health():
        return ok({"status": "ok", "database": "up" if ping() else "down", "ai": settings.ai_enabled})

    return app


app = create_app()
