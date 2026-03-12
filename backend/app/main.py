from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import frota, manutencao, abastecimento, gastos, alertas, relatorios, usuarios
from app.database import engine, Base
from app.config import CORS_ORIGINS
from app.services.sheet_sync import start_sync_task


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    
    # Iniciar sincronização Google Sheets
    sync_task = asyncio.create_task(start_sync_task())
    
    yield
    
    # Cleanup ao desligar
    sync_task.cancel()


app = FastAPI(
    lifespan=lifespan,
    title="MOTOMEC 17º GB - Sistema de Gestão de Frota",
    description="API para gerenciamento da frota do 17º Grupamento de Bombeiros",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(frota.router, prefix="/api/frota", tags=["Frota"])
app.include_router(manutencao.router, prefix="/api/manutencao", tags=["Manutenção"])
app.include_router(abastecimento.router, prefix="/api/abastecimento", tags=["Abastecimento"])
app.include_router(gastos.router, prefix="/api/gastos", tags=["Gastos"])
app.include_router(alertas.router, prefix="/api/alertas", tags=["Alertas"])
app.include_router(relatorios.router, prefix="/api/relatorios", tags=["Relatórios"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuários"])

@app.get("/")
def root():
    return {"message": "MOTOMEC 17º GB - Sistema de Gestão de Frota v2.0", "status": "online"}

@app.get("/health")
def health():
    return {"status": "healthy"}