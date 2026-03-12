from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.manutencao import TipoManutencao, StatusManutencao

class ManutencaoBase(BaseModel):
    viatura_id: int
    tipo: TipoManutencao
    km_proximo: Optional[float] = None
    data_proxima: Optional[datetime] = None
    status: Optional[StatusManutencao] = StatusManutencao.pendente
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None

class ManutencaoCreate(ManutencaoBase):
    pass

class ManutencaoUpdate(BaseModel):
    tipo: Optional[TipoManutencao] = None
    km_proximo: Optional[float] = None
    data_proxima: Optional[datetime] = None
    status: Optional[StatusManutencao] = None
    km_ultima: Optional[float] = None
    data_ultima: Optional[datetime] = None
    responsavel: Optional[str] = None
    observacoes: Optional[str] = None

class ManutencaoResponse(ManutencaoBase):
    id: int
    km_ultima: Optional[float] = None
    data_ultima: Optional[datetime] = None
    data_criacao: datetime

    class Config:
        from_attributes = True
