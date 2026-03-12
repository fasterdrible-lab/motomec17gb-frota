from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.frota import Viatura, StatusViatura
from app.models.defeitos import Defeito, StatusDefeito
from app.models.alertas import Alerta, TipoAlerta, NivelAlerta
import app.models  # ensure all mappers registered  # noqa: F401
from app.config import LIMITES

class AlertasService:
    def __init__(self, db: Session):
        self.db = db

    def processar_todos_alertas(self):
        """Processa todos os alertas automáticos do sistema."""
        viaturas = self.db.query(Viatura).all()
        for viatura in viaturas:
            self._verificar_viatura_baixada(viatura)
            self._verificar_defeitos_pendentes(viatura)

    def _verificar_viatura_baixada(self, viatura: Viatura):
        if viatura.status == StatusViatura.baixada:
            dias_baixada = (datetime.utcnow() - viatura.data_atualizacao).days
            if dias_baixada >= LIMITES["dias_viatura_baixada_critico"]:
                self._criar_alerta(
                    viatura.id,
                    TipoAlerta.operacional,
                    NivelAlerta.critico,
                    f"[{viatura.prefixo}] Viatura BAIXADA há {dias_baixada} dias"
                )

    def _verificar_defeitos_pendentes(self, viatura: Viatura):
        defeitos = self.db.query(Defeito).filter(
            Defeito.viatura_id == viatura.id,
            Defeito.status != StatusDefeito.resolvido
        ).all()
        for defeito in defeitos:
            dias = (datetime.utcnow() - defeito.data_relato).days
            if dias >= LIMITES["dias_defeito_critico"]:
                self._criar_alerta(
                    viatura.id,
                    TipoAlerta.defeito,
                    NivelAlerta.critico,
                    f"[{viatura.prefixo}] Defeito '{defeito.tipo}' sem reparo há {dias} dias"
                )

    def _criar_alerta(self, viatura_id: int, tipo: TipoAlerta, nivel: NivelAlerta, mensagem: str):
        alerta = Alerta(viatura_id=viatura_id, tipo=tipo, nivel=nivel, mensagem=mensagem)
        self.db.add(alerta)
        self.db.commit()
