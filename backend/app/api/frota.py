from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.frota import Viatura
from app.schemas.frota_schema import ViaturaCreate, ViaturaUpdate, ViaturaResponse

router = APIRouter()

@router.get("/", response_model=List[ViaturaResponse])
def listar_viaturas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Viatura).offset(skip).limit(limit).all()

@router.get("/{viatura_id}", response_model=ViaturaResponse)
def obter_viatura(viatura_id: int, db: Session = Depends(get_db)):
    viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not viatura:
        raise HTTPException(status_code=404, detail="Viatura não encontrada")
    return viatura

@router.post("/", response_model=ViaturaResponse, status_code=201)
def criar_viatura(viatura: ViaturaCreate, db: Session = Depends(get_db)):
    db_viatura = Viatura(**viatura.model_dump())
    db.add(db_viatura)
    db.commit()
    db.refresh(db_viatura)
    return db_viatura

@router.put("/{viatura_id}", response_model=ViaturaResponse)
def atualizar_viatura(viatura_id: int, viatura: ViaturaUpdate, db: Session = Depends(get_db)):
    db_viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not db_viatura:
        raise HTTPException(status_code=404, detail="Viatura não encontrada")
    update_data = viatura.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_viatura, field, value)
    db.commit()
    db.refresh(db_viatura)
    return db_viatura

@router.delete("/{viatura_id}", status_code=204)
def deletar_viatura(viatura_id: int, db: Session = Depends(get_db)):
    db_viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not db_viatura:
        raise HTTPException(status_code=404, detail="Viatura não encontrada")
    db.delete(db_viatura)
    db.commit()
