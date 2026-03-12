import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from app.services.manutencao_service import ManutencaoService
from app.services.alertas_service import AlertasService
from app.services.gastos_service import GastosService
from app.services.relatorio_service import RelatorioService
from app.models.manutencao import TipoManutencao, StatusManutencao
from app.models.frota import StatusViatura
from app.config import LIMITES


# ── Helpers ──────────────────────────────────────────────────

def make_viatura(id=1, prefixo="AB-01", km_atual=10000.0, status=StatusViatura.operando,
                 data_atualizacao=None):
    v = MagicMock()
    v.id = id
    v.prefixo = prefixo
    v.km_atual = km_atual
    v.status = status
    v.data_atualizacao = data_atualizacao or datetime.utcnow()
    v.valor_fipe = 20000.0
    return v


def make_manutencao(tipo=TipoManutencao.troca_oleo, status=StatusManutencao.pendente,
                    km_proximo=None, data_proxima=None):
    m = MagicMock()
    m.tipo = tipo
    m.status = status
    m.km_proximo = km_proximo
    m.data_proxima = data_proxima
    return m


# ── ManutencaoService ─────────────────────────────────────────

class TestManutencaoService:
    def setup_method(self):
        self.db = MagicMock()
        self.service = ManutencaoService(self.db)

    def test_calcular_proxima_troca_oleo(self):
        viatura = make_viatura()
        km_ultima = 5000.0
        data_ultima = datetime.utcnow()
        km_prox, data_prox = self.service.calcular_proxima_manutencao(
            viatura, TipoManutencao.troca_oleo, km_ultima, data_ultima
        )
        assert km_prox == km_ultima + LIMITES["km_troca_oleo"]
        assert data_prox is not None

    def test_calcular_proxima_revisao_freio(self):
        viatura = make_viatura()
        km_ultima = 10000.0
        data_ultima = datetime.utcnow()
        km_prox, data_prox = self.service.calcular_proxima_manutencao(
            viatura, TipoManutencao.revisao_freio, km_ultima, data_ultima
        )
        assert km_prox == km_ultima + LIMITES["km_revisao_freio"]

    def test_calcular_proxima_troca_bateria_sem_km(self):
        viatura = make_viatura()
        data_ultima = datetime.utcnow()
        km_prox, data_prox = self.service.calcular_proxima_manutencao(
            viatura, TipoManutencao.troca_bateria, 0, data_ultima
        )
        assert km_prox is None
        assert data_prox is not None

    def test_calcular_proxima_troca_pneus(self):
        viatura = make_viatura()
        km_ultima = 20000.0
        data_ultima = datetime.utcnow()
        km_prox, data_prox = self.service.calcular_proxima_manutencao(
            viatura, TipoManutencao.troca_pneus, km_ultima, data_ultima
        )
        assert km_prox == km_ultima + LIMITES["km_troca_pneus"]

    def test_calcular_proxima_revisao_geral_sem_data(self):
        viatura = make_viatura()
        km_ultima = 15000.0
        data_ultima = datetime.utcnow()
        km_prox, data_prox = self.service.calcular_proxima_manutencao(
            viatura, TipoManutencao.revisao_geral, km_ultima, data_ultima
        )
        assert km_prox == km_ultima + LIMITES["km_revisao_geral"]
        assert data_prox is None

    def test_verificar_alertas_manutencao_vencida_por_data(self):
        viatura = make_viatura()
        manutencao = make_manutencao(
            data_proxima=datetime.utcnow() - timedelta(days=3)
        )
        self.db.query.return_value.filter.return_value.all.return_value = [manutencao]
        self.service.verificar_e_atualizar_alertas(viatura)
        self.db.add.assert_called_once()
        assert manutencao.status == StatusManutencao.vencida

    def test_verificar_alertas_manutencao_proxima(self):
        viatura = make_viatura()
        manutencao = make_manutencao(
            data_proxima=datetime.utcnow() + timedelta(days=3)
        )
        self.db.query.return_value.filter.return_value.all.return_value = [manutencao]
        self.service.verificar_e_atualizar_alertas(viatura)
        self.db.add.assert_called_once()

    def test_verificar_alertas_manutencao_vencida_por_km(self):
        viatura = make_viatura(km_atual=16000.0)
        manutencao = make_manutencao(km_proximo=15000.0)
        self.db.query.return_value.filter.return_value.all.return_value = [manutencao]
        self.service.verificar_e_atualizar_alertas(viatura)
        self.db.add.assert_called_once()

    def test_skip_manutencao_concluida(self):
        viatura = make_viatura()
        manutencao = make_manutencao(status=StatusManutencao.concluida)
        self.db.query.return_value.filter.return_value.all.return_value = [manutencao]
        self.service.verificar_e_atualizar_alertas(viatura)
        self.db.add.assert_not_called()


