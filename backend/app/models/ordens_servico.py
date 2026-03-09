from sqlalchemy import Column, Integer, String, Date, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class OrdemServico(Base):
    """Service order for a viatura."""

    __tablename__ = "ordens_servico"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id", ondelete="CASCADE"), nullable=False, index=True)
    data_abertura = Column(Date, nullable=False)
    tipo_servico = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="aberta")  # aberta/em_andamento/concluida/cancelada
    data_conclusao = Column(Date, nullable=True)
    custo = Column(Float, nullable=True)
    oficina = Column(String(150), nullable=True)
    responsavel = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationship
    viatura = relationship("Viatura", back_populates="ordens_servico")
