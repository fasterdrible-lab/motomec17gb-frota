from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class SeveridadeDefeito(str, enum.Enum):
    baixa = "baixa"
    media = "media"
    alta = "alta"
    critica = "critica"

class StatusDefeito(str, enum.Enum):
    pendente = "pendente"
    em_reparo = "em_reparo"
    resolvido = "resolvido"
    aguardando_peca = "aguardando_peca"

class Defeito(Base):
    __tablename__ = "defeitos"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id"), nullable=False)
    tipo = Column(String(100), nullable=False)
    descricao = Column(String(500), nullable=False)
    severidade = Column(Enum(SeveridadeDefeito), default=SeveridadeDefeito.media)
    status = Column(Enum(StatusDefeito), default=StatusDefeito.pendente)
    data_relato = Column(DateTime, default=datetime.utcnow)
    data_resolucao = Column(DateTime, nullable=True)
    mecanico = Column(String(100))
    observacoes = Column(String(500))

    viatura = relationship("Viatura", back_populates="defeitos")
