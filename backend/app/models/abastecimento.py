from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Abastecimento(Base):
    __tablename__ = "abastecimento"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id"), nullable=False)
    data = Column(DateTime, default=datetime.utcnow, nullable=False)
    km = Column(Float, nullable=False)
    quantidade_litros = Column(Float, nullable=False)
    valor_total = Column(Float, nullable=False)
    preco_litro = Column(Float)
    responsavel = Column(String(100))
    observacoes = Column(String(500))

    viatura = relationship("Viatura", back_populates="abastecimentos")
