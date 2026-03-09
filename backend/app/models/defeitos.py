from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Defeito(Base):
    """Defect/fault report for a viatura."""

    __tablename__ = "defeitos"

    id = Column(Integer, primary_key=True, index=True)
    viatura_id = Column(Integer, ForeignKey("viaturas.id", ondelete="CASCADE"), nullable=False, index=True)
    data_relato = Column(Date, nullable=False)
    tipo_defeito = Column(String(100), nullable=False)
    descricao = Column(Text, nullable=False)
    severidade = Column(String(20), nullable=False, default="media")  # critica/alta/media/baixa
    status = Column(String(20), nullable=False, default="aberto")  # aberto/em_andamento/resolvido
    data_resolucao = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationship
    viatura = relationship("Viatura", back_populates="defeitos")
