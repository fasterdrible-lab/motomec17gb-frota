from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.abastecimento import Abastecimento
from app.schemas.abastecimento_schema import AbastecimentoCreate, AbastecimentoResponse

router = APIRouter()

@router.get("/", response_model=List[AbastecimentoResponse])
def listar_abastecimentos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Abastecimento).order_by(Abastecimento.data.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=AbastecimentoResponse, status_code=201)
def registrar_abastecimento(abastecimento: AbastecimentoCreate, db: Session = Depends(get_db)):
    db_abast = Abastecimento(**abastecimento.model_dump())
    db.add(db_abast)
    db.commit()
    db.refresh(db_abast)
    return db_abast

@router.get("/{viatura_id}/ultimos", response_model=List[AbastecimentoResponse])
def ultimos_abastecimentos(viatura_id: int, db: Session = Depends(get_db)):
    return db.query(Abastecimento).filter(
        Abastecimento.viatura_id == viatura_id
    ).order_by(Abastecimento.data.desc()).limit(10).all()
