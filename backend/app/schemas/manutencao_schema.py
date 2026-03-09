from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class ManutencaoBase(BaseModel):
    viatura_id: int
    tipo: str  # oleo/pneu/bateria/inspecao/geral
    km_proximo: Optional[int] = None
    data_proximo: Optional[date] = None
    status: str = "pendente"  # pendente/realizada/vencida
    data_ultima: Optional[date] = None
    observacoes: Optional[str] = None


class ManutencaoCreate(ManutencaoBase):
    pass


class ManutencaoUpdate(BaseModel):
    tipo: Optional[str] = None
    km_proximo: Optional[int] = None
    data_proximo: Optional[date] = None
    status: Optional[str] = None
    data_ultima: Optional[date] = None
    observacoes: Optional[str] = None


class ManutencaoResponse(ManutencaoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
