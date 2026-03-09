from datetime import date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.gastos import Gasto
from app.models.frota import Viatura
from app.schemas.gastos_schema import GastoCreate, GastoResponse, GastoUpdate

router = APIRouter(prefix="/gastos", tags=["Gastos"])


@router.get("/por-viatura")
def gastos_por_viatura(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Return total gastos per viatura."""
    rows = (
        db.query(Viatura.id, Viatura.prefixo, Viatura.placa, func.sum(Gasto.valor).label("total"))
        .join(Gasto, Gasto.viatura_id == Viatura.id, isouter=True)
        .group_by(Viatura.id, Viatura.prefixo, Viatura.placa)
        .all()
    )
    return [
        {"viatura_id": r[0], "prefixo": r[1], "placa": r[2], "total": round(r[3] or 0, 2)}
        for r in rows
    ]


@router.get("/por-categoria")
def gastos_por_categoria(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Return total gastos grouped by category."""
    rows = (
        db.query(Gasto.categoria, func.sum(Gasto.valor).label("total"))
        .group_by(Gasto.categoria)
        .all()
    )
    return [{"categoria": r[0], "total": round(r[1], 2)} for r in rows]


@router.get("/", response_model=List[GastoResponse])
def list_gastos(
    categoria: Optional[str] = Query(None),
    viatura_id: Optional[int] = Query(None),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """List gastos with optional filters."""
    query = db.query(Gasto)
    if categoria:
        query = query.filter(Gasto.categoria == categoria)
    if viatura_id:
        query = query.filter(Gasto.viatura_id == viatura_id)
    if data_inicio:
        query = query.filter(Gasto.data >= data_inicio)
    if data_fim:
        query = query.filter(Gasto.data <= data_fim)
    return query.order_by(Gasto.data.desc()).all()


@router.get("/{gasto_id}", response_model=GastoResponse)
def get_gasto(gasto_id: int, db: Session = Depends(get_db)):
    """Get a single gasto by ID."""
    g = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto não encontrado")
    return g


@router.post("/", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
def create_gasto(payload: GastoCreate, db: Session = Depends(get_db)):
    """Create a new expense record."""
    viatura = db.query(Viatura).filter(Viatura.id == payload.viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viatura não encontrada")
    g = Gasto(**payload.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return g
