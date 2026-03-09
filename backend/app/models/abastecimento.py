from sqlalchemy import Column, Integer, String, Date, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Abastecimento(Base):
    """Fuel supply record for a viatura."""

    __tablename__ = "abastecimentos"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id", ondelete="CASCADE"), nullable=False, index=True)
    data = Column(Date, nullable=False)
    km = Column(Integer, nullable=False)
    quantidade_litros = Column(Float, nullable=False)
    valor_total = Column(Float, nullable=False)
    posto = Column(String(100), nullable=True)
    responsavel = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationship
    viatura = relationship("Viatura", back_populates="abastecimentos")
