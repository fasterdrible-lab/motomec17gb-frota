import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware.logging import RequestLoggingMiddleware, setup_logging
from app.api import frota, manutencao, abastecimento, gastos, alertas, relatorios, usuarios

# Initialise logging before anything else
setup_logging(debug=settings.DEBUG)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    logger.info("=" * 60)
    logger.info("🚒 SISTEMA DE GESTÃO DE FROTA — 17º GB")
    logger.info("   Iniciando servidor FastAPI...")
    logger.info("=" * 60)
    logger.info("GOOGLE_SHEETS_ID : %s", settings.GOOGLE_SHEETS_ID)
    logger.info("DEBUG            : %s", settings.DEBUG)
    yield
    logger.info("🛑 Servidor encerrado")


app = FastAPI(
    title="Sistema de Gestão de Frota — 17º GB",
    description=(
        "API REST para o Sistema de Gestão de Frota do 17º Grupamento de Bombeiros (SP). "
        "Gerencia 57 viaturas de emergência com controle de manutenção, abastecimento, "
        "gastos e alertas integrados ao Google Sheets e Telegram."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Contate o administrador."},
    )


# ---------------------------------------------------------------------------
# Health endpoints
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Health"])
def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "service": "motomec17gb-frota"}


@app.get("/status", tags=["Health"])
def status_check():
    """Detailed readiness probe."""
    return {
        "status": "running",
        "service": "motomec17gb-frota",
        "version": "1.0.0",
        "debug": settings.DEBUG,
        "google_sheets_id": settings.GOOGLE_SHEETS_ID,
    }


# ---------------------------------------------------------------------------
# API routers
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"

app.include_router(frota.router, prefix=API_PREFIX)
app.include_router(manutencao.router, prefix=API_PREFIX)
app.include_router(abastecimento.router, prefix=API_PREFIX)
app.include_router(gastos.router, prefix=API_PREFIX)
app.include_router(alertas.router, prefix=API_PREFIX)
app.include_router(relatorios.router, prefix=API_PREFIX)
app.include_router(usuarios.router, prefix=API_PREFIX)
