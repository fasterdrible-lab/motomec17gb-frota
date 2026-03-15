from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.tarefas import Tarefa, StatusTarefa
from app.schemas.tarefas_schema import TarefaCreate, TarefaUpdate, TarefaResponse

router = APIRouter()


@router.get("/resumo")
def resumo_tarefas(db: Session = Depends(get_db)):
    total = db.query(func.count(Tarefa.id)).scalar()
    pendente = db.query(func.count(Tarefa.id)).filter(Tarefa.status == StatusTarefa.pendente).scalar()
    andamento = db.query(func.count(Tarefa.id)).filter(Tarefa.status == StatusTarefa.andamento).scalar()
    concluida = db.query(func.count(Tarefa.id)).filter(Tarefa.status == StatusTarefa.concluida).scalar()
    return {"total": total, "pendente": pendente, "andamento": andamento, "concluida": concluida}


@router.get("/", response_model=List[TarefaResponse])
def listar_tarefas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Tarefa).offset(skip).limit(limit).all()


@router.get("/{tarefa_id}", response_model=TarefaResponse)
def obter_tarefa(tarefa_id: int, db: Session = Depends(get_db)):
    tarefa = db.query(Tarefa).filter(Tarefa.id == tarefa_id).first()
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return tarefa


@router.post("/", response_model=TarefaResponse, status_code=201)
def criar_tarefa(tarefa: TarefaCreate, db: Session = Depends(get_db)):
    db_tarefa = Tarefa(**tarefa.model_dump())
    db.add(db_tarefa)
    db.commit()
    db.refresh(db_tarefa)
    return db_tarefa


@router.put("/{tarefa_id}", response_model=TarefaResponse)
def atualizar_tarefa(tarefa_id: int, tarefa: TarefaUpdate, db: Session = Depends(get_db)):
    db_tarefa = db.query(Tarefa).filter(Tarefa.id == tarefa_id).first()
    if not db_tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    update_data = tarefa.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tarefa, field, value)
    db.commit()
    db.refresh(db_tarefa)
    return db_tarefa


@router.delete("/{tarefa_id}", status_code=204)
def deletar_tarefa(tarefa_id: int, db: Session = Depends(get_db)):
    db_tarefa = db.query(Tarefa).filter(Tarefa.id == tarefa_id).first()
    if not db_tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    db.delete(db_tarefa)
    db.commit()
