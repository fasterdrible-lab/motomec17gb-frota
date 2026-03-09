from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

from sqlalchemy.orm import Session

from app.models.alertas import Alerta
from app.models.frota import Viatura
from app.services.manutencao_service import ManutencaoService

logger = logging.getLogger(__name__)

manutencao_service = ManutencaoService()


class AlertasService:
    """Service responsible for generating, dispatching and cleaning fleet alerts."""

    def gerar_alertas_criticos(self, db: Session) -> List[Alerta]:
        """Return all active alerts with tipo_alerta='critico'.

        Args:
            db: Database session.

        Returns:
            List of critical Alerta records.
        """
        return (
            db.query(Alerta)
            .filter(Alerta.tipo_alerta == "critico", Alerta.status == "ativo")
            .all()
        )

    def gerar_alertas_manutencao(self, db: Session) -> List[Alerta]:
        """Create Alerta records for every overdue or upcoming maintenance.

        Skips creation if a matching active alert already exists.

        Args:
            db: Database session.

        Returns:
            List of newly created Alerta records.
        """
        viaturas = db.query(Viatura).filter(Viatura.status != "inativo").all()
        novos: List[Alerta] = []

        for viatura in viaturas:
            alertas_data = manutencao_service.verificar_alertas_viatura(db, viatura)
            for ad in alertas_data:
                # Avoid duplicate active alerts
                existing = (
                    db.query(Alerta)
                    .filter(
                        Alerta.viatura_id == viatura.id,
                        Alerta.mensagem == ad["mensagem"],
                        Alerta.status == "ativo",
                    )
                    .first()
                )
                if existing:
                    continue

                alerta = Alerta(
                    viatura_id=viatura.id,
                    tipo_alerta=ad["nivel"],
                    mensagem=ad["mensagem"],
                    status="ativo",
                )
                db.add(alerta)
                novos.append(alerta)

        db.commit()
        logger.info("Gerados %d novos alertas de manutenção", len(novos))
        return novos

    def enviar_alertas_telegram(self, db: Session, telegram_bot: Any) -> int:
        """Send all unsent critical and urgent alerts via Telegram.

        Args:
            db: Database session.
            telegram_bot: Instance of TelegramIntegration or similar with enviar_alerta().

        Returns:
            Number of alerts sent.
        """
        alertas = (
            db.query(Alerta)
            .filter(
                Alerta.tipo_alerta.in_(["critico", "urgente"]),
                Alerta.status == "ativo",
                Alerta.lido == False,
            )
            .all()
        )

        emoji_map = {"critico": "🔴", "urgente": "🟠", "aviso": "🟡", "info": "ℹ️"}
        sent = 0
        for alerta in alertas:
            try:
                emoji = emoji_map.get(alerta.tipo_alerta, "⚠️")
                telegram_bot.enviar_alerta(
                    titulo=f"Alerta de Frota — {alerta.tipo_alerta.upper()}",
                    descricao=alerta.mensagem,
                    emoji=emoji,
                )
                sent += 1
            except Exception as exc:
                logger.error("Erro ao enviar alerta %d via Telegram: %s", alerta.id, exc)

        return sent

    def limpar_alertas_antigos(self, db: Session, dias: int = 30) -> int:
        """Delete resolved alerts older than *dias* days.

        Args:
            db: Database session.
            dias: Age threshold in days (default 30).

        Returns:
            Number of records deleted.
        """
        cutoff = datetime.utcnow() - timedelta(days=dias)
        count = (
            db.query(Alerta)
            .filter(Alerta.status == "resolvido", Alerta.created_at < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        logger.info("Removidos %d alertas antigos (>%d dias)", count, dias)
        return count
