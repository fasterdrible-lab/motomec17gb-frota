from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from config.database import get_db
from models.driver import Driver, User
from models.schemas import DriverCreate, DriverUpdate, DriverResponse, DriverList
from routers.auth import get_current_active_user

router = APIRouter(prefix="/drivers", tags=["drivers"])


def _get_driver_or_404(driver_id: int, db: Session) -> Driver:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


@router.get("", response_model=DriverList)
async def list_drivers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    query = db.query(Driver)
    if status:
        query = query.filter(Driver.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(Driver.nome.ilike(like) | Driver.cpf.ilike(like))
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return DriverList(items=items, total=total, page=page, page_size=page_size)


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return _get_driver_or_404(driver_id, db)


@router.post("", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    driver_in: DriverCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    if db.query(Driver).filter(Driver.cpf == driver_in.cpf).first():
        raise HTTPException(status_code=400, detail="Driver with this CPF already exists")
    if db.query(Driver).filter(Driver.cnh == driver_in.cnh).first():
        raise HTTPException(status_code=400, detail="Driver with this CNH already exists")
    driver = Driver(**driver_in.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: int,
    driver_in: DriverUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    driver = _get_driver_or_404(driver_id, db)
    update_data = driver_in.model_dump(exclude_unset=True)
    if "cpf" in update_data:
        existing = db.query(Driver).filter(
            Driver.cpf == update_data["cpf"], Driver.id != driver_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="CPF already in use by another driver")
    for field, value in update_data.items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    driver = _get_driver_or_404(driver_id, db)
    db.delete(driver)
    db.commit()
