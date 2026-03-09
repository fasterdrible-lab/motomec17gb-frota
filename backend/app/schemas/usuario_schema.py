from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.usuarios import RoleUsuario

class UsuarioBase(BaseModel):
    nome: str
    email: str
    cargo: Optional[str] = None
    telefone: Optional[str] = None
    unidade: Optional[str] = None
    role: Optional[RoleUsuario] = RoleUsuario.leitor

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    cargo: Optional[str] = None
    telefone: Optional[str] = None
    unidade: Optional[str] = None
    role: Optional[RoleUsuario] = None
    ativo: Optional[bool] = None

class UsuarioResponse(UsuarioBase):
    id: int
    ativo: bool
    data_cadastro: datetime

    class Config:
        from_attributes = True
