from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.frota import Viatura
from app.models.gastos import Gasto
from app.schemas.frota_schema import ViaturaCreate, ViaturaResponse, ViaturaUpdate

router = APIRouter(prefix="/frota", tags=["Frota"])


@router.get("/", response_model=List[ViaturaResponse])
def list_viaturas(
    status: Optional[str] = Query(None, description="Filter by status"),
    unidade: Optional[str] = Query(None, description="Filter by unidade"),
    db: Session = Depends(get_db),
):
    """List all viaturas with optional filters."""
    query = db.query(Viatura)
    if status:
        query = query.filter(Viatura.status == status)
    if unidade:
        query = query.filter(Viatura.unidade == unidade)
    return query.order_by(Viatura.prefixo).all()


@router.get("/{viatura_id}", response_model=ViaturaResponse)
def get_viatura(viatura_id: int, db: Session = Depends(get_db)):
    """Get a single viatura by ID."""
    viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viatura não encontrada")
    return viatura


@router.post("/", response_model=ViaturaResponse, status_code=status.HTTP_201_CREATED)
def create_viatura(payload: ViaturaCreate, db: Session = Depends(get_db)):
    """Create a new viatura."""
    existing = db.query(Viatura).filter(Viatura.placa == payload.placa).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Viatura com placa '{payload.placa}' já existe",
        )
    viatura = Viatura(**payload.model_dump())
    db.add(viatura)
    db.commit()
    db.refresh(viatura)
    return viatura


@router.put("/{viatura_id}", response_model=ViaturaResponse)
def update_viatura(viatura_id: int, payload: ViaturaUpdate, db: Session = Depends(get_db)):
    """Update an existing viatura."""
    viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viatura não encontrada")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(viatura, field, value)
    db.commit()
    db.refresh(viatura)
    return viatura


@router.delete("/{viatura_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_viatura(viatura_id: int, db: Session = Depends(get_db)):
    """Delete a viatura and all its related records."""
    viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viatura não encontrada")
    db.delete(viatura)
    db.commit()


@router.get("/{viatura_id}/resumo")
def get_viatura_resumo(viatura_id: int, db: Session = Depends(get_db)):
    """Return a viatura summary including total gastos and basic info."""
    viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viatura não encontrada")

    total_gastos = (
        db.query(func.sum(Gasto.valor)).filter(Gasto.viatura_id == viatura_id).scalar() or 0.0
    )
    percentual_fipe = 0.0
    if viatura.valor_fipe and viatura.valor_fipe > 0:
        percentual_fipe = round((total_gastos / viatura.valor_fipe) * 100, 2)

    return {
        "id": viatura.id,
        "placa": viatura.placa,
        "prefixo": viatura.prefixo,
        "modelo": viatura.modelo,
        "marca": viatura.marca,
        "ano": viatura.ano,
        "status": viatura.status,
        "unidade": viatura.unidade,
        "km_atual": viatura.km_atual,
        "valor_fipe": viatura.valor_fipe,
        "total_gastos": round(total_gastos, 2),
        "percentual_fipe": percentual_fipe,
    }
