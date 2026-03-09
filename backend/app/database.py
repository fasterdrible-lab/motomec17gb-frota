from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator

from app.config import settings

Base = declarative_base()

# _engine and _SessionLocal are initialised lazily so that tests can
# override DATABASE_URL before any engine is created.
_engine = None
_SessionLocal = None


def _get_engine():
    """Return (and lazily create) the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        kwargs = {}
        if not settings.DATABASE_URL.startswith("sqlite"):
            kwargs = {"pool_pre_ping": True, "pool_size": 10, "max_overflow": 20}
        else:
            kwargs = {"connect_args": {"check_same_thread": False}}
        _engine = create_engine(settings.DATABASE_URL, **kwargs)
    return _engine


def _get_session_factory():
    """Return (and lazily create) the session factory."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())
    return _SessionLocal


# Convenience aliases used throughout the application
@property  # type: ignore[misc]
def engine():
    return _get_engine()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a SQLAlchemy database session."""
    SessionLocal = _get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
