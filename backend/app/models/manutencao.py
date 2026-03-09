from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class TipoManutencao(str, enum.Enum):
    troca_oleo = "troca_oleo"
    revisao_freio = "revisao_freio"
    troca_bateria = "troca_bateria"
    troca_pneus = "troca_pneus"
    revisao_geral = "revisao_geral"
    embreagem = "embreagem"
    outro = "outro"

class StatusManutencao(str, enum.Enum):
    pendente = "pendente"
    em_andamento = "em_andamento"
    concluida = "concluida"
    vencida = "vencida"

class ManutencaoPreventiva(Base):
    __tablename__ = "manutencao_preventiva"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id"), nullable=False)
    tipo = Column(Enum(TipoManutencao), nullable=False)
    km_proximo = Column(Float)
    data_proxima = Column(DateTime)
    status = Column(Enum(StatusManutencao), default=StatusManutencao.pendente)
    data_ultima = Column(DateTime)
    km_ultima = Column(Float)
    responsavel = Column(String(100))
    observacoes = Column(String(500))
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    viatura = relationship("Viatura", back_populates="manutencoes")
