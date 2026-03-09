import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
from datetime import datetime, timedelta
from config import LIMITES_ALERTAS, logger

TIPO_ALERTA_OLEO_VENCIDO = 'Óleo Vencido'
TIPO_ALERTA_OLEO_KM = 'Óleo por KM'
TIPO_ALERTA_BATERIA = 'Bateria Vencida'
TIPO_ALERTA_PNEU = 'Pneus Vencidos'
TIPO_ALERTA_FIPE = 'Gasto Excessivo FIPE'
TIPO_ALERTA_EMBREAGEM = 'Embreagem'
TIPO_ALERTA_STATUS = 'Status Operacional'
TIPO_ALERTA_INSPECAO = 'Inspeção Vencida'
TIPO_ALERTA_OLEO_PROXIMO = 'Óleo Próximo Vencimento'

NIVEL_CRITICO = 'CRITICA'
NIVEL_ALTO = 'ALTA'
NIVEL_MEDIO = 'MEDIA'


class GerenciadorAlertas:
    def __init__(self, telegram_bot=None):
        """Inicializa o gerenciador de alertas.

        Args:
            telegram_bot: Instância do TelegramBot para envio de mensagens (opcional).
        """
        self.telegram = telegram_bot
        self.alertas = []
        logger.info("✅ Gerenciador de Alertas inicializado")

    def limpar_alertas(self):
        """Remove todos os alertas acumulados."""
        self.alertas = []

    def _adicionar_alerta(self, veiculo, tipo, mensagem, nivel):
        """Adiciona um alerta à lista interna.

        Args:
            veiculo: Identificador do veículo.
            tipo: Tipo do alerta (use as constantes TIPO_ALERTA_*).
            mensagem: Descrição detalhada do alerta.
            nivel: Nível de criticidade (NIVEL_CRITICO, NIVEL_ALTO, NIVEL_MEDIO).
        """
        alerta = {
            'veiculo': veiculo,
            'tipo': tipo,
            'mensagem': mensagem,
            'nivel': nivel,
            'timestamp': datetime.now().isoformat(),
        }
        self.alertas.append(alerta)
        logger.warning(f"⚠️ Alerta [{nivel}] {veiculo}: {mensagem}")

    # ------------------------------------------------------------------
    # Verificações individuais
    # ------------------------------------------------------------------

    def verificar_alerta_oleo(self, veiculo, data_ultimo_oleo):
        """Verifica alertas relacionados à troca de óleo por data.

        Args:
            veiculo: Identificador do veículo.
            data_ultimo_oleo: Data da última troca no formato DD/MM/YYYY.
        """
        try:
            data = datetime.strptime(str(data_ultimo_oleo), '%d/%m/%Y')
            dias_limite = LIMITES_ALERTAS['dias_oleo']
            aviso_antecipado = LIMITES_ALERTAS['dias_aviso_antecipado']
            proxima_troca = data + timedelta(days=dias_limite)
            hoje = datetime.now()
            dias_restantes = (proxima_troca - hoje).days

            if dias_restantes < 0:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_OLEO_VENCIDO,
                    f"Óleo vencido há {abs(dias_restantes)} dia(s). Troca imediata necessária.",
                    NIVEL_ALTO,
                )
            elif dias_restantes <= aviso_antecipado:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_OLEO_PROXIMO,
                    f"Troca de óleo em {dias_restantes} dia(s).",
                    NIVEL_MEDIO,
                )
        except (ValueError, TypeError) as e:
            logger.debug(f"Não foi possível verificar óleo para {veiculo}: {e}")

    def verificar_alerta_oleo_km(self, veiculo, km_atual, km_ultima_troca, km_limite=5000):
        """Verifica alerta de troca de óleo por quilometragem.

        Args:
            veiculo: Identificador do veículo.
            km_atual: Quilometragem atual.
            km_ultima_troca: Quilometragem na última troca de óleo.
            km_limite: Intervalo de KM entre trocas (padrão 5000).
        """
        try:
            km_atual = int(km_atual)
            km_ultima_troca = int(km_ultima_troca)
            km_proximo = km_ultima_troca + km_limite
            km_restante = km_proximo - km_atual

            if km_restante <= 0:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_OLEO_KM,
                    f"Troca de óleo atrasada por km. KM atual: {km_atual}, previsto: {km_proximo}.",
                    NIVEL_ALTO,
                )
            elif km_restante <= 500:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_OLEO_KM,
                    f"Troca de óleo em {km_restante} km.",
                    NIVEL_MEDIO,
                )
        except (ValueError, TypeError) as e:
            logger.debug(f"Não foi possível verificar óleo por km para {veiculo}: {e}")

    def verificar_alerta_bateria(self, veiculo, data_bateria):
        """Verifica alertas de bateria.

        Args:
            veiculo: Identificador do veículo.
            data_bateria: Data de instalação/última troca no formato DD/MM/YYYY.
        """
        try:
            data = datetime.strptime(str(data_bateria), '%d/%m/%Y')
            dias_limite = LIMITES_ALERTAS['dias_bateria']
            aviso_antecipado = LIMITES_ALERTAS['dias_aviso_antecipado']
            proxima_troca = data + timedelta(days=dias_limite)
            dias_restantes = (proxima_troca - datetime.now()).days

            if dias_restantes < 0:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_BATERIA,
                    f"Bateria vencida há {abs(dias_restantes)} dia(s).",
                    NIVEL_ALTO,
                )
            elif dias_restantes <= aviso_antecipado:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_BATERIA,
                    f"Bateria vence em {dias_restantes} dia(s).",
                    NIVEL_MEDIO,
                )
        except (ValueError, TypeError) as e:
            logger.debug(f"Não foi possível verificar bateria para {veiculo}: {e}")

    def verificar_alerta_pneu(self, veiculo, km_atual, km_pneu):
        """Verifica alertas de pneus por quilometragem.

        Args:
            veiculo: Identificador do veículo.
            km_atual: Quilometragem atual.
            km_pneu: Quilometragem na última troca de pneus.
        """
        try:
            km_atual = int(km_atual)
            km_pneu = int(km_pneu)
            km_limite = LIMITES_ALERTAS['km_pneu']
            km_proximo = km_pneu + km_limite
            km_restante = km_proximo - km_atual

            if km_restante <= 0:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_PNEU,
                    f"Pneus vencidos por km. KM atual: {km_atual}, previsto: {km_proximo}.",
                    NIVEL_ALTO,
                )
            elif km_restante <= 2000:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_PNEU,
                    f"Troca de pneus em {km_restante} km.",
                    NIVEL_MEDIO,
                )
        except (ValueError, TypeError) as e:
            logger.debug(f"Não foi possível verificar pneus para {veiculo}: {e}")

    def verificar_alerta_fipe(self, veiculo, gasto_total, valor_fipe):
        """Verifica alerta de gasto excessivo em relação ao valor FIPE.

        Args:
            veiculo: Identificador do veículo.
            gasto_total: Total gasto com o veículo (R$).
            valor_fipe: Valor estimado do veículo na tabela FIPE (R$).
        """
        try:
            gasto_total = float(str(gasto_total).replace('R$', '').replace('.', '').replace(',', '.').strip())
            valor_fipe = float(str(valor_fipe).replace('R$', '').replace('.', '').replace(',', '.').strip())

            if valor_fipe <= 0:
                return

            percentual = (gasto_total / valor_fipe) * 100
            limite = LIMITES_ALERTAS['percentual_fipe_critico']

            if percentual >= limite:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_FIPE,
                    f"Gasto total R${gasto_total:,.2f} representa {percentual:.1f}% do valor FIPE (R${valor_fipe:,.2f}).",
                    NIVEL_CRITICO,
                )
        except (ValueError, TypeError) as e:
            logger.debug(f"Não foi possível verificar FIPE para {veiculo}: {e}")

    def verificar_alerta_embreagem(self, veiculo, km_atual, km_ultima_troca, km_limite=30000):
        """Verifica alerta de embreagem por quilometragem.

        Args:
            veiculo: Identificador do veículo.
            km_atual: Quilometragem atual.
            km_ultima_troca: Quilometragem da última troca de embreagem.
            km_limite: Intervalo de KM entre trocas (padrão 30000).
        """
        try:
            km_atual = int(km_atual)
            km_ultima_troca = int(km_ultima_troca)
            km_proximo = km_ultima_troca + km_limite
            km_restante = km_proximo - km_atual

            if km_restante <= 0:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_EMBREAGEM,
                    f"Troca de embreagem atrasada. KM atual: {km_atual}, previsto: {km_proximo}.",
                    NIVEL_ALTO,
                )
            elif km_restante <= 2000:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_EMBREAGEM,
                    f"Troca de embreagem em {km_restante} km.",
                    NIVEL_MEDIO,
                )
        except (ValueError, TypeError) as e:
            logger.debug(f"Não foi possível verificar embreagem para {veiculo}: {e}")

    def verificar_alerta_status(self, veiculo, status):
        """Verifica alertas de status operacional.

        Args:
            veiculo: Identificador do veículo.
            status: Status atual do veículo (ex: 'INOPERANTE', 'MANUTENÇÃO').
        """
        status_criticos = {'INOPERANTE', 'BAIXADO', 'SINISTRO'}
        status_str = str(status).upper().strip()
        if status_str in status_criticos:
            self._adicionar_alerta(
                veiculo,
                TIPO_ALERTA_STATUS,
                f"Veículo com status: {status_str}.",
                NIVEL_ALTO,
            )

    def verificar_alerta_inspecao(self, veiculo, data_ultima_inspecao):
        """Verifica alertas de inspeção veicular.

        Args:
            veiculo: Identificador do veículo.
            data_ultima_inspecao: Data da última inspeção no formato DD/MM/YYYY.
        """
        try:
            data = datetime.strptime(str(data_ultima_inspecao), '%d/%m/%Y')
            dias_limite = LIMITES_ALERTAS['dias_inspecao']
            aviso_antecipado = LIMITES_ALERTAS['dias_aviso_antecipado']
            proxima = data + timedelta(days=dias_limite)
            dias_restantes = (proxima - datetime.now()).days

            if dias_restantes < 0:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_INSPECAO,
                    f"Inspeção vencida há {abs(dias_restantes)} dia(s).",
                    NIVEL_ALTO,
                )
            elif dias_restantes <= aviso_antecipado:
                self._adicionar_alerta(
                    veiculo,
                    TIPO_ALERTA_INSPECAO,
                    f"Inspeção vence em {dias_restantes} dia(s).",
                    NIVEL_MEDIO,
                )
        except (ValueError, TypeError) as e:
            logger.debug(f"Não foi possível verificar inspeção para {veiculo}: {e}")

    # ------------------------------------------------------------------
    # Consultas
    # ------------------------------------------------------------------

    def obter_alertas_criticos(self):
        """Retorna apenas os alertas de nível CRITICO."""
        return [a for a in self.alertas if a['nivel'] == NIVEL_CRITICO]

    def obter_alertas_urgentes(self):
        """Retorna alertas de nível ALTO."""
        return [a for a in self.alertas if a['nivel'] == NIVEL_ALTO]

    def obter_alertas_por_nivel(self, nivel):
        """Retorna alertas filtrados por nível.

        Args:
            nivel: Um dos valores NIVEL_CRITICO, NIVEL_ALTO ou NIVEL_MEDIO.
        """
        return [a for a in self.alertas if a['nivel'] == nivel]

    # ------------------------------------------------------------------
    # Envio
    # ------------------------------------------------------------------

    def enviar_alertas_telegram(self):
        """Envia todos os alertas acumulados via Telegram."""
        if not self.telegram or not self.alertas:
            return

        criticos = self.obter_alertas_criticos()
        urgentes = self.obter_alertas_urgentes()
        medios = self.obter_alertas_por_nivel(NIVEL_MEDIO)

        linhas = ['🚨 *ALERTAS DA FROTA*\n']

        if criticos:
            linhas.append('🔴 *CRÍTICOS*')
            for a in criticos:
                linhas.append(f"  • {a['veiculo']}: {a['mensagem']}")

        if urgentes:
            linhas.append('\n🟠 *ALTOS*')
            for a in urgentes:
                linhas.append(f"  • {a['veiculo']}: {a['mensagem']}")

        if medios:
            linhas.append('\n🟡 *MÉDIOS*')
            for a in medios:
                linhas.append(f"  • {a['veiculo']}: {a['mensagem']}")

        mensagem = '\n'.join(linhas)
        try:
            self.telegram.enviar_mensagem(mensagem)
            logger.info(f"✅ {len(self.alertas)} alerta(s) enviado(s) via Telegram")
        except Exception as e:
            logger.error(f"❌ Erro ao enviar alertas via Telegram: {e}")
