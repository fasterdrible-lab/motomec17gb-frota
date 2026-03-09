from app.schemas.frota_schema import ViaturaBase, ViaturaCreate, ViaturaUpdate, ViaturaResponse
from app.schemas.manutencao_schema import ManutencaoBase, ManutencaoCreate, ManutencaoUpdate, ManutencaoResponse
from app.schemas.abastecimento_schema import AbastecimentoBase, AbastecimentoCreate, AbastecimentoResponse
from app.schemas.gastos_schema import GastoBase, GastoCreate, GastoUpdate, GastoResponse
from app.schemas.alertas_schema import AlertaBase, AlertaCreate, AlertaUpdate, AlertaResponse
from app.schemas.usuarios_schema import (
    UsuarioBase, UsuarioCreate, UsuarioUpdate, UsuarioResponse, Token, TokenData
)

__all__ = [
    "ViaturaBase", "ViaturaCreate", "ViaturaUpdate", "ViaturaResponse",
    "ManutencaoBase", "ManutencaoCreate", "ManutencaoUpdate", "ManutencaoResponse",
    "AbastecimentoBase", "AbastecimentoCreate", "AbastecimentoResponse",
    "GastoBase", "GastoCreate", "GastoUpdate", "GastoResponse",
    "AlertaBase", "AlertaCreate", "AlertaUpdate", "AlertaResponse",
    "UsuarioBase", "UsuarioCreate", "UsuarioUpdate", "UsuarioResponse",
    "Token", "TokenData",
]
