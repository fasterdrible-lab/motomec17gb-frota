from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class TipoAlerta(str, enum.Enum):
    manutencao = "manutencao"
    defeito = "defeito"
    operacional = "operacional"
    combustivel = "combustivel"
    financeiro = "financeiro"

class NivelAlerta(str, enum.Enum):
    critico = "critico"
    aviso = "aviso"
    info = "info"

class Alerta(Base):
    __tablename__ = "alertas_automaticos"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id"), nullable=True)
    tipo = Column(Enum(TipoAlerta), nullable=False)
    nivel = Column(Enum(NivelAlerta), nullable=False)
    mensagem = Column(String(500), nullable=False)
    lido = Column(Boolean, default=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_leitura = Column(DateTime, nullable=True)

    viatura = relationship("Viatura", back_populates="alertas")
