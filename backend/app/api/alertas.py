from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alertas import Alerta
from app.schemas.alertas_schema import AlertaCreate, AlertaResponse, AlertaUpdate

router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("/nao-lidos", response_model=List[AlertaResponse])
def list_nao_lidos(db: Session = Depends(get_db)):
    """List all unread alerts."""
    return (
        db.query(Alerta)
        .filter(Alerta.lido == False, Alerta.status == "ativo")
        .order_by(Alerta.data_criacao.desc())
        .all()
    )


@router.get("/", response_model=List[AlertaResponse])
def list_alertas(
    status_filter: Optional[str] = Query(None, alias="status"),
    tipo_alerta: Optional[str] = Query(None),
    lido: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    """List alerts with optional filters."""
    query = db.query(Alerta)
    if status_filter:
        query = query.filter(Alerta.status == status_filter)
    if tipo_alerta:
        query = query.filter(Alerta.tipo_alerta == tipo_alerta)
    if lido is not None:
        query = query.filter(Alerta.lido == lido)
    return query.order_by(Alerta.data_criacao.desc()).all()


@router.get("/{alerta_id}", response_model=AlertaResponse)
def get_alerta(alerta_id: int, db: Session = Depends(get_db)):
    """Get a single alert by ID."""
    a = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado")
    return a


@router.post("/", response_model=AlertaResponse, status_code=status.HTTP_201_CREATED)
def create_alerta(payload: AlertaCreate, db: Session = Depends(get_db)):
    """Create a new alert."""
    a = Alerta(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.put("/{alerta_id}/ler", response_model=AlertaResponse)
def marcar_como_lido(alerta_id: int, db: Session = Depends(get_db)):
    """Mark an alert as read."""
    a = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado")
    a.lido = True
    a.data_leitura = datetime.now(timezone.utc)
    db.commit()
    db.refresh(a)
    return a


@router.put("/{alerta_id}/resolver", response_model=AlertaResponse)
def resolver_alerta(alerta_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved."""
    a = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado")
    a.status = "resolvido"
    a.lido = True
    a.data_leitura = datetime.now(timezone.utc)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{alerta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alerta(alerta_id: int, db: Session = Depends(get_db)):
    """Delete an alert."""
    a = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado")
    db.delete(a)
    db.commit()
