import logging
from typing import Optional
from app.config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

logger = logging.getLogger(__name__)

class TelegramBot:
    def __init__(self):
        self.bot = None
        self.chat_id = TELEGRAM_CHAT_ID
        self._connect()

    def _connect(self):
        if not TELEGRAM_BOT_TOKEN:
            logger.warning("⚠️ TELEGRAM_BOT_TOKEN não configurado")
            return
        try:
            import telegram
            self.bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)
            logger.info("✅ Telegram Bot conectado")
        except Exception as e:
            logger.warning(f"⚠️ Telegram não disponível: {e}")

    def enviar_mensagem(self, mensagem: str) -> bool:
        if not self.bot or not self.chat_id:
            return False
        try:
            import asyncio
            asyncio.run(self.bot.send_message(chat_id=self.chat_id, text=mensagem, parse_mode="HTML"))
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem Telegram: {e}")
            return False

    def enviar_alerta(self, nivel: str, mensagem: str) -> bool:
        emoji = {"critico": "🔴", "aviso": "🟡", "info": "🔵"}.get(nivel, "⚪")
        texto = f"{emoji} <b>[{nivel.upper()}]</b>\n{mensagem}"
        return self.enviar_mensagem(texto)

    def enviar_relatorio_diario(self, relatorio: dict) -> bool:
        texto = f"""📊 <b>RELATÓRIO DIÁRIO - 17º GB</b>
        
🚗 Total de viaturas: {relatorio.get('total_viaturas', 0)}
✅ Operando: {relatorio.get('operando', 0)}
🔧 Manutenção: {relatorio.get('manutencao', 0)}
🔴 Alertas críticos: {relatorio.get('alertas_criticos', 0)}
⏳ Manutenções pendentes: {relatorio.get('manutencoes_pendentes', 0)}
"""
        return self.enviar_mensagem(texto)
