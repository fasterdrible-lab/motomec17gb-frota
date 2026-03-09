from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class GastoBase(BaseModel):
    viatura_id: int
    categoria: str  # manutencao/combustivel/peca/servico/outro
    descricao: str
    data: date
    valor: float
    nota_fiscal: Optional[str] = None
    responsavel: Optional[str] = None


class GastoCreate(GastoBase):
    pass


class GastoUpdate(BaseModel):
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    data: Optional[date] = None
    valor: Optional[float] = None
    nota_fiscal: Optional[str] = None
    responsavel: Optional[str] = None


class GastoResponse(GastoBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
