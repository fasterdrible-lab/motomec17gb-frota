from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from app.database import get_db
from app.models.frota import Viatura, StatusViatura
from app.models.manutencao import ManutencaoPreventiva, StatusManutencao
from app.models.alertas import Alerta, NivelAlerta
from app.models.gastos import GastoFinanceiro
from app.models.defeitos import Defeito, StatusDefeito

router = APIRouter()

@router.get("/frota-status")
def status_frota(db: Session = Depends(get_db)):
    total = db.query(func.count(Viatura.id)).scalar()
    operando = db.query(func.count(Viatura.id)).filter(Viatura.status == StatusViatura.operando).scalar()
    manutencao = db.query(func.count(Viatura.id)).filter(Viatura.status == StatusViatura.manutencao).scalar()
    baixada = db.query(func.count(Viatura.id)).filter(Viatura.status == StatusViatura.baixada).scalar()
    reserva = db.query(func.count(Viatura.id)).filter(Viatura.status == StatusViatura.reserva).scalar()
    alertas_criticos = db.query(func.count(Alerta.id)).filter(Alerta.nivel == NivelAlerta.critico, Alerta.lido == False).scalar()
    manutencoes_pendentes = db.query(func.count(ManutencaoPreventiva.id)).filter(ManutencaoPreventiva.status == StatusManutencao.pendente).scalar()

    return {
        "total_viaturas": total,
        "operando": operando,
        "manutencao": manutencao,
        "baixada": baixada,
        "reserva": reserva,
        "alertas_criticos": alertas_criticos,
        "manutencoes_pendentes": manutencoes_pendentes,
        "atualizado_em": datetime.utcnow().isoformat()
    }

@router.get("/diario")
def relatorio_diario(db: Session = Depends(get_db)):
    hoje = date.today()
    gastos_hoje = db.query(func.sum(GastoFinanceiro.valor)).filter(
        func.date(GastoFinanceiro.data) == hoje
    ).scalar() or 0
    defeitos_abertos = db.query(func.count(Defeito.id)).filter(Defeito.status != StatusDefeito.resolvido).scalar()
    return {
        "data": hoje.isoformat(),
        "gastos_dia": gastos_hoje,
        "defeitos_abertos": defeitos_abertos,
        "gerado_em": datetime.utcnow().isoformat()
    }

@router.get("/mensal")
def relatorio_mensal(ano: int = None, mes: int = None, db: Session = Depends(get_db)):
    agora = datetime.utcnow()
    ano = ano or agora.year
    mes = mes or agora.month
    total_gastos = db.query(func.sum(GastoFinanceiro.valor)).filter(
        GastoFinanceiro.ano == ano, GastoFinanceiro.mes == mes
    ).scalar() or 0
    return {"ano": ano, "mes": mes, "total_gastos": total_gastos, "gerado_em": agora.isoformat()}

@router.get("/anual")
def relatorio_anual(ano: int = None, db: Session = Depends(get_db)):
    agora = datetime.utcnow()
    ano = ano or agora.year
    total_gastos = db.query(func.sum(GastoFinanceiro.valor)).filter(GastoFinanceiro.ano == ano).scalar() or 0
    return {"ano": ano, "total_gastos": total_gastos, "gerado_em": agora.isoformat()}
