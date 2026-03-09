from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from app.database import Base


class Usuario(Base):
    """System user entity."""

    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    cargo = Column(String(20), nullable=False, default="Leitor")  # Admin/Editor/Leitor
    unidade = Column(String(50), nullable=False)
    senha_hash = Column(String(255), nullable=False)
    ativo = Column(Boolean, nullable=False, default=True)
    data_cadastro = Column(DateTime, nullable=False, default=func.now())
    ultimo_acesso = Column(DateTime, nullable=True)
