from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.abastecimento import Abastecimento
from app.models.frota import Viatura
from app.schemas.abastecimento_schema import AbastecimentoCreate, AbastecimentoResponse

router = APIRouter(prefix="/abastecimento", tags=["Abastecimento"])


@router.get("/", response_model=List[AbastecimentoResponse])
def list_abastecimentos(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """List fuel records with optional date range filter."""
    query = db.query(Abastecimento)
    if data_inicio:
        query = query.filter(Abastecimento.data >= data_inicio)
    if data_fim:
        query = query.filter(Abastecimento.data <= data_fim)
    return query.order_by(Abastecimento.data.desc()).all()


@router.get("/relatorio")
def relatorio_consumo(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Consumption report: total litres, total cost, average cost per litre."""
    query = db.query(
        func.sum(Abastecimento.quantidade_litros),
        func.sum(Abastecimento.valor_total),
        func.count(Abastecimento.id),
    )
    if data_inicio:
        query = query.filter(Abastecimento.data >= data_inicio)
    if data_fim:
        query = query.filter(Abastecimento.data <= data_fim)
    result = query.first()
    total_litros = round(result[0] or 0.0, 2)
    total_valor = round(result[1] or 0.0, 2)
    total_count = result[2] or 0
    return {
        "total_litros": total_litros,
        "total_valor": total_valor,
        "count": total_count,
        "media_preco_litro": round(total_valor / total_litros, 4) if total_litros else 0,
    }


@router.get("/viatura/{viatura_id}", response_model=List[AbastecimentoResponse])
def get_by_viatura(viatura_id: int, db: Session = Depends(get_db)):
    """Get all fuel records for a specific viatura."""
    return (
        db.query(Abastecimento)
        .filter(Abastecimento.viatura_id == viatura_id)
        .order_by(Abastecimento.data.desc())
        .all()
    )


@router.get("/{abastecimento_id}", response_model=AbastecimentoResponse)
def get_abastecimento(abastecimento_id: int, db: Session = Depends(get_db)):
    """Get a single fuel record by ID."""
    a = db.query(Abastecimento).filter(Abastecimento.id == abastecimento_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Abastecimento não encontrado")
    return a


@router.post("/", response_model=AbastecimentoResponse, status_code=status.HTTP_201_CREATED)
def create_abastecimento(payload: AbastecimentoCreate, db: Session = Depends(get_db)):
    """Create a new fuel record."""
    viatura = db.query(Viatura).filter(Viatura.id == payload.viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viatura não encontrada")
    a = Abastecimento(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a
