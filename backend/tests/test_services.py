"""Unit tests for service-layer business logic."""
from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.frota import Viatura
from app.models.manutencao import Manutencao
from app.models.gastos import Gasto
from app.models.alertas import Alerta
from app.services.manutencao_service import ManutencaoService
from app.services.gastos_service import GastosService
from app.services.alertas_service import AlertasService

# ---------------------------------------------------------------------------
# In-memory DB
# ---------------------------------------------------------------------------
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def viatura(db):
    v = Viatura(
        placa="TST1A23",
        prefixo="VO-TEST",
        modelo="Viatura de Ocorrência",
        marca="Ford",
        ano=2020,
        valor_fipe=100000.0,
        unidade="1SGB",
        status="operacional",
        km_atual=40000,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


# ---------------------------------------------------------------------------
# ManutencaoService tests
# ---------------------------------------------------------------------------

class TestManutencaoServiceCalcStatus:
    service = ManutencaoService()

    def test_status_vencida_por_data(self, db, viatura):
        m = Manutencao(
            viatura_id=viatura.id,
            tipo="oleo",
            data_proximo=date.today() - timedelta(days=1),
            status="pendente",
        )
        db.add(m)
        db.commit()
        assert self.service.calcular_status(m, viatura.km_atual) == "vencida"

    def test_status_vencida_por_km(self, db, viatura):
        m = Manutencao(
            viatura_id=viatura.id,
            tipo="pneu",
            km_proximo=viatura.km_atual - 100,
            status="pendente",
        )
        db.add(m)
        db.commit()
        assert self.service.calcular_status(m, viatura.km_atual) == "vencida"

    def test_status_pendente_por_data(self, db, viatura):
        m = Manutencao(
            viatura_id=viatura.id,
            tipo="bateria",
            data_proximo=date.today() + timedelta(days=3),
            status="pendente",
        )
        db.add(m)
        db.commit()
        assert self.service.calcular_status(m, viatura.km_atual) == "pendente"

    def test_status_em_dia(self, db, viatura):
        m = Manutencao(
            viatura_id=viatura.id,
            tipo="inspecao",
            data_proximo=date.today() + timedelta(days=60),
            status="pendente",
        )
        db.add(m)
        db.commit()
        assert self.service.calcular_status(m, viatura.km_atual) == "em_dia"


# ---------------------------------------------------------------------------
# GastosService tests
# ---------------------------------------------------------------------------

class TestGastosServicePercentualFipe:
    service = GastosService()

    def test_percentual_zero_sem_gastos(self, db, viatura):
        pct = self.service.calcular_percentual_fipe(db, viatura.id)
        assert pct == 0.0

    def test_percentual_calculado(self, db, viatura):
        g = Gasto(
            viatura_id=viatura.id,
            categoria="manutencao",
            descricao="Revisão",
            data=date.today(),
            valor=50000.0,
        )
        db.add(g)
        db.commit()
        pct = self.service.calcular_percentual_fipe(db, viatura.id)
        assert pct == 50.0

    def test_percentual_sem_valor_fipe(self, db):
        v2 = Viatura(
            placa="TST2A23",
            prefixo="VO-T2",
            modelo="Modelo",
            marca="Marca",
            ano=2021,
            valor_fipe=None,
            unidade="Admin",
        )
        db.add(v2)
        db.commit()
        pct = self.service.calcular_percentual_fipe(db, v2.id)
        assert pct == 0.0


# ---------------------------------------------------------------------------
# AlertasService tests
# ---------------------------------------------------------------------------

class TestAlertasServiceGerArCriticos:
    service = AlertasService()

    def test_sem_alertas_criticos(self, db):
        result = self.service.gerar_alertas_criticos(db)
        assert result == []

    def test_retorna_alertas_criticos(self, db, viatura):
        a = Alerta(
            viatura_id=viatura.id,
            tipo_alerta="critico",
            mensagem="Bateria vencida",
            status="ativo",
        )
        db.add(a)
        db.commit()
        result = self.service.gerar_alertas_criticos(db)
        assert len(result) == 1
        assert result[0].tipo_alerta == "critico"

    def test_nao_retorna_alertas_nao_criticos(self, db, viatura):
        a = Alerta(
            viatura_id=viatura.id,
            tipo_alerta="aviso",
            mensagem="Aviso",
            status="ativo",
        )
        db.add(a)
        db.commit()
        result = self.service.gerar_alertas_criticos(db)
        assert result == []
