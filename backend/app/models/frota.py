from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Viatura(Base):
    """Vehicle (viatura) entity for the 17º GB fleet."""

    __tablename__ = "viaturas"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), unique=True, nullable=False, index=True)
    prefixo = Column(String(20), nullable=False, index=True)
    modelo = Column(String(100), nullable=False)
    marca = Column(String(100), nullable=False)
    ano = Column(Integer, nullable=False)
    valor_fipe = Column(Float, nullable=True)
    unidade = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="operacional")  # operacional/manutencao/inativo
    km_atual = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    manutencoes = relationship("Manutencao", back_populates="viatura", cascade="all, delete-orphan")
    abastecimentos = relationship("Abastecimento", back_populates="viatura", cascade="all, delete-orphan")
    gastos = relationship("Gasto", back_populates="viatura", cascade="all, delete-orphan")
    defeitos = relationship("Defeito", back_populates="viatura", cascade="all, delete-orphan")
    ordens_servico = relationship("OrdemServico", back_populates="viatura", cascade="all, delete-orphan")
    alertas = relationship("Alerta", back_populates="viatura", cascade="all, delete-orphan")
