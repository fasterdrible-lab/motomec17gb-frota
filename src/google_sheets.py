import gspread
from oauth2client.service_account import ServiceAccountCredentials
import logging
from config import GOOGLE_SHEETS_ID, GOOGLE_CREDENTIALS_PATH

logger = logging.getLogger(__name__)

class GoogleSheetsAPI:
    def __init__(self):
        """Inicializa conexão com Google Sheets"""
        try:
            scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
            creds = ServiceAccountCredentials.from_json_keyfile_name(GOOGLE_CREDENTIALS_PATH, scope)
            self.client = gspread.authorize(creds)
            self.sheet = self.client.open_by_key(GOOGLE_SHEETS_ID)
            logger.info("✅ Google Sheets conectado com sucesso")
        except Exception as e:
            logger.error(f"❌ Erro ao conectar Google Sheets: {e}")
            self.client = None
            self.sheet = None

    def read_sheet(self, sheet_name, range_name):
        """Lê dados da planilha"""
        try:
            if not self.sheet:
                logger.warning("⚠️ Google Sheets não está conectado")
                return []
            
            worksheet = self.sheet.worksheet(sheet_name)
            return worksheet.range(range_name)
        except Exception as e:
            logger.error(f"❌ Erro ao ler planilha: {e}")
            return []

    def write_sheet(self, sheet_name, range_name, data):
        """Escreve dados na planilha"""
        try:
            if not self.sheet:
                logger.warning("⚠️ Google Sheets não está conectado")
                return False
            
            worksheet = self.sheet.worksheet(sheet_name)
            worksheet.update(range_name, data)
            logger.info(f"✅ Dados escritos em {sheet_name}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao escrever na planilha: {e}")
            return False