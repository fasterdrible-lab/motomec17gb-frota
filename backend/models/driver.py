from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from config.database import Base


class DriverStatus(str, enum.Enum):
    ativo = "ativo"
    inativo = "inativo"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False, index=True)
    cnh = Column(String(20), unique=True, nullable=False)
    categoria_cnh = Column(String(5), nullable=False)
    telefone = Column(String(20))
    email = Column(String(150), unique=True, index=True)
    data_validade_cnh = Column(DateTime(timezone=True))
    status = Column(SAEnum(DriverStatus), default=DriverStatus.ativo, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    vehicles = relationship("Vehicle", back_populates="driver")
    maintenance_records = relationship("Maintenance", back_populates="driver")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
