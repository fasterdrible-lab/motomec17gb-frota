"""API integration tests using FastAPI TestClient and an in-memory SQLite database."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# ---------------------------------------------------------------------------
# Test database setup (SQLite in-memory)
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def viatura_payload():
    return {
        "placa": "ABC1D23",
        "prefixo": "VO-17101",
        "modelo": "Viatura de Ocorrência",
        "marca": "Ford",
        "ano": 2021,
        "unidade": "1SGB",
        "status": "operacional",
        "km_atual": 10000,
    }


# ---------------------------------------------------------------------------
# Health endpoints
# ---------------------------------------------------------------------------

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_status(client):
    response = client.get("/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert "version" in data


# ---------------------------------------------------------------------------
# Frota endpoints
# ---------------------------------------------------------------------------

def test_list_viaturas_empty(client):
    response = client.get("/api/v1/frota/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_viatura(client, viatura_payload):
    response = client.post("/api/v1/frota/", json=viatura_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["placa"] == viatura_payload["placa"]
    assert data["prefixo"] == viatura_payload["prefixo"]
    assert "id" in data


def test_create_viatura_duplicate_placa(client, viatura_payload):
    client.post("/api/v1/frota/", json=viatura_payload)
    response = client.post("/api/v1/frota/", json=viatura_payload)
    assert response.status_code == 409


def test_get_viatura(client, viatura_payload):
    created = client.post("/api/v1/frota/", json=viatura_payload).json()
    response = client.get(f"/api/v1/frota/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_viatura_not_found(client):
    response = client.get("/api/v1/frota/9999")
    assert response.status_code == 404


def test_update_viatura(client, viatura_payload):
    created = client.post("/api/v1/frota/", json=viatura_payload).json()
    response = client.put(f"/api/v1/frota/{created['id']}", json={"status": "manutencao"})
    assert response.status_code == 200
    assert response.json()["status"] == "manutencao"


def test_delete_viatura(client, viatura_payload):
    created = client.post("/api/v1/frota/", json=viatura_payload).json()
    response = client.delete(f"/api/v1/frota/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/api/v1/frota/{created['id']}").status_code == 404


# ---------------------------------------------------------------------------
# Alertas endpoints
# ---------------------------------------------------------------------------

def test_list_alertas_empty(client):
    response = client.get("/api/v1/alertas/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_alerta(client):
    payload = {"tipo_alerta": "aviso", "mensagem": "Teste de alerta", "status": "ativo"}
    response = client.post("/api/v1/alertas/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["mensagem"] == payload["mensagem"]
    assert data["lido"] is False


def test_marcar_alerta_como_lido(client):
    created = client.post(
        "/api/v1/alertas/", json={"tipo_alerta": "info", "mensagem": "Test"}
    ).json()
    response = client.put(f"/api/v1/alertas/{created['id']}/ler")
    assert response.status_code == 200
    assert response.json()["lido"] is True


def test_resolver_alerta(client):
    created = client.post(
        "/api/v1/alertas/", json={"tipo_alerta": "urgente", "mensagem": "Urgente"}
    ).json()
    response = client.put(f"/api/v1/alertas/{created['id']}/resolver")
    assert response.status_code == 200
    assert response.json()["status"] == "resolvido"
