from app.models.frota import Viatura
from app.models.manutencao import Manutencao
from app.models.abastecimento import Abastecimento
from app.models.gastos import Gasto
from app.models.defeitos import Defeito
from app.models.ordens_servico import OrdemServico
from app.models.alertas import Alerta
from app.models.usuarios import Usuario

__all__ = [
    "Viatura",
    "Manutencao",
    "Abastecimento",
    "Gasto",
    "Defeito",
    "OrdemServico",
    "Alerta",
    "Usuario",
]
