from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class VehicleStatus(str, Enum):
    ativo = "ativo"
    inativo = "inativo"


class DriverStatus(str, Enum):
    ativo = "ativo"
    inativo = "inativo"


class MaintenanceType(str, Enum):
    oleo = "oleo"
    pneu = "pneu"
    bateria = "bateria"
    inspecao = "inspecao"
    outro = "outro"


class MaintenanceStatus(str, Enum):
    pendente = "pendente"
    em_andamento = "em_andamento"
    concluido = "concluido"


# ── Driver ────────────────────────────────────────────────────────────────────

class DriverBase(BaseModel):
    nome: str
    cpf: str
    cnh: str
    categoria_cnh: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_validade_cnh: Optional[datetime] = None
    status: DriverStatus = DriverStatus.ativo


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    nome: Optional[str] = None
    cpf: Optional[str] = None
    cnh: Optional[str] = None
    categoria_cnh: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_validade_cnh: Optional[datetime] = None
    status: Optional[DriverStatus] = None


class DriverResponse(DriverBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DriverList(BaseModel):
    items: List[DriverResponse]
    total: int
    page: int
    page_size: int


# ── Vehicle ───────────────────────────────────────────────────────────────────

class VehicleBase(BaseModel):
    placa: str
    modelo: str
    marca: str
    ano: int
    cor: Optional[str] = None
    renavam: Optional[str] = None
    chassi: Optional[str] = None
    km_atual: Optional[float] = 0.0
    status: VehicleStatus = VehicleStatus.ativo
    data_ultimo_oleo: Optional[datetime] = None
    km_ultimo_oleo: Optional[float] = None
    data_ultima_inspecao: Optional[datetime] = None
    data_troca_bateria: Optional[datetime] = None
    km_troca_pneu: Optional[float] = None
    driver_id: Optional[int] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    placa: Optional[str] = None
    modelo: Optional[str] = None
    marca: Optional[str] = None
    ano: Optional[int] = None
    cor: Optional[str] = None
    renavam: Optional[str] = None
    chassi: Optional[str] = None
    km_atual: Optional[float] = None
    status: Optional[VehicleStatus] = None
    data_ultimo_oleo: Optional[datetime] = None
    km_ultimo_oleo: Optional[float] = None
    data_ultima_inspecao: Optional[datetime] = None
    data_troca_bateria: Optional[datetime] = None
    km_troca_pneu: Optional[float] = None
    driver_id: Optional[int] = None


class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VehicleList(BaseModel):
    items: List[VehicleResponse]
    total: int
    page: int
    page_size: int


# ── Maintenance ───────────────────────────────────────────────────────────────

class MaintenanceBase(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    tipo: MaintenanceType
    descricao: Optional[str] = None
    custo: Optional[float] = 0.0
    data_servico: datetime
    km_servico: Optional[float] = None
    data_proximo_servico: Optional[datetime] = None
    km_proximo_servico: Optional[float] = None
    status: MaintenanceStatus = MaintenanceStatus.pendente


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    driver_id: Optional[int] = None
    tipo: Optional[MaintenanceType] = None
    descricao: Optional[str] = None
    custo: Optional[float] = None
    data_servico: Optional[datetime] = None
    km_servico: Optional[float] = None
    data_proximo_servico: Optional[datetime] = None
    km_proximo_servico: Optional[float] = None
    status: Optional[MaintenanceStatus] = None


class MaintenanceResponse(MaintenanceBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MaintenanceList(BaseModel):
    items: List[MaintenanceResponse]
    total: int
    page: int
    page_size: int


# ── User / Auth ───────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ── FIPE ──────────────────────────────────────────────────────────────────────

class FIPEBrand(BaseModel):
    codigo: str
    nome: str


class FIPEModel(BaseModel):
    codigo: int
    nome: str


class FIPEYear(BaseModel):
    codigo: str
    nome: str


class FIPEPrice(BaseModel):
    Valor: str
    Marca: str
    Modelo: str
    AnoModelo: int
    Combustivel: str
    CodigoFipe: str
    MesReferencia: str
    TipoVeiculo: int
    SiglaCombustivel: str


# ── Google Sheets ─────────────────────────────────────────────────────────────

class SheetsStatus(BaseModel):
    connected: bool
    sheet_id: Optional[str] = None
    message: str


class SheetsExportRequest(BaseModel):
    sheet_name: str
    data_type: str  # "vehicles" | "drivers" | "maintenance"
