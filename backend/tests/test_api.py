import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# Use SQLite in-memory for tests
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


# ── Root / Health ────────────────────────────────────────────

def test_root(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "online"


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


# ── Frota ────────────────────────────────────────────────────

def test_listar_viaturas_vazio(client):
    resp = client.get("/api/frota/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_criar_viatura(client):
    payload = {
        "placa": "ABC-0001",
        "prefixo": "UR-01",
        "modelo": "Sprinter 415",
        "marca": "Mercedes-Benz",
        "ano": 2020,
        "unidade": "1SGB",
        "status": "operando",
        "km_atual": 10000,
        "valor_fipe": 185000,
    }
    resp = client.post("/api/frota/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["placa"] == "ABC-0001"
    assert data["id"] == 1


def test_obter_viatura(client):
    resp = client.get("/api/frota/1")
    assert resp.status_code == 200
    assert resp.json()["placa"] == "ABC-0001"


def test_obter_viatura_nao_encontrada(client):
    resp = client.get("/api/frota/9999")
    assert resp.status_code == 404


def test_atualizar_viatura(client):
    resp = client.put("/api/frota/1", json={"km_atual": 12000})
    assert resp.status_code == 200
    assert resp.json()["km_atual"] == 12000


def test_deletar_viatura(client):
    resp = client.delete("/api/frota/1")
    assert resp.status_code == 204


# ── Manutenção ───────────────────────────────────────────────

def test_criar_viatura_para_manutencao(client):
    payload = {
        "placa": "MNT-0001",
        "prefixo": "AB-02",
        "modelo": "CB 500",
        "marca": "Honda",
        "ano": 2021,
        "unidade": "1SGB",
        "status": "operando",
        "km_atual": 5000,
        "valor_fipe": 28000,
    }
    resp = client.post("/api/frota/", json=payload)
    assert resp.status_code == 201


def test_registrar_manutencao(client):
    payload = {
        "viatura_id": 2,
        "tipo": "troca_oleo",
        "km_proximo": 15000,
        "status": "pendente",
        "responsavel": "Sgt Silva",
    }
    resp = client.post("/api/manutencao/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["tipo"] == "troca_oleo"


def test_listar_manutencoes_pendentes(client):
    resp = client.get("/api/manutencao/pendentes")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


# ── Abastecimento ────────────────────────────────────────────

def test_registrar_abastecimento(client):
    payload = {
        "viatura_id": 2,
        "km": 5100,
        "quantidade_litros": 12.5,
        "valor_total": 75.0,
        "preco_litro": 6.0,
        "responsavel": "Cb Santos",
    }
    resp = client.post("/api/abastecimento/", json=payload)
    assert resp.status_code == 201
    assert resp.json()["quantidade_litros"] == 12.5


def test_listar_abastecimentos(client):
    resp = client.get("/api/abastecimento/")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


# ── Gastos ───────────────────────────────────────────────────

def test_registrar_gasto(client):
    payload = {
        "viatura_id": 2,
        "categoria": "combustivel",
        "descricao": "Abastecimento teste",
        "valor": 75.0,
        "responsavel": "Cb Santos",
    }
    resp = client.post("/api/gastos/", json=payload)
    assert resp.status_code == 201
    assert resp.json()["valor"] == 75.0


def test_gastos_por_viatura(client):
    resp = client.get("/api/gastos/por-viatura")
    assert resp.status_code == 200


# ── Alertas ──────────────────────────────────────────────────

def test_criar_alerta(client):
    payload = {
        "viatura_id": 2,
        "tipo": "manutencao",
        "nivel": "aviso",
        "mensagem": "Troca de óleo próxima",
    }
    resp = client.post("/api/alertas/", json=payload)
    assert resp.status_code == 201
    assert resp.json()["lido"] is False


def test_marcar_alerta_lido(client):
    resp = client.put("/api/alertas/1/marcar-lido")
    assert resp.status_code == 200
    assert resp.json()["lido"] is True


def test_listar_nao_lidos(client):
    resp = client.get("/api/alertas/nao-lidos")
    assert resp.status_code == 200


# ── Relatórios ───────────────────────────────────────────────

def test_frota_status(client):
    resp = client.get("/api/relatorios/frota-status")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_viaturas" in data
    assert "operando" in data


def test_relatorio_mensal(client):
    resp = client.get("/api/relatorios/mensal?ano=2024&mes=1")
    assert resp.status_code == 200
    assert "total_gastos" in resp.json()


def test_relatorio_anual(client):
    resp = client.get("/api/relatorios/anual?ano=2024")
    assert resp.status_code == 200


# ── Usuários ─────────────────────────────────────────────────

def test_criar_usuario(client):
    payload = {
        "nome": "Admin Teste",
        "email": "admin.teste@17gb.com",
        "password": "senha123",
        "role": "admin",
        "unidade": "1SGB",
    }
    resp = client.post("/api/usuarios/", json=payload)
    assert resp.status_code == 201
    assert resp.json()["email"] == "admin.teste@17gb.com"


def test_criar_usuario_email_duplicado(client):
    payload = {
        "nome": "Admin Duplicado",
        "email": "admin.teste@17gb.com",
        "password": "outrasenha",
    }
    resp = client.post("/api/usuarios/", json=payload)
    assert resp.status_code == 400


def test_listar_usuarios(client):
    resp = client.get("/api/usuarios/")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
