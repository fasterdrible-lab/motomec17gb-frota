import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mototec")
SECRET_KEY = os.getenv("SECRET_KEY", "mototec-secret-key-17gb")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

GOOGLE_SHEETS_ID = os.getenv("GOOGLE_SHEETS_ID", "")
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "config/credentials.json")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

FIPE_API_URL = os.getenv("FIPE_API_URL", "https://parallelum.com.br/fipe/api/v1")

ALERT_CHECK_INTERVAL = int(os.getenv("ALERT_CHECK_INTERVAL", "1"))

LIMITES = {
    "km_troca_oleo": 10000,
    "meses_troca_oleo": 6,
    "km_revisao_freio": 15000,
    "meses_revisao_freio": 12,
    "meses_troca_bateria": 12,
    "km_troca_pneus": 30000,
    "anos_troca_pneus": 3,
    "km_revisao_geral": 20000,
    "dias_alerta_antecipado": 7,
    "km_alerta_antecipado": 1000,
    "dias_defeito_critico": 7,
    "dias_viatura_baixada_critico": 30,
    "percentual_fipe_alerta": 10,
}
