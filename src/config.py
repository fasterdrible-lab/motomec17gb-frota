import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
import logging

# Carregar variáveis de ambiente
load_dotenv()

# ============= CONFIGURAÇÃO DE ALERTAS =============
ALERT_CHECK_INTERVAL = int(os.getenv('ALERT_CHECK_INTERVAL', '1'))  # Intervalo em horas

# ============= GOOGLE SHEETS =============
GOOGLE_SHEETS_ID = os.getenv('GOOGLE_SHEETS_ID', '1d6wy9iQ4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4O')
GOOGLE_CREDENTIALS_PATH = os.getenv('GOOGLE_CREDENTIALS_PATH', 'config/credentials.json')

# ============= TELEGRAM =============
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '')

# ============= FIPE API =============
FIPE_API_URL = os.getenv('FIPE_API_URL', 'https://parallelum.com.br/fipe/api/v1')

# ============= LOGGING =============
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# ============= LIMITES DE ALERTAS =============
LIMITE_DIAS_OLEO = 30  # Dias para trocar óleo
LIMITE_KM_PNEU = 50000  # KM para trocar pneu
LIMITE_DIAS_BATERIA = 365  # Dias para trocar bateria
LIMITE_DIAS_INSPECAO = 180  # Dias para inspeção

LIMITES_ALERTAS = {
    'dias_oleo': LIMITE_DIAS_OLEO,
    'km_pneu': LIMITE_KM_PNEU,
    'dias_bateria': LIMITE_DIAS_BATERIA,
    'dias_inspecao': LIMITE_DIAS_INSPECAO,
    'percentual_fipe_critico': 60,   # % gasto vs FIPE — nível crítico
    'dias_aviso_antecipado': 7,       # Dias de antecedência para alertas médios
}

# ============= ABAS DA PLANILHA =============
ABAS_PLANILHA = {
    'FROTA': 'FROTA',
    '1SGB': '1SGB',
    '2SGB': '2SGB',
    'ABASTECIMENTO_VTR': 'ABASTECIMENTO_VTR',
    'FICHA_COM_DEFEITO': 'FICHA_COM_DEFEITO',
    'RIV_2026': 'RIV_2026',
    'CONTROLE_ORDEM_SERVICO': 'CONTROLE_ORDEM_SERVIÇO',
    'GASTOS': 'GASTOS',
}