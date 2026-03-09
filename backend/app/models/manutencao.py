from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Manutencao(Base):
    """Maintenance record for a viatura."""

    __tablename__ = "manutencoes"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id", ondelete="CASCADE"), nullable=False, index=True)
    tipo = Column(String(50), nullable=False)  # oleo/pneu/bateria/inspecao/geral
    km_proximo = Column(Integer, nullable=True)
    data_proximo = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="pendente")  # pendente/realizada/vencida
    data_ultima = Column(Date, nullable=True)
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationship
    viatura = relationship("Viatura", back_populates="manutencoes")
