from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from config.database import Base


class MaintenanceType(str, enum.Enum):
    oleo = "oleo"
    pneu = "pneu"
    bateria = "bateria"
    inspecao = "inspecao"
    outro = "outro"


class MaintenanceStatus(str, enum.Enum):
    pendente = "pendente"
    em_andamento = "em_andamento"
    concluido = "concluido"


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)

    tipo = Column(SAEnum(MaintenanceType), nullable=False)
    descricao = Column(String(500))
    custo = Column(Float, default=0.0)

    data_servico = Column(DateTime(timezone=True), nullable=False)
    km_servico = Column(Float)

    data_proximo_servico = Column(DateTime(timezone=True))
    km_proximo_servico = Column(Float)

    status = Column(SAEnum(MaintenanceStatus), default=MaintenanceStatus.pendente, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    vehicle = relationship("Vehicle", back_populates="maintenance_records")
    driver = relationship("Driver", back_populates="maintenance_records")
