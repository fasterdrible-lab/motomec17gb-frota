import logging
from typing import List, Optional
from app.config import GOOGLE_SHEETS_ID, GOOGLE_CREDENTIALS_PATH

logger = logging.getLogger(__name__)

class GoogleSheetsIntegration:
    def __init__(self):
        self.client = None
        self.spreadsheet = None
        self._connect()

    def _connect(self):
        try:
            import gspread
            from google.oauth2.service_account import Credentials
            scopes = [
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive"
            ]
            creds = Credentials.from_service_account_file(GOOGLE_CREDENTIALS_PATH, scopes=scopes)
            self.client = gspread.authorize(creds)
            self.spreadsheet = self.client.open_by_key(GOOGLE_SHEETS_ID)
            logger.info("✅ Google Sheets conectado com sucesso")
        except Exception as e:
            logger.warning(f"⚠️ Google Sheets não disponível: {e}")

    def read_sheet(self, aba: str, range_: str = None) -> List[List]:
        if not self.spreadsheet:
            return []
        try:
            worksheet = self.spreadsheet.worksheet(aba)
            return worksheet.get_all_values()
        except Exception as e:
            logger.error(f"Erro ao ler aba {aba}: {e}")
            return []

    def write_sheet(self, aba: str, range_: str, data: List[List]) -> bool:
        if not self.spreadsheet:
            return False
        try:
            worksheet = self.spreadsheet.worksheet(aba)
            worksheet.update(range_, data)
            return True
        except Exception as e:
            logger.error(f"Erro ao escrever na aba {aba}: {e}")
            return False

    def sincronizar_frota(self, db_session) -> int:
        """Sincroniza dados da planilha com o banco de dados."""
        dados = self.read_sheet("Frota")
        if not dados or len(dados) < 2:
            return 0

        from app.models.frota import Viatura
        count = 0
        for linha in dados[1:]:
            if len(linha) >= 5 and linha[0]:
                placa = linha[0].strip()
                existing = db_session.query(Viatura).filter(Viatura.placa == placa).first()
                if not existing:
                    viatura = Viatura(
                        placa=placa,
                        prefixo=linha[1] if len(linha) > 1 else "",
                        modelo=linha[2] if len(linha) > 2 else "",
                        marca=linha[3] if len(linha) > 3 else "",
                    )
                    db_session.add(viatura)
                    count += 1
        db_session.commit()
        return count
