from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.frota import Viatura, StatusViatura
from app.models.manutencao import ManutencaoPreventiva, StatusManutencao
from app.models.alertas import Alerta, NivelAlerta
from app.models.gastos import GastoFinanceiro
from app.models.defeitos import Defeito, StatusDefeito

class RelatorioService:
    def __init__(self, db: Session):
        self.db = db

    def gerar_relatorio_completo(self) -> dict:
        return {
            "frota": self._status_frota(),
            "financeiro": self._resumo_financeiro(),
            "alertas": self._resumo_alertas(),
            "gerado_em": datetime.utcnow().isoformat()
        }

    def _status_frota(self) -> dict:
        total = self.db.query(func.count(Viatura.id)).scalar()
        operando = self.db.query(func.count(Viatura.id)).filter(Viatura.status == StatusViatura.operando).scalar()
        manutencao = self.db.query(func.count(Viatura.id)).filter(Viatura.status == StatusViatura.manutencao).scalar()
        baixada = self.db.query(func.count(Viatura.id)).filter(Viatura.status == StatusViatura.baixada).scalar()
        return {"total": total, "operando": operando, "manutencao": manutencao, "baixada": baixada}

    def _resumo_financeiro(self) -> dict:
        ano = datetime.utcnow().year
        total = self.db.query(func.sum(GastoFinanceiro.valor)).filter(GastoFinanceiro.ano == ano).scalar() or 0
        return {"ano": ano, "total_gastos": total}

    def _resumo_alertas(self) -> dict:
        total = self.db.query(func.count(Alerta.id)).filter(Alerta.lido == False).scalar()
        criticos = self.db.query(func.count(Alerta.id)).filter(Alerta.nivel == NivelAlerta.critico, Alerta.lido == False).scalar()
        return {"total_nao_lidos": total, "criticos": criticos}
