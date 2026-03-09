from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from config.database import Base


class VehicleStatus(str, enum.Enum):
    ativo = "ativo"
    inativo = "inativo"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), unique=True, nullable=False, index=True)
    modelo = Column(String(100), nullable=False)
    marca = Column(String(100), nullable=False)
    ano = Column(Integer, nullable=False)
    cor = Column(String(50))
    renavam = Column(String(20), unique=True)
    chassi = Column(String(50), unique=True)

    km_atual = Column(Float, default=0.0)
    status = Column(SAEnum(VehicleStatus), default=VehicleStatus.ativo, nullable=False)

    data_ultimo_oleo = Column(DateTime(timezone=True))
    km_ultimo_oleo = Column(Float)

    data_ultima_inspecao = Column(DateTime(timezone=True))
    data_troca_bateria = Column(DateTime(timezone=True))
    km_troca_pneu = Column(Float)

    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    driver = relationship("Driver", back_populates="vehicles")
    maintenance_records = relationship("Maintenance", back_populates="vehicle", cascade="all, delete-orphan")
