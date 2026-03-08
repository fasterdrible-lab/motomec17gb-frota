import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import logging
import time
from datetime import datetime
from config import ALERT_CHECK_INTERVAL, logger
from google_sheets import GoogleSheetsAPI
from fipe_api import FIPEApi
from telegram_bot import TelegramBot
from alertas import GerenciadorAlertas

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class SistemaFrota:
    def __init__(self):
        """Inicializa o sistema de gestão da frota"""
        logger.info("=" * 60)
        logger.info("🚀 INICIANDO SISTEMA DE GESTÃO DE FROTA")
        logger.info("=" * 60)
        
        try:
            self.sheets = GoogleSheetsAPI()
            self.fipe = FIPEApi()
            self.telegram = TelegramBot()
            self.alertas = GerenciadorAlertas(self.telegram)
            logger.info("✅ Todos os módulos inicializados com sucesso!")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar sistema: {e}")
            raise

    def carregar_veiculos(self):
        """Carrega dados dos veículos da planilha"""
        try:
            logger.info("📥 Carregando dados dos veículos...")
            dados = self.sheets.read_sheet('Frota', 'A:H')
            
            if not dados:
                logger.warning("⚠️ Nenhum dado encontrado na planilha")
                return []
            
            veiculos = []
            for i, linha in enumerate(dados[1:], start=2):  # Pular cabeçalho
                if len(linha) >= 8:
                    veiculo = {
                        'id': linha[0],
                        'modelo': linha[1],
                        'placa': linha[2],
                        'km_atual': linha[3],
                        'data_ultimo_oleo': linha[4],
                        'data_ultima_inspecao': linha[5],
                        'data_bateria': linha[6],
                        'km_pneu': linha[7]
                    }
                    veiculos.append(veiculo)
            
            logger.info(f"✅ {len(veiculos)} veículos carregados")
            return veiculos
        except Exception as e:
            logger.error(f"❌ Erro ao carregar veículos: {e}")
            return []

    def verificar_alertas_frota(self, veiculos):
        """Verifica alertas para todos os veículos
        
        Args:
            veiculos: Lista de veículos
        """
        logger.info("🔍 Verificando alertas da frota...")
        self.alertas.limpar_alertas()
        
        for veiculo in veiculos:
            try:
                # Verificar óleo
                if veiculo.get('data_ultimo_oleo'):
                    self.alertas.verificar_alerta_oleo(
                        veiculo['modelo'],
                        veiculo['data_ultimo_oleo']
                    )
                
                # Verificar pneus
                if veiculo.get('km_atual') and veiculo.get('km_pneu'):
                    self.alertas.verificar_alerta_pneu(
                        veiculo['modelo'],
                        veiculo['km_atual'],
                        veiculo['km_pneu']
                    )
                
                # Verificar bateria
                if veiculo.get('data_bateria'):
                    self.alertas.verificar_alerta_bateria(
                        veiculo['modelo'],
                        veiculo['data_bateria']
                    )
                
                # Verificar inspeção
                if veiculo.get('data_ultima_inspecao'):
                    self.alertas.verificar_alerta_inspecao(
                        veiculo['modelo'],
                        veiculo['data_ultima_inspecao']
                    )
            except Exception as e:
                logger.error(f"❌ Erro ao verificar alertas do veículo {veiculo.get('modelo')}: {e}")

    def gerar_relatorio(self, veiculos):
        """Gera relatório da frota
        
        Args:
            veiculos: Lista de veículos
        
        Returns:
            Dicionário com dados do relatório
        """
        alertas_criticos = self.alertas.obter_alertas_criticos()
        alertas_urgentes = self.alertas.obter_alertas_urgentes()
        
        relatorio = {
            'total_veiculos': len(veiculos),
            'manutencoes_pendentes': len(self.alertas.alertas),
            'alertas_criticos': len(alertas_criticos),
            'alertas_urgentes': len(alertas_urgentes),
            'veiculos_em_dia': len(veiculos) - len(self.alertas.alertas),
            'proximas_acoes': self._gerar_proximas_acoes(alertas_criticos, alertas_urgentes)
        }
        
        return relatorio

    def _gerar_proximas_acoes(self, criticos, urgentes):
        """Gera lista de próximas ações"""
        acoes = []
        
        for alerta in criticos[:3]:
            acoes.append(f"🔴 {alerta['veiculo']} - {alerta['tipo']}")
        
        for alerta in urgentes[:2]:
            acoes.append(f"🟠 {alerta['veiculo']} - {alerta['tipo']}")
        
        return '\n'.join(acoes) if acoes else "✅ Nenhuma ação urgente"

    def atualizar_relatorio(self, relatorio):
        """Atualiza relatório na planilha
        
        Args:
            relatorio: Dicionário com dados do relatório
        """
        try:
            logger.info("📊 Atualizando relatório na planilha...")
            
            dados = [
                ['Métrica', 'Valor'],
                ['Total de Veículos', str(relatorio['total_veiculos'])],
                ['Manutenções Pendentes', str(relatorio['manutencoes_pendentes'])],
                ['Alertas Críticos', str(relatorio['alertas_criticos'])],
                ['Alertas Urgentes', str(relatorio['alertas_urgentes'])],
                ['Veículos em Dia', str(relatorio['veiculos_em_dia'])],
                ['Última Atualização', datetime.now().strftime('%d/%m/%Y %H:%M:%S')]
            ]
            
            self.sheets.write_sheet('Relatório', 'A:B', dados)
            logger.info("✅ Relatório atualizado")
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar relatório: {e}")

    def enviar_relatorio_telegram(self, relatorio):
        """Envia relatório via Telegram
        
        Args:
            relatorio: Dicionário com dados do relatório
        """
        try:
            if self.telegram.telegram_bot:
                self.telegram.enviar_relatorio_diario(relatorio)
                logger.info("✅ Relatório enviado via Telegram")
        except Exception as e:
            logger.error(f"❌ Erro ao enviar relatório: {e}")

    def executar_ciclo(self):
        """Executa um ciclo completo de verificação"""
        logger.info("\n" + "=" * 60)
        logger.info(f"⏰ Ciclo iniciado em {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        logger.info("=" * 60)
        
        try:
            # Carregar veículos
            veiculos = self.carregar_veiculos()
            
            if not veiculos:
                logger.error("❌ Nenhum veículo para processar")
                return
            
            # Verificar alertas
            self.verificar_alertas_frota(veiculos)
            
            # Gerar relatório
            relatorio = self.gerar_relatorio(veiculos)
            
            # Atualizar planilha
            self.atualizar_relatorio(relatorio)
            
            # Enviar alertas via Telegram
            self.alertas.enviar_alertas_telegram()
            
            # Enviar relatório via Telegram
            self.enviar_relatorio_telegram(relatorio)
            
            logger.info("✅ Ciclo concluído com sucesso!")
            logger.info("=" * 60)
        except Exception as e:
            logger.error(f"❌ Erro durante o ciclo: {e}")
            if self.telegram.bot:
                self.telegram.enviar_alerta(
                    "ERRO NO SISTEMA",
                    f"Erro durante execução: {str(e)}",
                    "🔴"
                )

    def iniciar_monitoramento(self):
        """Inicia monitoramento contínuo
        
        Executa verificações a cada ALERT_CHECK_INTERVAL horas
        """
        logger.info(f"⏳ Monitoramento iniciado (intervalo: {ALERT_CHECK_INTERVAL}h)")
        
        try:
            while True:
                self.executar_ciclo()
                
                # Aguardar próximo ciclo
                tempo_espera = ALERT_CHECK_INTERVAL * 3600
                logger.info(f"⏳ Próxima verificação em {ALERT_CHECK_INTERVAL} hora(s)")
                time.sleep(tempo_espera)
        except KeyboardInterrupt:
            logger.info("\n🛑 Monitoramento interrompido pelo usuário")
        except Exception as e:
            logger.error(f"❌ Erro fatal no monitoramento: {e}")

    def teste_rapido(self):
        """Executa um teste r  pido do sistema"""
        logger.info("🧪 Executando teste rápido...")
        
        try:
            # Testar Google Sheets
            logger.info("✓ Testando Google Sheets...")
            self.sheets.read_sheet('Frota', 'A1:A1')
            
            # Testar FIPE
            logger.info("✓ Testando FIPE API...")
            marcas = self.fipe.get_marcas('carros')
            if marcas:
                logger.info(f"  → {len(marcas)} marcas disponíveis")
            
            # Testar Telegram
            logger.info("✓ Testando Telegram...")
            if self.telegram.teste_conexao():
                self.telegram.enviar_mensagem("✅ Sistema de Frota inicializado com sucesso!")
            
            logger.info("✅ Teste concluído com sucesso!")
            return True
        except Exception as e:
            logger.error(f"❌ Erro no teste: {e}")
            return False

if __name__ == '__main__':
    try:
        sistema = SistemaFrota()
        
        # Executar teste rápido
        if sistema.teste_rapido():
            # Executar um ciclo
            sistema.executar_ciclo()
            
            # Descomentar a linha abaixo para monitoramento contínuo
            # sistema.iniciar_monitoramento()
        else:
            logger.error("❌ Teste falhou, verifique as configurações")
    except Exception as e:
        logger.error(f"❌ Erro fatal: {e}")