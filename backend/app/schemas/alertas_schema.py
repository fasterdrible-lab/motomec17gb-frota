from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AlertaBase(BaseModel):
    viatura_id: Optional[int] = None
    tipo_alerta: str  # critico/urgente/aviso/info
    mensagem: str
    status: str = "ativo"
    lido: bool = False


class AlertaCreate(AlertaBase):
    pass


class AlertaUpdate(BaseModel):
    tipo_alerta: Optional[str] = None
    mensagem: Optional[str] = None
    status: Optional[str] = None
    lido: Optional[bool] = None
    data_leitura: Optional[datetime] = None


class AlertaResponse(AlertaBase):
    id: int
    data_criacao: datetime
    data_leitura: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
