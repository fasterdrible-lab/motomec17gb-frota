from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.gastos import CategoriaGasto

class GastoBase(BaseModel):
    viatura_id: int
    categoria: CategoriaGasto
    descricao: str
    data: Optional[datetime] = None
    valor: float
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None

class GastoCreate(GastoBase):
    pass

class GastoResponse(GastoBase):
    id: int
    mes: Optional[int] = None
    ano: Optional[int] = None

    class Config:
        from_attributes = True
