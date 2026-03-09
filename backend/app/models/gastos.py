from sqlalchemy import Column, Integer, String, Date, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Gasto(Base):
    """Expense record for a viatura."""

    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id", ondelete="CASCADE"), nullable=False, index=True)
    categoria = Column(String(50), nullable=False)  # manutencao/combustivel/peca/servico/outro
    descricao = Column(String(255), nullable=False)
    data = Column(Date, nullable=False)
    valor = Column(Float, nullable=False)
    nota_fiscal = Column(String(100), nullable=True)
    responsavel = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationship
    viatura = relationship("Viatura", back_populates="gastos")
