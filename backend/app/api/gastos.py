from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.gastos import GastoFinanceiro
from app.schemas.gastos_schema import GastoCreate, GastoResponse

router = APIRouter()

@router.get("/", response_model=List[GastoResponse])
def listar_gastos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(GastoFinanceiro).order_by(GastoFinanceiro.data.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=GastoResponse, status_code=201)
def registrar_gasto(gasto: GastoCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    data = gasto.data or datetime.utcnow()
    db_gasto = GastoFinanceiro(**gasto.model_dump(), mes=data.month, ano=data.year)
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto

@router.get("/por-viatura")
def gastos_por_viatura(db: Session = Depends(get_db)):
    resultado = db.query(
        GastoFinanceiro.viatura_id,
        func.sum(GastoFinanceiro.valor).label("total")
    ).group_by(GastoFinanceiro.viatura_id).all()
    return [{"viatura_id": r.viatura_id, "total": r.total} for r in resultado]

@router.get("/relatorio-mensal")
def relatorio_mensal(ano: int, mes: int, db: Session = Depends(get_db)):
    resultado = db.query(GastoFinanceiro).filter(
        GastoFinanceiro.ano == ano,
        GastoFinanceiro.mes == mes
    ).all()
    total = sum(g.valor for g in resultado)
    return {"ano": ano, "mes": mes, "total": total, "registros": len(resultado)}

@router.get("/viatura-mais-cara")
def viatura_mais_cara(db: Session = Depends(get_db)):
    resultado = db.query(
        GastoFinanceiro.viatura_id,
        func.sum(GastoFinanceiro.valor).label("total")
    ).group_by(GastoFinanceiro.viatura_id).order_by(func.sum(GastoFinanceiro.valor).desc()).first()
    if resultado:
        return {"viatura_id": resultado.viatura_id, "total": resultado.total}
    return {}
