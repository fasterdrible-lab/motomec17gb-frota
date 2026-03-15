from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.tarefas import StatusTarefa, PrioridadeTarefa


class TarefaBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    responsavel: Optional[str] = None
    status: Optional[StatusTarefa] = StatusTarefa.pendente
    prioridade: Optional[PrioridadeTarefa] = PrioridadeTarefa.media
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None


class TarefaCreate(TarefaBase):
    pass


class TarefaUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    responsavel: Optional[str] = None
    status: Optional[StatusTarefa] = None
    prioridade: Optional[PrioridadeTarefa] = None
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None


class TarefaResponse(TarefaBase):
    id: int
    data_criacao: datetime
    data_atualizacao: datetime

    class Config:
        from_attributes = True
