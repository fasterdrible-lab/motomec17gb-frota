from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UsuarioBase(BaseModel):
    nome: str
    email: str
    cargo: str = "Leitor"  # Admin/Editor/Leitor
    unidade: str
    ativo: bool = True


class UsuarioCreate(UsuarioBase):
    senha: str


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    cargo: Optional[str] = None
    unidade: Optional[str] = None
    ativo: Optional[bool] = None
    senha: Optional[str] = None


class UsuarioResponse(UsuarioBase):
    id: int
    data_cadastro: datetime
    ultimo_acesso: Optional[datetime] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
