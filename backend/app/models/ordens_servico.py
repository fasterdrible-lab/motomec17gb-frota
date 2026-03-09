from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class StatusOS(str, enum.Enum):
    aberta = "aberta"
    em_andamento = "em_andamento"
    aguardando_peca = "aguardando_peca"
    finalizada = "finalizada"
    cancelada = "cancelada"

class PrioridadeOS(str, enum.Enum):
    baixa = "baixa"
    normal = "normal"
    alta = "alta"
    urgente = "urgente"

class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id = Column(Integer, primary_key=True, index=True)
    numero_os = Column(String(20), unique=True, nullable=False)
    viatura_id = Column(Integer, ForeignKey("viaturas.id"), nullable=False)
    tipo_servico = Column(String(200), nullable=False)
    status = Column(Enum(StatusOS), default=StatusOS.aberta)
    prioridade = Column(Enum(PrioridadeOS), default=PrioridadeOS.normal)
    data_abertura = Column(DateTime, default=datetime.utcnow)
    data_conclusao = Column(DateTime, nullable=True)
    custo = Column(Float, default=0)
    mecanico = Column(String(100))
    observacoes = Column(String(500))

    viatura = relationship("Viatura", back_populates="ordens_servico")
