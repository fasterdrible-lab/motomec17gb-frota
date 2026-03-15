import logging
import time
from pathlib import Path

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

LOG_DIR = Path(__file__).resolve().parents[3] / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)


def setup_logging(debug: bool = False) -> logging.Logger:
    """Configure root logger to write to both console and a rotating log file.

    Args:
        debug: When True, sets level to DEBUG; otherwise INFO.

    Returns:
        Configured root logger.
    """
    level = logging.DEBUG if debug else logging.INFO
    fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    date_fmt = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(level=level, format=fmt, datefmt=date_fmt)

    file_handler = logging.FileHandler(LOG_DIR / "app.log", encoding="utf-8")
    file_handler.setLevel(level)
    file_handler.setFormatter(logging.Formatter(fmt, datefmt=date_fmt))

    root = logging.getLogger()
    # Avoid duplicate handlers on reload
    if not any(isinstance(h, logging.FileHandler) for h in root.handlers):
        root.addHandler(file_handler)

    return root


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that logs every HTTP request with its duration."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self.logger = logging.getLogger("request")

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        self.logger.info(
            "%s %s -> %s (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response
