from datetime import date
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.relatorio_service import RelatorioService
from app.services.gastos_service import GastosService

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])
relatorio_service = RelatorioService()
gastos_service = GastosService()


@router.get("/diario")
def relatorio_diario(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Daily fleet operations report."""
    return relatorio_service.gerar_relatorio_diario(db)


@router.get("/mensal")
def relatorio_mensal(
    mes: int = Query(..., ge=1, le=12, description="Month (1–12)"),
    ano: int = Query(..., ge=2000, description="Four-digit year"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Monthly fleet report."""
    return relatorio_service.gerar_relatorio_mensal(db, mes, ano)


@router.get("/anual")
def relatorio_anual(
    ano: int = Query(..., ge=2000, description="Four-digit year"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Annual fleet report."""
    return relatorio_service.gerar_relatorio_anual(db, ano)


@router.get("/frota-status")
def frota_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Current fleet status overview."""
    return relatorio_service.obter_status_frota(db)


@router.get("/gastos-resumo")
def gastos_resumo(
    ano: int = Query(default=date.today().year, ge=2000),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Annual expense summary grouped by month and category."""
    from sqlalchemy import extract, func
    from app.models.gastos import Gasto

    rows = (
        db.query(
            extract("month", Gasto.data).label("mes"),
            Gasto.categoria,
            func.sum(Gasto.valor).label("total"),
        )
        .filter(extract("year", Gasto.data) == ano)
        .group_by("mes", Gasto.categoria)
        .all()
    )

    resumo: Dict[int, Dict] = {}
    for row in rows:
        mes_num = int(row[0])
        if mes_num not in resumo:
            resumo[mes_num] = {"mes": mes_num, "total": 0.0, "por_categoria": {}}
        resumo[mes_num]["por_categoria"][row[1]] = round(row[2], 2)
        resumo[mes_num]["total"] = round(resumo[mes_num]["total"] + row[2], 2)

    return {"ano": ano, "meses": list(resumo.values())}
