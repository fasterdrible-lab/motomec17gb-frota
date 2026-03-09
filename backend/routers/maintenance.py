from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from config.database import get_db
from models.maintenance import Maintenance, MaintenanceStatus
from models.driver import User
from models.schemas import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse, MaintenanceList
from routers.auth import get_current_active_user

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


def _get_maintenance_or_404(maintenance_id: int, db: Session) -> Maintenance:
    record = db.query(Maintenance).filter(Maintenance.id == maintenance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
    return record


@router.get("/alerts", response_model=List[MaintenanceResponse])
async def get_alerts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Return maintenance records due in the next 7 days or already overdue."""
    now = datetime.now(timezone.utc)
    alert_window = now + timedelta(days=7)
    records = (
        db.query(Maintenance)
        .filter(
            Maintenance.status != MaintenanceStatus.concluido,
            Maintenance.data_proximo_servico.isnot(None),
            Maintenance.data_proximo_servico <= alert_window,
        )
        .order_by(Maintenance.data_proximo_servico.asc())
        .all()
    )
    return records


@router.get("", response_model=MaintenanceList)
async def list_maintenance(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    vehicle_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    query = db.query(Maintenance)
    if vehicle_id:
        query = query.filter(Maintenance.vehicle_id == vehicle_id)
    if status:
        query = query.filter(Maintenance.status == status)
    if tipo:
        query = query.filter(Maintenance.tipo == tipo)
    total = query.count()
    items = query.order_by(Maintenance.data_servico.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return MaintenanceList(items=items, total=total, page=page, page_size=page_size)


@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
async def get_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return _get_maintenance_or_404(maintenance_id, db)


@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance(
    maintenance_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    record = Maintenance(**maintenance_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
async def update_maintenance(
    maintenance_id: int,
    maintenance_in: MaintenanceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    record = _get_maintenance_or_404(maintenance_id, db)
    for field, value in maintenance_in.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    record = _get_maintenance_or_404(maintenance_id, db)
    db.delete(record)
    db.commit()
