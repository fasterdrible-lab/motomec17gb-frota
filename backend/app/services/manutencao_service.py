from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.frota import Viatura
from app.models.manutencao import ManutencaoPreventiva, StatusManutencao, TipoManutencao
from app.models.alertas import Alerta, TipoAlerta, NivelAlerta
import app.models  # ensure all mappers registered  # noqa: F401
from app.config import LIMITES

class ManutencaoService:
    def __init__(self, db: Session):
        self.db = db

    def verificar_e_atualizar_alertas(self, viatura: Viatura):
        """Verifica manutenções da viatura e cria alertas automaticamente."""
        manutencoes = self.db.query(ManutencaoPreventiva).filter(
            ManutencaoPreventiva.viatura_id == viatura.id
        ).all()

        for m in manutencoes:
            if m.status == StatusManutencao.concluida:
                continue

            nivel = None
            mensagem = None

            # Verificar por data
            if m.data_proxima:
                dias_restantes = (m.data_proxima - datetime.utcnow()).days
                if dias_restantes < 0:
                    nivel = NivelAlerta.critico
                    mensagem = f"[{viatura.prefixo}] {m.tipo.value} VENCIDA há {abs(dias_restantes)} dias"
                    m.status = StatusManutencao.vencida
                elif dias_restantes <= LIMITES["dias_alerta_antecipado"]:
                    nivel = NivelAlerta.aviso
                    mensagem = f"[{viatura.prefixo}] {m.tipo.value} vence em {dias_restantes} dias"

            # Verificar por KM
            if m.km_proximo and viatura.km_atual:
                km_restantes = m.km_proximo - viatura.km_atual
                if km_restantes < 0:
                    nivel = NivelAlerta.critico
                    mensagem = f"[{viatura.prefixo}] {m.tipo.value} VENCIDA por KM ({abs(int(km_restantes))} km ultrapassados)"
                elif km_restantes <= LIMITES["km_alerta_antecipado"]:
                    nivel = NivelAlerta.aviso
                    mensagem = f"[{viatura.prefixo}] {m.tipo.value} próxima em {int(km_restantes)} km"

            if nivel and mensagem:
                alerta = Alerta(
                    viatura_id=viatura.id,
                    tipo=TipoAlerta.manutencao,
                    nivel=nivel,
                    mensagem=mensagem
                )
                self.db.add(alerta)

        self.db.commit()

    def calcular_proxima_manutencao(self, viatura: Viatura, tipo: TipoManutencao, km_ultima: float, data_ultima: datetime):
        """Calcula a próxima manutenção baseada em tipo, km e data."""
        km_proximo = None
        data_proxima = None

        if tipo == TipoManutencao.troca_oleo:
            km_proximo = km_ultima + LIMITES["km_troca_oleo"]
            data_proxima = data_ultima + timedelta(days=LIMITES["meses_troca_oleo"] * 30)
        elif tipo == TipoManutencao.revisao_freio:
            km_proximo = km_ultima + LIMITES["km_revisao_freio"]
            data_proxima = data_ultima + timedelta(days=LIMITES["meses_revisao_freio"] * 30)
        elif tipo == TipoManutencao.troca_bateria:
            data_proxima = data_ultima + timedelta(days=LIMITES["meses_troca_bateria"] * 30)
        elif tipo == TipoManutencao.troca_pneus:
            km_proximo = km_ultima + LIMITES["km_troca_pneus"]
            data_proxima = data_ultima + timedelta(days=LIMITES["anos_troca_pneus"] * 365)
        elif tipo == TipoManutencao.revisao_geral:
            km_proximo = km_ultima + LIMITES["km_revisao_geral"]

        return km_proximo, data_proxima
