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