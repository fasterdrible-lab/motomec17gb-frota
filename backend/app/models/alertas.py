from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Alerta(Base):
    """Alert generated for the fleet management system."""

    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id", ondelete="SET NULL"), nullable=True, index=True)
    tipo_alerta = Column(String(20), nullable=False)  # critico/urgente/aviso/info
    mensagem = Column(String(500), nullable=False)
    data_criacao = Column(DateTime, nullable=False, default=func.now())
    status = Column(String(20), nullable=False, default="ativo")  # ativo/resolvido
    lido = Column(Boolean, nullable=False, default=False)
    data_leitura = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationship
    viatura = relationship("Viatura", back_populates="alertas")
