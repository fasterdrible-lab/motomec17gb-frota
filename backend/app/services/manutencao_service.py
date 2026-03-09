from datetime import date, timedelta
from typing import List, Dict, Any
import logging

from sqlalchemy.orm import Session

from app.models.manutencao import Manutencao
from app.models.frota import Viatura

logger = logging.getLogger(__name__)

# Maintenance interval constants (mirroring src/config.py)
LIMITE_DIAS_OLEO = 30
LIMITE_KM_PNEU = 50_000
LIMITE_DIAS_BATERIA = 365
LIMITE_DIAS_INSPECAO = 180


class ManutencaoService:
    """Business-logic service for vehicle maintenance operations."""

    def calcular_status(self, manutencao: Manutencao, km_atual: int) -> str:
        """Compute the derived status of a maintenance record.

        Args:
            manutencao: Maintenance record to evaluate.
            km_atual: Current odometer reading of the viatura.

        Returns:
            'vencida', 'pendente', or 'em_dia'.
        """
        hoje = date.today()

        # Check date-based overdue
        if manutencao.data_proximo and manutencao.data_proximo < hoje:
            return "vencida"

        # Check km-based overdue
        if manutencao.km_proximo and km_atual >= manutencao.km_proximo:
            return "vencida"

        # Due within 7 days or 500 km
        if manutencao.data_proximo:
            days_left = (manutencao.data_proximo - hoje).days
            if days_left <= 7:
                return "pendente"

        if manutencao.km_proximo and km_atual > 0:
            km_left = manutencao.km_proximo - km_atual
            if km_left <= 500:
                return "pendente"

        return "em_dia"

    def calcular_proximas_manutencoes(self, db: Session, viatura_id: int) -> List[Dict[str, Any]]:
        """Return upcoming maintenance items for a specific viatura.

        Args:
            db: Database session.
            viatura_id: PK of the viatura.

        Returns:
            List of dicts with maintenance details sorted by urgency.
        """
        viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
        if not viatura:
            return []

        manutencoes = (
            db.query(Manutencao)
            .filter(Manutencao.viatura_id == viatura_id, Manutencao.status != "realizada")
            .all()
        )

        resultado = []
        for m in manutencoes:
            status = self.calcular_status(m, viatura.km_atual)
            resultado.append(
                {
                    "id": m.id,
                    "tipo": m.tipo,
                    "status": status,
                    "data_proximo": m.data_proximo,
                    "km_proximo": m.km_proximo,
                }
            )

        # Sort: vencida first, then pendente, then em_dia
        order = {"vencida": 0, "pendente": 1, "em_dia": 2}
        resultado.sort(key=lambda x: order.get(x["status"], 9))
        return resultado

    def detectar_vencidas(self, db: Session) -> List[Manutencao]:
        """Find all overdue maintenance records across the entire fleet.

        Args:
            db: Database session.

        Returns:
            List of Manutencao objects with status 'vencida'.
        """
        hoje = date.today()
        date_overdue = (
            db.query(Manutencao)
            .filter(Manutencao.data_proximo < hoje, Manutencao.status != "realizada")
            .all()
        )
        # Also check km-based for viaturas with current km loaded
        viaturas_km = {v.id: v.km_atual for v in db.query(Viatura).all()}
        km_overdue = (
            db.query(Manutencao)
            .filter(Manutencao.km_proximo.isnot(None), Manutencao.status != "realizada")
            .all()
        )
        km_overdue_ids = {
            m.id
            for m in km_overdue
            if viaturas_km.get(m.viatura_id, 0) >= m.km_proximo
        }

        combined_ids = {m.id for m in date_overdue} | km_overdue_ids
        return db.query(Manutencao).filter(Manutencao.id.in_(combined_ids)).all()

    def verificar_alertas_viatura(self, db: Session, viatura: Viatura) -> List[Dict[str, Any]]:
        """Generate alert data for all maintenance types of a viatura.

        Checks oil (30 days), tires (50 000 km), battery (365 days), inspection (180 days).

        Args:
            db: Database session.
            viatura: Viatura instance to check.

        Returns:
            List of alert dicts with keys: tipo, mensagem, nivel.
        """
        alertas: List[Dict[str, Any]] = []
        hoje = date.today()

        records = (
            db.query(Manutencao)
            .filter(Manutencao.viatura_id == viatura.id, Manutencao.status != "realizada")
            .all()
        )

        limites = {
            "oleo": LIMITE_DIAS_OLEO,
            "bateria": LIMITE_DIAS_BATERIA,
            "inspecao": LIMITE_DIAS_INSPECAO,
        }

        for m in records:
            if m.tipo in limites and m.data_ultima:
                dias_passados = (hoje - m.data_ultima).days
                limite = limites[m.tipo]
                if dias_passados >= limite:
                    alertas.append(
                        {
                            "tipo": m.tipo,
                            "mensagem": f"[{viatura.prefixo}] {m.tipo.capitalize()} vencido há {dias_passados - limite} dias.",
                            "nivel": "critico" if dias_passados > limite + 7 else "urgente",
                        }
                    )
            elif m.tipo == "pneu" and m.km_proximo and viatura.km_atual >= m.km_proximo:
                km_atrasado = viatura.km_atual - m.km_proximo
                alertas.append(
                    {
                        "tipo": "pneu",
                        "mensagem": f"[{viatura.prefixo}] Pneu vencido por {km_atrasado} km.",
                        "nivel": "urgente",
                    }
                )

        return alertas
