from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.alertas import TipoAlerta, NivelAlerta

class AlertaBase(BaseModel):
    viatura_id: Optional[int] = None
    tipo: TipoAlerta
    nivel: NivelAlerta
    mensagem: str

class AlertaCreate(AlertaBase):
    pass

class AlertaResponse(AlertaBase):
    id: int
    lido: bool
    data_criacao: datetime
    data_leitura: Optional[datetime] = None

    class Config:
        from_attributes = True
