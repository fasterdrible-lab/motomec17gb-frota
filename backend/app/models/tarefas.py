from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime
from app.database import Base
import enum


class StatusTarefa(str, enum.Enum):
    pendente = "PENDENTE"
    andamento = "EM_ANDAMENTO"
    concluida = "CONCLUIDA"


class PrioridadeTarefa(str, enum.Enum):
    baixa = "BAIXA"
    media = "MEDIA"
    alta = "ALTA"


class Tarefa(Base):
    __tablename__ = "tarefas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descricao = Column(String(1000))
    responsavel = Column(String(100))
    status = Column(Enum(StatusTarefa), default=StatusTarefa.pendente)
    prioridade = Column(Enum(PrioridadeTarefa), default=PrioridadeTarefa.media)
    data_inicio = Column(DateTime)
    data_fim = Column(DateTime)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
