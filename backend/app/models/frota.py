from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class StatusViatura(str, enum.Enum):
    operando = "operando"
    manutencao = "manutencao"
    baixada = "baixada"
    reserva = "reserva"

class Viatura(Base):
    __tablename__ = "viaturas"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), unique=True, nullable=False, index=True)
    prefixo = Column(String(20), nullable=False)
    modelo = Column(String(100), nullable=False)
    marca = Column(String(50), nullable=False)
    ano = Column(Integer)
    unidade = Column(String(10))  # 1SGB ou 2SGB
    status = Column(Enum(StatusViatura), default=StatusViatura.operando)
    km_atual = Column(Float, default=0)
    valor_fipe = Column(Float, default=0)
    data_cadastro = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    manutencoes = relationship("ManutencaoPreventiva", back_populates="viatura")
    abastecimentos = relationship("Abastecimento", back_populates="viatura")
    defeitos = relationship("Defeito", back_populates="viatura")
    ordens_servico = relationship("OrdemServico", back_populates="viatura")
    gastos = relationship("GastoFinanceiro", back_populates="viatura")
    historico_km = relationship("HistoricoKm", back_populates="viatura")
    alertas = relationship("Alerta", back_populates="viatura")
