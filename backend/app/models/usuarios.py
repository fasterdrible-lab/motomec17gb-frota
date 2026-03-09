from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean
from datetime import datetime
from app.database import Base
import enum

class RoleUsuario(str, enum.Enum):
    admin = "admin"
    editor = "editor"
    leitor = "leitor"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(300), nullable=False)
    cargo = Column(String(100))
    telefone = Column(String(20))
    unidade = Column(String(20))
    role = Column(Enum(RoleUsuario), default=RoleUsuario.leitor)
    ativo = Column(Boolean, default=True)
    data_cadastro = Column(DateTime, default=datetime.utcnow)
