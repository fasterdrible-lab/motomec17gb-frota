from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.manutencao import Manutencao
from app.models.frota import Viatura
from app.schemas.manutencao_schema import ManutencaoCreate, ManutencaoResponse, ManutencaoUpdate
from app.services.manutencao_service import ManutencaoService

router = APIRouter(prefix="/manutencao", tags=["Manutenção"])
service = ManutencaoService()


@router.get("/", response_model=List[ManutencaoResponse])
def list_manutencoes(
    status_filter: Optional[str] = Query(None, alias="status"),
    viatura_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """List all maintenance records, optionally filtered."""
    query = db.query(Manutencao)
    if status_filter:
        query = query.filter(Manutencao.status == status_filter)
    if viatura_id:
        query = query.filter(Manutencao.viatura_id == viatura_id)
    return query.order_by(Manutencao.data_proximo.asc().nullslast()).all()


@router.get("/pendentes", response_model=List[ManutencaoResponse])
def list_pendentes(db: Session = Depends(get_db)):
    """List all pending maintenance records."""
    return db.query(Manutencao).filter(Manutencao.status == "pendente").all()


@router.get("/vencidas", response_model=List[ManutencaoResponse])
def list_vencidas(db: Session = Depends(get_db)):
    """List all overdue maintenance records."""
    vencidas = service.detectar_vencidas(db)
    return vencidas


@router.get("/viatura/{viatura_id}", response_model=List[ManutencaoResponse])
def get_by_viatura(viatura_id: int, db: Session = Depends(get_db)):
    """Get all maintenance records for a specific viatura."""
    return db.query(Manutencao).filter(Manutencao.viatura_id == viatura_id).all()


@router.get("/{manutencao_id}", response_model=ManutencaoResponse)
def get_manutencao(manutencao_id: int, db: Session = Depends(get_db)):
    """Get a single maintenance record by ID."""
    m = db.query(Manutencao).filter(Manutencao.id == manutencao_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manutenção não encontrada")
    return m


@router.post("/", response_model=ManutencaoResponse, status_code=status.HTTP_201_CREATED)
def create_manutencao(payload: ManutencaoCreate, db: Session = Depends(get_db)):
    """Create a maintenance record."""
    viatura = db.query(Viatura).filter(Viatura.id == payload.viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viatura não encontrada")
    m = Manutencao(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.put("/{manutencao_id}", response_model=ManutencaoResponse)
def update_manutencao(manutencao_id: int, payload: ManutencaoUpdate, db: Session = Depends(get_db)):
    """Update a maintenance record."""
    m = db.query(Manutencao).filter(Manutencao.id == manutencao_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manutenção não encontrada")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return m
