from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.manutencao import ManutencaoPreventiva, StatusManutencao
from app.schemas.manutencao_schema import ManutencaoCreate, ManutencaoUpdate, ManutencaoResponse

router = APIRouter()

@router.get("/", response_model=List[ManutencaoResponse])
def listar_manutencoes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(ManutencaoPreventiva).offset(skip).limit(limit).all()

@router.get("/pendentes", response_model=List[ManutencaoResponse])
def listar_pendentes(db: Session = Depends(get_db)):
    return db.query(ManutencaoPreventiva).filter(
        ManutencaoPreventiva.status == StatusManutencao.pendente
    ).all()

@router.get("/vencidas", response_model=List[ManutencaoResponse])
def listar_vencidas(db: Session = Depends(get_db)):
    agora = datetime.utcnow()
    return db.query(ManutencaoPreventiva).filter(
        ManutencaoPreventiva.data_proxima < agora,
        ManutencaoPreventiva.status != StatusManutencao.concluida
    ).all()

@router.post("/", response_model=ManutencaoResponse, status_code=201)
def registrar_manutencao(manutencao: ManutencaoCreate, db: Session = Depends(get_db)):
    db_manutencao = ManutencaoPreventiva(**manutencao.model_dump())
    db.add(db_manutencao)
    db.commit()
    db.refresh(db_manutencao)
    return db_manutencao

@router.put("/{manutencao_id}", response_model=ManutencaoResponse)
def atualizar_manutencao(manutencao_id: int, manutencao: ManutencaoUpdate, db: Session = Depends(get_db)):
    db_manutencao = db.query(ManutencaoPreventiva).filter(ManutencaoPreventiva.id == manutencao_id).first()
    if not db_manutencao:
        raise HTTPException(status_code=404, detail="Manutenção não encontrada")
    update_data = manutencao.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_manutencao, field, value)
    db.commit()
    db.refresh(db_manutencao)
    return db_manutencao
