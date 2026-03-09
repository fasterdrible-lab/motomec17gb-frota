from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class AbastecimentoBase(BaseModel):
    viatura_id: int
    data: date
    km: int
    quantidade_litros: float
    valor_total: float
    posto: Optional[str] = None
    responsavel: Optional[str] = None


class AbastecimentoCreate(AbastecimentoBase):
    pass


class AbastecimentoResponse(AbastecimentoBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
