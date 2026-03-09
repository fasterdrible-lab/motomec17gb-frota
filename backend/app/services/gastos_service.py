from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.gastos import GastoFinanceiro
from app.models.frota import Viatura

class GastosService:
    def __init__(self, db: Session):
        self.db = db

    def total_por_viatura(self, viatura_id: int, ano: int = None) -> float:
        query = self.db.query(func.sum(GastoFinanceiro.valor)).filter(
            GastoFinanceiro.viatura_id == viatura_id
        )
        if ano:
            query = query.filter(GastoFinanceiro.ano == ano)
        return query.scalar() or 0.0

    def ranking_gastos(self, ano: int = None):
        query = self.db.query(
            GastoFinanceiro.viatura_id,
            func.sum(GastoFinanceiro.valor).label("total")
        ).group_by(GastoFinanceiro.viatura_id)
        if ano:
            query = query.filter(GastoFinanceiro.ano == ano)
        return query.order_by(func.sum(GastoFinanceiro.valor).desc()).all()

    def percentual_vs_fipe(self, viatura_id: int, ano: int) -> float:
        viatura = self.db.query(Viatura).filter(Viatura.id == viatura_id).first()
        if not viatura or not viatura.valor_fipe:
            return 0.0
        total = self.total_por_viatura(viatura_id, ano)
        return (total / viatura.valor_fipe) * 100
