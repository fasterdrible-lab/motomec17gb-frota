from datetime import date
from typing import Dict, Any, Optional
import logging

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.gastos import Gasto
from app.models.frota import Viatura

logger = logging.getLogger(__name__)


class GastosService:
    """Business-logic service for fleet expense reporting."""

    def calcular_gastos_por_periodo(
        self,
        db: Session,
        viatura_id: int,
        data_inicio: date,
        data_fim: date,
    ) -> Dict[str, Any]:
        """Return expense totals for a viatura within a date range.

        Args:
            db: Database session.
            viatura_id: PK of the viatura.
            data_inicio: Start date (inclusive).
            data_fim: End date (inclusive).

        Returns:
            Dict with total, count, average, and category breakdown.
        """
        gastos = (
            db.query(Gasto)
            .filter(
                Gasto.viatura_id == viatura_id,
                Gasto.data >= data_inicio,
                Gasto.data <= data_fim,
            )
            .all()
        )

        total = sum(g.valor for g in gastos)
        por_categoria = self.calcular_gastos_por_categoria(db, viatura_id, data_inicio, data_fim)

        return {
            "viatura_id": viatura_id,
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "total": total,
            "count": len(gastos),
            "media": total / len(gastos) if gastos else 0,
            "por_categoria": por_categoria,
        }

    def calcular_percentual_fipe(self, db: Session, viatura_id: int) -> float:
        """Return the ratio of total gastos to the FIPE value as a percentage.

        Args:
            db: Database session.
            viatura_id: PK of the viatura.

        Returns:
            Percentage (0–100+), or 0.0 if FIPE value is not available.
        """
        viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
        if not viatura or not viatura.valor_fipe or viatura.valor_fipe <= 0:
            return 0.0

        total = db.query(func.sum(Gasto.valor)).filter(Gasto.viatura_id == viatura_id).scalar() or 0.0
        return round((total / viatura.valor_fipe) * 100, 2)

    def calcular_gastos_por_categoria(
        self,
        db: Session,
        viatura_id: int,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
    ) -> Dict[str, float]:
        """Return totals grouped by expense category.

        Args:
            db: Database session.
            viatura_id: PK of the viatura.
            data_inicio: Optional start date filter.
            data_fim: Optional end date filter.

        Returns:
            Dict mapping category name to total value.
        """
        query = db.query(Gasto.categoria, func.sum(Gasto.valor)).filter(
            Gasto.viatura_id == viatura_id
        )
        if data_inicio:
            query = query.filter(Gasto.data >= data_inicio)
        if data_fim:
            query = query.filter(Gasto.data <= data_fim)

        rows = query.group_by(Gasto.categoria).all()
        return {row[0]: round(row[1], 2) for row in rows}

    def relatorio_mensal(self, db: Session, mes: int, ano: int) -> Dict[str, Any]:
        """Generate a monthly expense report for the entire fleet.

        Args:
            db: Database session.
            mes: Month number (1–12).
            ano: Four-digit year.

        Returns:
            Dict with aggregated expense data.
        """
        from sqlalchemy import extract

        gastos = (
            db.query(Gasto)
            .filter(
                extract("month", Gasto.data) == mes,
                extract("year", Gasto.data) == ano,
            )
            .all()
        )

        total = sum(g.valor for g in gastos)
        por_categoria: Dict[str, float] = {}
        por_viatura: Dict[int, float] = {}
        for g in gastos:
            por_categoria[g.categoria] = por_categoria.get(g.categoria, 0) + g.valor
            por_viatura[g.viatura_id] = por_viatura.get(g.viatura_id, 0) + g.valor

        return {
            "mes": mes,
            "ano": ano,
            "total": round(total, 2),
            "count": len(gastos),
            "por_categoria": {k: round(v, 2) for k, v in por_categoria.items()},
            "por_viatura": {k: round(v, 2) for k, v in por_viatura.items()},
        }
