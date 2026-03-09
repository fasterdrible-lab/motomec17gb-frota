import logging
from typing import Any, Dict, Optional

from config.settings import settings

logger = logging.getLogger(__name__)


class TelegramService:
    """Thin wrapper around the Telegram Bot API for sending alerts and reports."""

    def __init__(self):
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self._bot = None

    def _is_configured(self) -> bool:
        return bool(self.token and self.chat_id)

    def _get_bot(self):
        """Lazily initialise the Bot instance."""
        if self._bot is None:
            if not self._is_configured():
                raise RuntimeError("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured")
            import telegram  # python-telegram-bot

            self._bot = telegram.Bot(token=self.token)
        return self._bot

    # ── Public API ────────────────────────────────────────────────────────────

    def send_message(self, text: str) -> bool:
        """Send a plain-text message. Returns True on success, False on failure."""
        if not self._is_configured():
            logger.debug("Telegram not configured, skipping send_message")
            return False
        try:
            import asyncio

            bot = self._get_bot()

            async def _send():
                await bot.send_message(chat_id=self.chat_id, text=text, parse_mode="HTML")

            asyncio.run(_send())
            return True
        except Exception as exc:
            logger.warning("Failed to send Telegram message: %s", exc)
            return False

    def send_alert(self, title: str, message: str, emoji: str = "⚠️") -> bool:
        """Send a formatted alert message."""
        formatted = f"{emoji} <b>{title}</b>\n\n{message}"
        return self.send_message(formatted)

    def send_daily_report(self, report_data: Dict[str, Any]) -> bool:
        """Send a daily report summary."""
        vehicles_total = report_data.get("vehicles_total", 0)
        vehicles_active = report_data.get("vehicles_active", 0)
        maintenance_pending = report_data.get("maintenance_pending", 0)
        maintenance_overdue = report_data.get("maintenance_overdue", 0)
        drivers_total = report_data.get("drivers_total", 0)

        text = (
            "📊 <b>Relatório Diário - MotoMec Frota</b>\n\n"
            f"🚗 <b>Veículos:</b> {vehicles_active}/{vehicles_total} ativos\n"
            f"👤 <b>Motoristas:</b> {drivers_total}\n"
            f"🔧 <b>Manutenções pendentes:</b> {maintenance_pending}\n"
            f"🔴 <b>Manutenções atrasadas:</b> {maintenance_overdue}\n"
        )
        return self.send_message(text)

    def test_connection(self) -> Dict[str, Any]:
        """Attempt to reach the Telegram API and return status info."""
        if not self._is_configured():
            return {"ok": False, "error": "Token or chat_id not configured"}
        try:
            import asyncio

            bot = self._get_bot()

            async def _get_me():
                return await bot.get_me()

            me = asyncio.run(_get_me())
            return {"ok": True, "bot_username": me.username, "bot_id": me.id}
        except Exception as exc:
            logger.warning("Telegram connection test failed: %s", exc)
            return {"ok": False, "error": str(exc)}
