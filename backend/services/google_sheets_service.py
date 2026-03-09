import logging
import os
from typing import Any, Dict, List, Optional

from config.settings import settings
from models.schemas import SheetsStatus

logger = logging.getLogger(__name__)


class GoogleSheetsService:
    """Wrapper around gspread for reading/writing Google Sheets."""

    def __init__(self):
        self._client = None
        self._spreadsheet = None

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _ensure_connected(self) -> None:
        if self._client is None:
            self.connect()

    def connect(self) -> None:
        """Authenticate with Google using a service-account JSON key file."""
        credentials_path = settings.GOOGLE_CREDENTIALS_PATH
        sheet_id = settings.GOOGLE_SHEETS_ID

        if not sheet_id:
            raise RuntimeError("GOOGLE_SHEETS_ID is not configured")
        if not os.path.exists(credentials_path):
            raise FileNotFoundError(f"Google credentials file not found: {credentials_path}")

        try:
            import gspread
            from google.oauth2.service_account import Credentials

            scopes = [
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive",
            ]
            creds = Credentials.from_service_account_file(credentials_path, scopes=scopes)
            self._client = gspread.authorize(creds)
            self._spreadsheet = self._client.open_by_key(sheet_id)
            logger.info("Connected to Google Sheets (id=%s)", sheet_id)
        except Exception as exc:
            logger.error("Failed to connect to Google Sheets: %s", exc)
            raise

    # ── Public API ────────────────────────────────────────────────────────────

    def status(self) -> SheetsStatus:
        """Return connection status without raising on failure."""
        if not settings.GOOGLE_SHEETS_ID:
            return SheetsStatus(connected=False, message="GOOGLE_SHEETS_ID not configured")
        if not os.path.exists(settings.GOOGLE_CREDENTIALS_PATH):
            return SheetsStatus(
                connected=False,
                sheet_id=settings.GOOGLE_SHEETS_ID,
                message="Credentials file not found",
            )
        try:
            self._ensure_connected()
            # Lightweight check: list worksheet titles
            _ = [ws.title for ws in self._spreadsheet.worksheets()]
            return SheetsStatus(
                connected=True,
                sheet_id=settings.GOOGLE_SHEETS_ID,
                message="Connected successfully",
            )
        except Exception as exc:
            return SheetsStatus(
                connected=False,
                sheet_id=settings.GOOGLE_SHEETS_ID,
                message=str(exc),
            )

    def read_sheet(self, sheet_name: str, cell_range: Optional[str] = None) -> List[List[Any]]:
        """Read all values (or a specific range) from a worksheet."""
        self._ensure_connected()
        worksheet = self._spreadsheet.worksheet(sheet_name)
        if cell_range:
            return worksheet.get(cell_range)
        return worksheet.get_all_values()

    def write_sheet(self, sheet_name: str, cell_range: str, data: List[List[Any]]) -> Dict[str, Any]:
        """Write *data* into *cell_range* on *sheet_name*."""
        self._ensure_connected()
        worksheet = self._spreadsheet.worksheet(sheet_name)
        result = worksheet.update(cell_range, data)
        logger.info("Written %d rows to sheet '%s'", len(data), sheet_name)
        return result

    def sync_vehicles(self) -> List[Dict[str, Any]]:
        """Read vehicle rows from the 'Veículos' sheet and return as list of dicts."""
        self._ensure_connected()
        worksheet = self._spreadsheet.worksheet("Veículos")
        records = worksheet.get_all_records()
        logger.info("Synced %d vehicle records from Google Sheets", len(records))
        return records

    def export_report(self, request_data: Dict[str, Any], db=None) -> int:
        """Export data to Google Sheets based on request type. Returns number of rows written."""
        self._ensure_connected()
        data_type = request_data.get("data_type", "vehicles")
        sheet_name = request_data.get("sheet_name", data_type.capitalize())

        rows: List[List[Any]] = []

        if db is not None:
            if data_type == "vehicles":
                from models.vehicle import Vehicle

                vehicles = db.query(Vehicle).all()
                rows.append(["ID", "Placa", "Modelo", "Marca", "Ano", "KM", "Status"])
                for v in vehicles:
                    rows.append([v.id, v.placa, v.modelo, v.marca, v.ano, v.km_atual, v.status.value])

            elif data_type == "drivers":
                from models.driver import Driver

                drivers = db.query(Driver).all()
                rows.append(["ID", "Nome", "CPF", "CNH", "Categoria", "Status"])
                for d in drivers:
                    rows.append([d.id, d.nome, d.cpf, d.cnh, d.categoria_cnh, d.status.value])

            elif data_type == "maintenance":
                from models.maintenance import Maintenance

                records = db.query(Maintenance).all()
                rows.append(["ID", "Veículo ID", "Tipo", "Descrição", "Custo", "Data Serviço", "Status"])
                for m in records:
                    rows.append(
                        [
                            m.id,
                            m.vehicle_id,
                            m.tipo.value,
                            m.descricao or "",
                            m.custo,
                            str(m.data_servico.date()),
                            m.status.value,
                        ]
                    )

        if rows:
            # Ensure worksheet exists or create it
            try:
                ws = self._spreadsheet.worksheet(sheet_name)
            except Exception:
                ws = self._spreadsheet.add_worksheet(title=sheet_name, rows=len(rows) + 10, cols=20)
            ws.clear()
            ws.update("A1", rows)
            logger.info("Exported %d rows to sheet '%s'", len(rows) - 1, sheet_name)

        return max(0, len(rows) - 1)
