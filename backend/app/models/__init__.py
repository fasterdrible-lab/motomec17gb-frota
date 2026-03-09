# Import all models so SQLAlchemy mappers are fully registered
from app.models.frota import Viatura  # noqa: F401
from app.models.manutencao import ManutencaoPreventiva  # noqa: F401
from app.models.abastecimento import Abastecimento  # noqa: F401
from app.models.gastos import GastoFinanceiro  # noqa: F401
from app.models.defeitos import Defeito  # noqa: F401
from app.models.ordens_servico import OrdemServico  # noqa: F401
from app.models.alertas import Alerta  # noqa: F401
from app.models.usuarios import Usuario  # noqa: F401
from app.models.historico_km import HistoricoKm  # noqa: F401
