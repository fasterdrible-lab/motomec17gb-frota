import logging
import requests as _requests
from app.config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

logger = logging.getLogger(__name__)

TELEGRAM_API_BASE = "https://api.telegram.org/bot"


class TelegramBot:
    def __init__(self):
        self.token = TELEGRAM_BOT_TOKEN
        self.chat_id = TELEGRAM_CHAT_ID

    def _is_configured(self) -> bool:
        if not self.token:
            logger.warning("⚠️ TELEGRAM_BOT_TOKEN não configurado")
            return False
        return True

    def enviar_mensagem(self, mensagem: str) -> bool:
        if not self._is_configured() or not self.chat_id:
            return False
        try:
            url = f"{TELEGRAM_API_BASE}{self.token}/sendMessage"
            payload = {"chat_id": self.chat_id, "text": mensagem, "parse_mode": "HTML"}
            resp = _requests.post(url, json=payload, timeout=10)
            resp.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem Telegram: {e}")
            return False

    def enviar_alerta(self, nivel: str, mensagem: str) -> bool:
        emoji = {"critico": "🔴", "aviso": "🟡", "info": "🔵"}.get(nivel, "⚪")
        texto = f"{emoji} <b>[{nivel.upper()}]</b>\n{mensagem}"
        return self.enviar_mensagem(texto)

    def enviar_relatorio_diario(self, relatorio: dict) -> bool:
        texto = (
            "📊 <b>RELATÓRIO DIÁRIO - 17º GB</b>\n\n"
            f"🚗 Total de viaturas: {relatorio.get('total_viaturas', 0)}\n"
            f"✅ Operando: {relatorio.get('operando', 0)}\n"
            f"🔧 Manutenção: {relatorio.get('manutencao', 0)}\n"
            f"🔴 Alertas críticos: {relatorio.get('alertas_criticos', 0)}\n"
            f"⏳ Manutenções pendentes: {relatorio.get('manutencoes_pendentes', 0)}\n"
        )
        return self.enviar_mensagem(texto)
