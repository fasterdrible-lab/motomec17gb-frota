from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.frota import StatusViatura

class ViaturaBase(BaseModel):
    placa: str
    prefixo: str
    modelo: str
    marca: str
    ano: Optional[int] = None
    unidade: Optional[str] = None
    status: Optional[StatusViatura] = StatusViatura.operando
    km_atual: Optional[float] = 0
    valor_fipe: Optional[float] = 0

class ViaturaCreate(ViaturaBase):
    pass

class ViaturaUpdate(BaseModel):
    placa: Optional[str] = None
    prefixo: Optional[str] = None
    modelo: Optional[str] = None
    marca: Optional[str] = None
    ano: Optional[int] = None
    unidade: Optional[str] = None
    status: Optional[StatusViatura] = None
    km_atual: Optional[float] = None
    valor_fipe: Optional[float] = None

class ViaturaResponse(ViaturaBase):
    id: int
    data_cadastro: datetime
    data_atualizacao: datetime

    class Config:
        from_attributes = True
