from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.alertas import Alerta, NivelAlerta
from app.schemas.alertas_schema import AlertaCreate, AlertaResponse

router = APIRouter()

@router.get("/", response_model=List[AlertaResponse])
def listar_alertas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Alerta).order_by(Alerta.data_criacao.desc()).offset(skip).limit(limit).all()

@router.get("/criticos", response_model=List[AlertaResponse])
def listar_criticos(db: Session = Depends(get_db)):
    return db.query(Alerta).filter(Alerta.nivel == NivelAlerta.critico).order_by(Alerta.data_criacao.desc()).all()

@router.get("/nao-lidos", response_model=List[AlertaResponse])
def listar_nao_lidos(db: Session = Depends(get_db)):
    return db.query(Alerta).filter(Alerta.lido == False).order_by(Alerta.data_criacao.desc()).all()

@router.put("/{alerta_id}/marcar-lido", response_model=AlertaResponse)
def marcar_lido(alerta_id: int, db: Session = Depends(get_db)):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    alerta.lido = True
    alerta.data_leitura = datetime.utcnow()
    db.commit()
    db.refresh(alerta)
    return alerta

@router.post("/", response_model=AlertaResponse, status_code=201)
def criar_alerta(alerta: AlertaCreate, db: Session = Depends(get_db)):
    db_alerta = Alerta(**alerta.model_dump())
    db.add(db_alerta)
    db.commit()
    db.refresh(db_alerta)
    return db_alerta
