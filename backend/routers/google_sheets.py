import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from models.driver import User
from models.schemas import SheetsExportRequest, SheetsStatus
from routers.auth import get_current_active_user
from services.google_sheets_service import GoogleSheetsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sheets", tags=["google_sheets"])


def _get_service() -> GoogleSheetsService:
    return GoogleSheetsService()


@router.get("/status", response_model=SheetsStatus)
async def sheets_status(_: User = Depends(get_current_active_user)):
    service = _get_service()
    return service.status()


@router.get("/vehicles", response_model=List[Dict[str, Any]])
async def sync_vehicles_from_sheets(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = _get_service()
    try:
        data = service.sync_vehicles()
        return data
    except Exception as exc:
        logger.error("Failed to sync vehicles from Google Sheets: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/export")
async def export_to_sheets(
    request: SheetsExportRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = _get_service()
    try:
        result = service.export_report(request.model_dump(), db=db)
        return {"message": "Export successful", "rows_written": result}
    except Exception as exc:
        logger.error("Failed to export to Google Sheets: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
