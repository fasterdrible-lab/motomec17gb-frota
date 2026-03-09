import logging
import threading
import time
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False

from app.config import settings
from app.models.frota import Viatura
from app.models.gastos import Gasto
from app.utils.helpers import parse_km

logger = logging.getLogger(__name__)

SHEET_TABS = {
    "FROTA": "FROTA",
    "1SGB": "1SGB",
    "2SGB": "2SGB",
    "ABASTECIMENTO_VTR": "ABASTECIMENTO_VTR",
    "FICHA_COM_DEFEITO": "FICHA_COM_DEFEITO",
    "RIV_2026": "RIV_2026",
    "CONTROLE_ORDEM_SERVICO": "CONTROLE_ORDEM_SERVIÇO",
    "GASTOS": "GASTOS",
}


class GoogleSheetsIntegration:
    """Wraps the existing Google Sheets logic and integrates with the PostgreSQL backend."""

    def __init__(self) -> None:
        self.client: Optional[Any] = None
        self.spreadsheet: Optional[Any] = None
        self._connect()

    def _connect(self) -> None:
        """Establish connection to Google Sheets."""
        if not GSPREAD_AVAILABLE:
            logger.warning("gspread not installed — Google Sheets integration disabled")
            return
        try:
            scope = [
                "https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive",
            ]
            creds = ServiceAccountCredentials.from_json_keyfile_name(
                settings.GOOGLE_CREDENTIALS_PATH, scope
            )
            self.client = gspread.authorize(creds)
            self.spreadsheet = self.client.open_by_key(settings.GOOGLE_SHEETS_ID)
            logger.info("✅ Google Sheets conectado — ID: %s", settings.GOOGLE_SHEETS_ID)
        except Exception as exc:
            logger.error("❌ Erro ao conectar Google Sheets: %s", exc)
            self.client = None
            self.spreadsheet = None

    def _get_worksheet(self, tab_name: str) -> Optional[Any]:
        """Return a worksheet by tab name, or None on failure."""
        if not self.spreadsheet:
            return None
        try:
            return self.spreadsheet.worksheet(tab_name)
        except Exception as exc:
            logger.error("Erro ao acessar aba '%s': %s", tab_name, exc)
            return None

    # ------------------------------------------------------------------
    # Read helpers
    # ------------------------------------------------------------------

    def read_frota_data(self) -> List[Dict[str, Any]]:
        """Read all rows from the FROTA tab.

        Returns:
            List of dicts keyed by column header.
        """
        ws = self._get_worksheet(SHEET_TABS["FROTA"])
        if not ws:
            return []
        try:
            records = ws.get_all_records()
            logger.info("Lidas %d linhas da aba FROTA", len(records))
            return records
        except Exception as exc:
            logger.error("Erro ao ler FROTA: %s", exc)
            return []

    def read_gastos_data(self) -> List[Dict[str, Any]]:
        """Read all rows from the GASTOS tab.

        Returns:
            List of dicts keyed by column header.
        """
        ws = self._get_worksheet(SHEET_TABS["GASTOS"])
        if not ws:
            return []
        try:
            records = ws.get_all_records()
            logger.info("Lidas %d linhas da aba GASTOS", len(records))
            return records
        except Exception as exc:
            logger.error("Erro ao ler GASTOS: %s", exc)
            return []

    def read_tab(self, tab_key: str) -> List[Dict[str, Any]]:
        """Generic tab reader using a SHEET_TABS key.

        Args:
            tab_key: One of the keys in SHEET_TABS.

        Returns:
            List of row dicts.
        """
        tab = SHEET_TABS.get(tab_key)
        if not tab:
            logger.warning("Tab key '%s' not found", tab_key)
            return []
        ws = self._get_worksheet(tab)
        if not ws:
            return []
        try:
            return ws.get_all_records()
        except Exception as exc:
            logger.error("Erro ao ler aba '%s': %s", tab, exc)
            return []

    # ------------------------------------------------------------------
    # Sync operations
    # ------------------------------------------------------------------

    def sync_to_db(self, db: Session) -> int:
        """Sync vehicle data from Google Sheets into PostgreSQL.

        Inserts new vehicles and updates existing ones (matched by placa).

        Args:
            db: SQLAlchemy session.

        Returns:
            Number of records upserted.
        """
        rows = self.read_frota_data()
        count = 0
        for row in rows:
            placa = str(row.get("PLACA", "")).strip().upper()
            if not placa:
                continue
            viatura = db.query(Viatura).filter(Viatura.placa == placa).first()
            if viatura:
                viatura.modelo = str(row.get("MODELO", viatura.modelo))
                viatura.km_atual = parse_km(row.get("KM", viatura.km_atual))
            else:
                viatura = Viatura(
                    placa=placa,
                    prefixo=str(row.get("PREFIXO", placa)),
                    modelo=str(row.get("MODELO", "Desconhecido")),
                    marca=str(row.get("MARCA", "Desconhecido")),
                    ano=int(row.get("ANO", 2000) or 2000),
                    unidade=str(row.get("UNIDADE", "Admin")),
                    km_atual=parse_km(row.get("KM", 0)),
                )
                db.add(viatura)
            count += 1
        db.commit()
        logger.info("sync_to_db: %d viaturas sincronizadas", count)
        return count

    def sync_from_db(self, db: Session) -> bool:
        """Write current DB viatura data back to the FROTA sheet.

        Args:
            db: SQLAlchemy session.

        Returns:
            True on success, False on failure.
        """
        ws = self._get_worksheet(SHEET_TABS["FROTA"])
        if not ws:
            return False
        try:
            viaturas = db.query(Viatura).all()
            rows = [["PLACA", "PREFIXO", "MODELO", "MARCA", "ANO", "KM", "STATUS", "UNIDADE"]]
            for v in viaturas:
                rows.append([v.placa, v.prefixo, v.modelo, v.marca, v.ano, v.km_atual, v.status, v.unidade])
            ws.clear()
            ws.update("A1", rows)
            logger.info("sync_from_db: %d viaturas gravadas na planilha", len(viaturas))
            return True
        except Exception as exc:
            logger.error("Erro no sync_from_db: %s", exc)
            return False

    def schedule_sync(self, db_factory: Any, interval_minutes: int = 5) -> threading.Thread:
        """Start a background thread that syncs every *interval_minutes* minutes.

        Args:
            db_factory: Callable that returns a new DB session.
            interval_minutes: Sync interval.

        Returns:
            The daemon thread (already started).
        """
        def _loop() -> None:
            while True:
                try:
                    db = db_factory()
                    self.sync_to_db(db)
                    db.close()
                except Exception as exc:
                    logger.error("Erro no schedule_sync: %s", exc)
                time.sleep(interval_minutes * 60)

        thread = threading.Thread(target=_loop, daemon=True, name="sheets-sync")
        thread.start()
        logger.info("Google Sheets sync agendado a cada %d minuto(s)", interval_minutes)
        return thread
