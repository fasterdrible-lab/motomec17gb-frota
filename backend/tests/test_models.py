"""Unit tests for SQLAlchemy models."""
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.frota import Viatura
from app.models.manutencao import Manutencao

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


# ---------------------------------------------------------------------------
# Viatura model tests
# ---------------------------------------------------------------------------

class TestViaturaModel:
    def test_create_viatura(self, db):
        v = Viatura(
            placa="MDL1A23",
            prefixo="ABS-MDL",
            modelo="Auto Bomba Simples",
            marca="Mercedes-Benz",
            ano=2022,
            unidade="1SGB",
            status="operacional",
            km_atual=5000,
        )
        db.add(v)
        db.commit()
        db.refresh(v)
        assert v.id is not None
        assert v.placa == "MDL1A23"
        assert v.status == "operacional"

    def test_default_km_zero(self, db):
        v = Viatura(
            placa="MDL2A23",
            prefixo="VO-MDL",
            modelo="Viatura",
            marca="Ford",
            ano=2021,
            unidade="2SGB",
        )
        db.add(v)
        db.commit()
        db.refresh(v)
        assert v.km_atual == 0
        assert v.status == "operacional"

    def test_unique_placa_constraint(self, db):
        v1 = Viatura(placa="DUP1A23", prefixo="VO-DUP1", modelo="M", marca="F", ano=2020, unidade="1SGB")
        v2 = Viatura(placa="DUP1A23", prefixo="VO-DUP2", modelo="M", marca="F", ano=2020, unidade="2SGB")
        db.add(v1)
        db.commit()
        db.add(v2)
        with pytest.raises(Exception):
            db.commit()
        db.rollback()


# ---------------------------------------------------------------------------
# Manutencao model tests
# ---------------------------------------------------------------------------

class TestManutencaoModel:
    def _viatura(self, db) -> Viatura:
        v = Viatura(
            placa="MNT1A23",
            prefixo="ABS-MNT",
            modelo="Auto Bomba",
            marca="MB",
            ano=2020,
            unidade="1SGB",
        )
        db.add(v)
        db.commit()
        db.refresh(v)
        return v

    def test_create_manutencao(self, db):
        v = self._viatura(db)
        m = Manutencao(
            viatura_id=v.id,
            tipo="oleo",
            data_proximo=date(2025, 12, 31),
            status="pendente",
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        assert m.id is not None
        assert m.viatura_id == v.id
        assert m.tipo == "oleo"

    def test_manutencao_default_status(self, db):
        v = self._viatura(db)
        m = Manutencao(viatura_id=v.id, tipo="geral")
        db.add(m)
        db.commit()
        db.refresh(m)
        assert m.status == "pendente"

    def test_relationship_viatura_manutencoes(self, db):
        v = self._viatura(db)
        m1 = Manutencao(viatura_id=v.id, tipo="oleo")
        m2 = Manutencao(viatura_id=v.id, tipo="pneu")
        db.add_all([m1, m2])
        db.commit()
        db.refresh(v)
        assert len(v.manutencoes) == 2
