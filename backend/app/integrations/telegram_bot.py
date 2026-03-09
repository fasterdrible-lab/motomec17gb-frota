import asyncio
import logging
from typing import Any, Dict, Optional

from app.config import settings

logger = logging.getLogger(__name__)

try:
    import telegram
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    logger.warning("python-telegram-bot não instalado — Telegram desativado")


class TelegramIntegration:
    """Wraps the existing TelegramBot logic for use within the FastAPI backend."""

    def __init__(self) -> None:
        self.token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self._bot: Optional[Any] = None

        if not TELEGRAM_AVAILABLE:
            return
        if not self.token:
            logger.warning("TELEGRAM_BOT_TOKEN não configurado")
            return
        try:
            self._bot = telegram.Bot(token=self.token)
            logger.info("✅ Telegram Integration inicializada")
        except Exception as exc:
            logger.error("Erro ao inicializar Telegram: %s", exc)

    def _run(self, coro: Any) -> Any:
        """Run an async Telegram coroutine synchronously.

        Creates a new event loop to avoid conflicts with any running async
        context. Each call is intentionally isolated since Telegram sends
        are infrequent fire-and-forget operations.
        """
        try:
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(coro)
            finally:
                loop.close()
        except Exception as exc:
            logger.error("Telegram async error: %s", exc)
            return None

    def enviar_mensagem(self, mensagem: str, chat_id: Optional[str] = None) -> bool:
        """Send a plain or Markdown message.

        Args:
            mensagem: Message text (supports Markdown).
            chat_id: Override destination chat ID.

        Returns:
            True on success, False otherwise.
        """
        if not self._bot:
            return False
        destino = chat_id or self.chat_id
        if not destino:
            logger.warning("chat_id não configurado")
            return False
        try:
            self._run(
                self._bot.send_message(chat_id=destino, text=mensagem, parse_mode="Markdown")
            )
            return True
        except Exception as exc:
            logger.error("Erro ao enviar mensagem Telegram: %s", exc)
            return False

    def enviar_alerta(
        self,
        tipo: str,
        mensagem: str,
        emoji: str = "⚠️",
        chat_id: Optional[str] = None,
    ) -> bool:
        """Send a formatted alert message.

        Args:
            tipo: Alert type label (used as title).
            mensagem: Alert description body.
            emoji: Leading emoji for visual severity cue.
            chat_id: Optional override chat ID.

        Returns:
            True on success.
        """
        texto = f"{emoji} *{tipo}*\n\n{mensagem}"
        return self.enviar_mensagem(texto, chat_id=chat_id)

    def enviar_relatorio_diario(self, relatorio: Dict[str, Any], chat_id: Optional[str] = None) -> bool:
        """Send the daily fleet report summary via Telegram.

        Args:
            relatorio: Dict returned by RelatorioService.gerar_relatorio_diario().
            chat_id: Optional override chat ID.

        Returns:
            True on success.
        """
        status = relatorio.get("status_frota", {})
        linhas = [
            "📊 *RELATÓRIO DIÁRIO — 17º GB*\n",
            f"📅 Data: {relatorio.get('data', '—')}",
            f"🚒 Total de viaturas: {status.get('total_viaturas', 0)}",
            f"✅ Operacional: {status.get('operacional', 0)}",
            f"🔧 Em manutenção: {status.get('manutencao', 0)}",
            f"🔴 Alertas críticos: {status.get('alertas_criticos', 0)}",
            f"⚠️ Manutenções pendentes: {relatorio.get('manutencoes_pendentes', 0)}",
            f"💰 Gastos hoje: R$ {relatorio.get('gastos_hoje', 0):.2f}",
        ]
        return self.enviar_mensagem("\n".join(linhas), chat_id=chat_id)

    def processar_comando(self, comando: str) -> str:
        """Process a bot command and return the response text.

        Supports /status, /alertas, /relatorio.

        Args:
            comando: Raw command string from Telegram.

        Returns:
            Response text to send back.
        """
        cmd = comando.strip().lower().split()[0] if comando.strip() else ""
        if cmd == "/status":
            return "ℹ️ Sistema operacional. Use /relatorio para o relatório completo."
        if cmd == "/alertas":
            return "⚠️ Consulte os alertas no painel web do sistema."
        if cmd == "/relatorio":
            return "📊 Acesse o relatório completo em: http://sistema.17gb.local/relatorios"
        return f"Comando desconhecido: {comando}"

    def teste_conexao(self) -> bool:
        """Test the Telegram bot connection.

        Returns:
            True if the bot is reachable, False otherwise.
        """
        if not self._bot:
            return False
        try:
            me = self._run(self._bot.get_me())
            if me:
                logger.info("✅ Telegram conectado: @%s", me.username)
                return True
        except Exception as exc:
            logger.error("Teste Telegram falhou: %s", exc)
        return False
