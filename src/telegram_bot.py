import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, logger

try:
    import telegram
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.ext import (
        Application,
        CommandHandler,
        ContextTypes,
        CallbackQueryHandler,
    )
    TELEGRAM_DISPONIVEL = True
except ImportError:
    TELEGRAM_DISPONIVEL = False
    logger.warning("⚠️ python-telegram-bot não instalado. Bot Telegram desativado.")


class TelegramBot:
    def __init__(self):
        """Inicializa o bot Telegram."""
        self.token = TELEGRAM_BOT_TOKEN
        self.chat_id = TELEGRAM_CHAT_ID
        self.telegram_bot = None
        self.app = None

        if not TELEGRAM_DISPONIVEL:
            logger.warning("⚠️ Telegram indisponível — biblioteca não instalada")
            return

        if not self.token:
            logger.warning("⚠️ TELEGRAM_BOT_TOKEN não configurado")
            return

        try:
            self.telegram_bot = telegram.Bot(token=self.token)
            logger.info("✅ Bot Telegram inicializado")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar bot Telegram: {e}")
            self.telegram_bot = None

    # ------------------------------------------------------------------
    # Envio de mensagens
    # ------------------------------------------------------------------

    def enviar_mensagem(self, mensagem, chat_id=None, parse_mode='Markdown'):
        """Envia uma mensagem de texto.

        Args:
            mensagem: Texto da mensagem.
            chat_id: ID do chat destino (usa TELEGRAM_CHAT_ID se não informado).
            parse_mode: Modo de formatação ('Markdown' ou 'HTML').

        Returns:
            True em caso de sucesso, False caso contrário.
        """
        if not self.telegram_bot:
            logger.debug("Bot Telegram não disponível para envio")
            return False

        destino = chat_id or self.chat_id
        if not destino:
            logger.warning("⚠️ chat_id não configurado")
            return False

        try:
            import asyncio
            asyncio.run(
                self.telegram_bot.send_message(
                    chat_id=destino,
                    text=mensagem,
                    parse_mode=parse_mode,
                )
            )
            logger.info("✅ Mensagem enviada via Telegram")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao enviar mensagem Telegram: {e}")
            return False

    def enviar_alerta(self, titulo, descricao, emoji='⚠️', chat_id=None):
        """Envia uma mensagem de alerta formatada.

        Args:
            titulo: Título do alerta.
            descricao: Descrição detalhada.
            emoji: Emoji de identificação do nível.
            chat_id: ID do chat destino (opcional).
        """
        mensagem = f"{emoji} *{titulo}*\n\n{descricao}"
        return self.enviar_mensagem(mensagem, chat_id=chat_id)

    def enviar_relatorio_diario(self, relatorio, chat_id=None):
        """Envia o relatório diário da frota.

        Args:
            relatorio: Dicionário com os dados do relatório.
            chat_id: ID do chat destino (opcional).
        """
        linhas = [
            '📊 *RELATÓRIO DIÁRIO DA FROTA*\n',
            f"🚗 Total de veículos: {relatorio.get('total_veiculos', 0)}",
            f"🔧 Manutenções pendentes: {relatorio.get('manutencoes_pendentes', 0)}",
            f"🔴 Alertas críticos: {relatorio.get('alertas_criticos', 0)}",
            f"🟠 Alertas urgentes: {relatorio.get('alertas_urgentes', 0)}",
            f"✅ Veículos em dia: {relatorio.get('veiculos_em_dia', 0)}",
        ]

        proximas = relatorio.get('proximas_acoes')
        if proximas:
            linhas.append(f"\n📋 *Próximas ações:*\n{proximas}")

        return self.enviar_mensagem('\n'.join(linhas), chat_id=chat_id)

    # ------------------------------------------------------------------
    # Teste de conexão
    # ------------------------------------------------------------------

    def teste_conexao(self):
        """Verifica se o bot está acessível.

        Returns:
            True se o bot respondeu, False caso contrário.
        """
        if not self.telegram_bot:
            return False
        try:
            import asyncio
            me = asyncio.run(self.telegram_bot.get_me())
            logger.info(f"✅ Bot Telegram conectado: @{me.username}")
            return True
        except Exception as e:
            logger.error(f"❌ Teste Telegram falhou: {e}")
            return False

    # ------------------------------------------------------------------
    # Bot interativo (polling)
    # ------------------------------------------------------------------

    def iniciar_bot(self, sheets_api=None, alertas_mgr=None):
        """Inicia o bot em modo polling com todos os comandos registrados.

        Args:
            sheets_api: Instância de GoogleSheetsAPI para consultas (opcional).
            alertas_mgr: Instância de GerenciadorAlertas (opcional).
        """
        if not TELEGRAM_DISPONIVEL or not self.token:
            logger.warning("⚠️ Bot não pode ser iniciado — configuração incompleta")
            return

        self._sheets = sheets_api
        self._alertas = alertas_mgr

        app = Application.builder().token(self.token).build()

        app.add_handler(CommandHandler('start', self._cmd_start))
        app.add_handler(CommandHandler('frota', self._cmd_frota))
        app.add_handler(CommandHandler('alertas', self._cmd_alertas))
        app.add_handler(CommandHandler('abastecimento', self._cmd_abastecimento))
        app.add_handler(CommandHandler('defeito', self._cmd_defeito))
        app.add_handler(CommandHandler('gastos', self._cmd_gastos))
        app.add_handler(CommandHandler('status', self._cmd_status))

        logger.info("🤖 Bot Telegram iniciado em modo polling")
        app.run_polling()

    # ------------------------------------------------------------------
    # Handlers dos comandos
    # ------------------------------------------------------------------

    async def _cmd_start(self, update: 'Update', context: 'ContextTypes.DEFAULT_TYPE'):
        texto = (
            '🚗 *Sistema de Gestão de Frota MotoMec17GB*\n\n'
            'Comandos disponíveis:\n'
            '/frota — Ver todos os veículos\n'
            '/alertas — Alertas críticos\n'
            '/abastecimento — Registrar combustível\n'
            '/defeito — Registrar defeito\n'
            '/gastos — Ver despesas\n'
            '/status — Status do sistema'
        )
        await update.message.reply_text(texto, parse_mode='Markdown')

    async def _cmd_frota(self, update: 'Update', context: 'ContextTypes.DEFAULT_TYPE'):
        if self._sheets:
            try:
                dados = self._sheets.read_sheet('FROTA', 'A:H')
                total = max(0, len(dados) - 1) if dados else 0
                texto = f'🚗 *Frota*\nTotal de veículos: {total}'
            except Exception as e:
                texto = f'❌ Erro ao carregar frota: {e}'
        else:
            texto = '⚠️ Integração com Google Sheets não disponível.'
        await update.message.reply_text(texto, parse_mode='Markdown')

    async def _cmd_alertas(self, update: 'Update', context: 'ContextTypes.DEFAULT_TYPE'):
        if self._alertas and self._alertas.alertas:
            criticos = self._alertas.obter_alertas_criticos()
            urgentes = self._alertas.obter_alertas_urgentes()
            linhas = ['🚨 *Alertas Ativos*\n']
            if criticos:
                linhas.append('🔴 *Críticos*')
                for a in criticos:
                    linhas.append(f"  • {a['veiculo']}: {a['mensagem']}")
            if urgentes:
                linhas.append('\n🟠 *Altos*')
                for a in urgentes:
                    linhas.append(f"  • {a['veiculo']}: {a['mensagem']}")
            texto = '\n'.join(linhas)
        else:
            texto = '✅ Nenhum alerta ativo no momento.'
        await update.message.reply_text(texto, parse_mode='Markdown')

    async def _cmd_abastecimento(self, update: 'Update', context: 'ContextTypes.DEFAULT_TYPE'):
        texto = (
            '⛽ *Registrar Abastecimento*\n\n'
            'Envie os dados no formato:\n'
            '`PLACA | LITROS | VALOR | KM`\n\n'
            'Exemplo: `ABC1234 | 20.5 | 150.00 | 45320`'
        )
        await update.message.reply_text(texto, parse_mode='Markdown')

    async def _cmd_defeito(self, update: 'Update', context: 'ContextTypes.DEFAULT_TYPE'):
        texto = (
            '🔧 *Registrar Defeito*\n\n'
            'Envie os dados no formato:\n'
            '`PLACA | DESCRIÇÃO | PRIORIDADE`\n\n'
            'Exemplo: `ABC1234 | Freio traseiro falhando | ALTA`'
        )
        await update.message.reply_text(texto, parse_mode='Markdown')

    async def _cmd_gastos(self, update: 'Update', context: 'ContextTypes.DEFAULT_TYPE'):
        if self._sheets:
            try:
                dados = self._sheets.read_sheet('GASTOS', 'A:D')
                total_linhas = max(0, len(dados) - 1) if dados else 0
                texto = f'💰 *Gastos*\nRegistros encontrados: {total_linhas}\n\nConsulte a planilha para detalhes.'
            except Exception as e:
                texto = f'❌ Erro ao carregar gastos: {e}'
        else:
            texto = '⚠️ Integração com Google Sheets não disponível.'
        await update.message.reply_text(texto, parse_mode='Markdown')

    async def _cmd_status(self, update: 'Update', context: 'ContextTypes.DEFAULT_TYPE'):
        sheets_ok = self._sheets is not None and self._sheets.sheet is not None
        alertas_ok = self._alertas is not None
        telegram_ok = self.telegram_bot is not None

        texto = (
            '🖥️ *Status do Sistema*\n\n'
            f"{'✅' if sheets_ok else '❌'} Google Sheets\n"
            f"{'✅' if alertas_ok else '❌'} Gerenciador de Alertas\n"
            f"{'✅' if telegram_ok else '❌'} Bot Telegram"
        )
        await update.message.reply_text(texto, parse_mode='Markdown')
