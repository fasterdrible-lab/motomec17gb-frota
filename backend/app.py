import logging
import logging.config
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from config.settings import settings
from middleware.cors import setup_cors
from routers import auth, vehicles, drivers, maintenance, fipe, google_sheets


# ── Logging ───────────────────────────────────────────────────────────────────

LOGGING_CONFIG: dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "default",
            "filename": "logs/app.log",
            "maxBytes": 10_485_760,  # 10 MB
            "backupCount": 5,
            "encoding": "utf-8",
        },
    },
    "root": {
        "level": settings.LOG_LEVEL,
        "handlers": ["console", "file"],
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up MotoMec Frota API…")
    try:
        from config.database import create_tables
        create_tables()
        logger.info("Database connection established and tables verified.")
    except Exception as exc:
        logger.error("Database initialisation failed: %s", exc)
    yield
    logger.info("Shutting down MotoMec Frota API.")


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    application = FastAPI(
        title="MotoMec Frota API",
        version="1.0.0",
        description="Fleet management API for MotoMec – vehicles, drivers, maintenance, FIPE and integrations.",
        lifespan=lifespan,
    )

    setup_cors(application)

    application.include_router(auth.router)
    application.include_router(vehicles.router)
    application.include_router(drivers.router)
    application.include_router(maintenance.router)
    application.include_router(fipe.router)
    application.include_router(google_sheets.router)

    # ── Exception handlers ────────────────────────────────────────────────────

    @application.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception for %s %s", request.method, request.url)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. Please try again later."},
        )

    # ── Health check ──────────────────────────────────────────────────────────

    @application.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "version": application.version}

    return application


app = create_app()
