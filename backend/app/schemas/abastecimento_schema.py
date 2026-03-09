from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AbastecimentoBase(BaseModel):
    viatura_id: int
    data: Optional[datetime] = None
    km: float
    quantidade_litros: float
    valor_total: float
    preco_litro: Optional[float] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None

class AbastecimentoCreate(AbastecimentoBase):
    pass

class AbastecimentoResponse(AbastecimentoBase):
    id: int

    class Config:
        from_attributes = True
