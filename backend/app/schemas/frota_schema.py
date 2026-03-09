from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class ViaturaBase(BaseModel):
    placa: str
    prefixo: str
    modelo: str
    marca: str
    ano: int
    valor_fipe: Optional[float] = None
    unidade: str
    status: str = "operacional"
    km_atual: int = 0

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"operacional", "manutencao", "inativo"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


class ViaturaCreate(ViaturaBase):
    pass


class ViaturaUpdate(BaseModel):
    placa: Optional[str] = None
    prefixo: Optional[str] = None
    modelo: Optional[str] = None
    marca: Optional[str] = None
    ano: Optional[int] = None
    valor_fipe: Optional[float] = None
    unidade: Optional[str] = None
    status: Optional[str] = None
    km_atual: Optional[int] = None


class ViaturaResponse(ViaturaBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
