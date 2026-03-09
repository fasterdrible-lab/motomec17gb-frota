from datetime import date
from typing import Dict, Any, List
import logging

from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from app.models.frota import Viatura
from app.models.gastos import Gasto
from app.models.abastecimento import Abastecimento
from app.models.alertas import Alerta
from app.models.manutencao import Manutencao
from app.services.gastos_service import GastosService

logger = logging.getLogger(__name__)
gastos_service = GastosService()


class RelatorioService:
    """Service that aggregates fleet data into structured reports."""

    def obter_status_frota(self, db: Session) -> Dict[str, Any]:
        """Return a summary of the current fleet status.

        Args:
            db: Database session.

        Returns:
            Dict with counts per status and totals.
        """
        total = db.query(func.count(Viatura.id)).scalar() or 0
        operacional = db.query(func.count(Viatura.id)).filter(Viatura.status == "operacional").scalar() or 0
        manutencao = db.query(func.count(Viatura.id)).filter(Viatura.status == "manutencao").scalar() or 0
        inativo = db.query(func.count(Viatura.id)).filter(Viatura.status == "inativo").scalar() or 0
        alertas_ativos = db.query(func.count(Alerta.id)).filter(Alerta.status == "ativo").scalar() or 0
        alertas_criticos = (
            db.query(func.count(Alerta.id))
            .filter(Alerta.status == "ativo", Alerta.tipo_alerta == "critico")
            .scalar() or 0
        )

        return {
            "total_viaturas": total,
            "operacional": operacional,
            "manutencao": manutencao,
            "inativo": inativo,
            "alertas_ativos": alertas_ativos,
            "alertas_criticos": alertas_criticos,
            "percentual_operacional": round(operacional / total * 100, 1) if total else 0,
        }

    def gerar_relatorio_diario(self, db: Session) -> Dict[str, Any]:
        """Generate a daily operational report.

        Args:
            db: Database session.

        Returns:
            Dict with status overview, pending maintenances, and today's expenses.
        """
        hoje = date.today()
        status = self.obter_status_frota(db)

        manutencoes_pendentes = (
            db.query(func.count(Manutencao.id))
            .filter(Manutencao.status == "pendente")
            .scalar() or 0
        )
        manutencoes_vencidas = (
            db.query(func.count(Manutencao.id))
            .filter(Manutencao.status == "vencida")
            .scalar() or 0
        )
        abastecimentos_hoje = (
            db.query(func.count(Abastecimento.id))
            .filter(Abastecimento.data == hoje)
            .scalar() or 0
        )
        gastos_hoje = (
            db.query(func.sum(Gasto.valor)).filter(Gasto.data == hoje).scalar() or 0.0
        )

        return {
            "data": hoje.isoformat(),
            "status_frota": status,
            "manutencoes_pendentes": manutencoes_pendentes,
            "manutencoes_vencidas": manutencoes_vencidas,
            "abastecimentos_hoje": abastecimentos_hoje,
            "gastos_hoje": round(gastos_hoje, 2),
        }

    def gerar_relatorio_mensal(self, db: Session, mes: int, ano: int) -> Dict[str, Any]:
        """Generate a monthly report.

        Args:
            db: Database session.
            mes: Month (1–12).
            ano: Four-digit year.

        Returns:
            Dict with aggregated monthly data.
        """
        gastos = gastos_service.relatorio_mensal(db, mes, ano)

        abastecimentos = (
            db.query(func.count(Abastecimento.id), func.sum(Abastecimento.valor_total))
            .filter(
                extract("month", Abastecimento.data) == mes,
                extract("year", Abastecimento.data) == ano,
            )
            .first()
        )
        ab_count = abastecimentos[0] or 0
        ab_total = round(abastecimentos[1] or 0.0, 2)

        manutencoes_realizadas = (
            db.query(func.count(Manutencao.id))
            .filter(
                Manutencao.status == "realizada",
                extract("month", Manutencao.data_ultima) == mes,
                extract("year", Manutencao.data_ultima) == ano,
            )
            .scalar() or 0
        )

        return {
            "mes": mes,
            "ano": ano,
            "gastos": gastos,
            "abastecimentos": {"count": ab_count, "total": ab_total},
            "manutencoes_realizadas": manutencoes_realizadas,
        }

    def gerar_relatorio_anual(self, db: Session, ano: int) -> Dict[str, Any]:
        """Generate an annual summary report.

        Args:
            db: Database session.
            ano: Four-digit year.

        Returns:
            Dict with 12 monthly sub-reports and aggregated totals.
        """
        meses = []
        total_gastos = 0.0
        for mes in range(1, 13):
            rel = self.gerar_relatorio_mensal(db, mes, ano)
            meses.append(rel)
            total_gastos += rel["gastos"]["total"]

        return {
            "ano": ano,
            "total_gastos": round(total_gastos, 2),
            "por_mes": meses,
            "status_frota": self.obter_status_frota(db),
        }
