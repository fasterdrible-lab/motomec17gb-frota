from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Generator
import logging

from config.settings import settings

logger = logging.getLogger(__name__)

# Engine and session are created lazily so the module can be imported
# without a live database connection (useful in tests and CI).
_engine = None
_SessionLocal = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=False,
        )
    return _engine


def _get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())
    return _SessionLocal


# Keep backward-compatible module-level references that resolve lazily.
class _LazySessionLocal:
    """Proxy that behaves like SessionLocal but creates the engine on first use."""

    def __call__(self):
        return _get_session_factory()()


SessionLocal = _LazySessionLocal()


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = _get_session_factory()()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    try:
        from models import vehicle, driver, maintenance  # noqa: F401
        Base.metadata.create_all(bind=_get_engine())
        logger.info("Database tables created successfully.")
    except SQLAlchemyError as exc:
        logger.error("Failed to create database tables: %s", exc)
        raise
