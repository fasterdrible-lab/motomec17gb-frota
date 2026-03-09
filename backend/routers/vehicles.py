from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from config.database import get_db
from models.vehicle import Vehicle
from models.maintenance import Maintenance
from models.schemas import VehicleCreate, VehicleUpdate, VehicleResponse, VehicleList, MaintenanceResponse
from routers.auth import get_current_active_user
from models.driver import User

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def _get_vehicle_or_404(vehicle_id: int, db: Session) -> Vehicle:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.get("", response_model=VehicleList)
async def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    query = db.query(Vehicle)
    if status:
        query = query.filter(Vehicle.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(
            Vehicle.placa.ilike(like) | Vehicle.modelo.ilike(like) | Vehicle.marca.ilike(like)
        )
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return VehicleList(items=items, total=total, page=page, page_size=page_size)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return _get_vehicle_or_404(vehicle_id, db)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    if db.query(Vehicle).filter(Vehicle.placa == vehicle_in.placa).first():
        raise HTTPException(status_code=400, detail="Vehicle with this placa already exists")
    vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    vehicle = _get_vehicle_or_404(vehicle_id, db)
    update_data = vehicle_in.model_dump(exclude_unset=True)
    if "placa" in update_data:
        existing = db.query(Vehicle).filter(
            Vehicle.placa == update_data["placa"], Vehicle.id != vehicle_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Placa already in use by another vehicle")
    for field, value in update_data.items():
        setattr(vehicle, field, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    vehicle = _get_vehicle_or_404(vehicle_id, db)
    db.delete(vehicle)
    db.commit()


@router.get("/{vehicle_id}/maintenance", response_model=List[MaintenanceResponse])
async def get_vehicle_maintenance(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    _get_vehicle_or_404(vehicle_id, db)
    records = (
        db.query(Maintenance)
        .filter(Maintenance.vehicle_id == vehicle_id)
        .order_by(Maintenance.data_servico.desc())
        .all()
    )
    return records
