from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum

class CategoriaGasto(str, enum.Enum):
    combustivel = "combustivel"
    manutencao = "manutencao"
    peca = "peca"
    seguro = "seguro"
    multa = "multa"
    outro = "outro"

class GastoFinanceiro(Base):
    __tablename__ = "gastos_financeiros"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id"), nullable=False)
    categoria = Column(Enum(CategoriaGasto), nullable=False)
    descricao = Column(String(300), nullable=False)
    data = Column(DateTime, default=datetime.utcnow, nullable=False)
    valor = Column(Float, nullable=False)
    mes = Column(Integer)
    ano = Column(Integer)
    responsavel = Column(String(100))
    observacoes = Column(String(500))

    viatura = relationship("Viatura", back_populates="gastos")