# ── AlertasService ────────────────────────────────────────────

class TestAlertasService:
    def setup_method(self):
        self.db = MagicMock()
        self.service = AlertasService(self.db)

    def test_processar_viatura_baixada_critica(self):
        viatura = make_viatura(
            status=StatusViatura.baixada,
            data_atualizacao=datetime.utcnow() - timedelta(days=35)
        )
        self.db.query.return_value.all.return_value = [viatura]
        self.db.query.return_value.filter.return_value.all.return_value = []
        self.service.processar_todos_alertas()
        self.db.add.assert_called()

    def test_processar_viatura_operando_sem_alerta(self):
        viatura = make_viatura(status=StatusViatura.operando)
        self.db.query.return_value.all.return_value = [viatura]
        self.db.query.return_value.filter.return_value.all.return_value = []
        self.service.processar_todos_alertas()
        self.db.add.assert_not_called()

    def test_processar_defeito_antigo(self):
        viatura = make_viatura()
        defeito = MagicMock()
        defeito.tipo = "Motor"
        defeito.data_relato = datetime.utcnow() - timedelta(days=10)
        self.db.query.return_value.all.return_value = [viatura]
        self.db.query.return_value.filter.return_value.all.return_value = [defeito]
        self.service.processar_todos_alertas()
        self.db.add.assert_called()


# ── GastosService ─────────────────────────────────────────────

class TestGastosService:
    def setup_method(self):
        self.db = MagicMock()
        self.service = GastosService(self.db)

    def test_total_por_viatura_sem_registros(self):
        self.db.query.return_value.filter.return_value.scalar.return_value = None
        total = self.service.total_por_viatura(viatura_id=1)
        assert total == 0.0

    def test_total_por_viatura_com_valor(self):
        self.db.query.return_value.filter.return_value.scalar.return_value = 1500.0
        total = self.service.total_por_viatura(viatura_id=1)
        assert total == 1500.0

    def test_percentual_vs_fipe_sem_viatura(self):
        self.db.query.return_value.filter.return_value.first.return_value = None
        pct = self.service.percentual_vs_fipe(viatura_id=99, ano=2024)
        assert pct == 0.0

    def test_percentual_vs_fipe_calculo(self):
        viatura = make_viatura()
        viatura.valor_fipe = 10000.0
        self.db.query.return_value.filter.return_value.first.return_value = viatura
        self.db.query.return_value.filter.return_value.scalar.return_value = 2000.0
        # Patch total_por_viatura directly to control return value
        self.service.total_por_viatura = lambda viatura_id, ano=None: 2000.0
        pct = self.service.percentual_vs_fipe(viatura_id=1, ano=2024)
        # Should be 20% (2000 / 10000 * 100)
        assert pct == pytest.approx(20.0, rel=1e-2)


# ── RelatorioService ──────────────────────────────────────────

class TestRelatorioService:
    def setup_method(self):
        self.db = MagicMock()
        self.service = RelatorioService(self.db)

    def test_gerar_relatorio_completo_retorna_chaves(self):
        # Stub all scalar/count queries
        self.db.query.return_value.scalar.return_value = 0
        self.db.query.return_value.filter.return_value.scalar.return_value = 0
        relatorio = self.service.gerar_relatorio_completo()
        assert "frota" in relatorio
        assert "financeiro" in relatorio
        assert "alertas" in relatorio
        assert "gerado_em" in relatorio
