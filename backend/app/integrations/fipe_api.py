import logging
import requests
from typing import Optional, List
from app.config import FIPE_API_URL

logger = logging.getLogger(__name__)

class FipeAPI:
    def __init__(self):
        self.base_url = FIPE_API_URL
        self.session = requests.Session()
        self.session.timeout = 10

    def get_marcas(self, tipo: str = "motos") -> List[dict]:
        try:
            resp = self.session.get(f"{self.base_url}/{tipo}/marcas")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Erro ao buscar marcas FIPE: {e}")
            return []

    def get_modelos(self, tipo: str, marca_id: str) -> dict:
        try:
            resp = self.session.get(f"{self.base_url}/{tipo}/marcas/{marca_id}/modelos")
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Erro ao buscar modelos FIPE: {e}")
            return {}

    def get_valor(self, tipo: str, marca_id: str, modelo_id: str, ano_id: str) -> Optional[dict]:
        try:
            url = f"{self.base_url}/{tipo}/marcas/{marca_id}/modelos/{modelo_id}/anos/{ano_id}"
            resp = self.session.get(url)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Erro ao buscar valor FIPE: {e}")
            return None

    def atualizar_valor_viatura(self, viatura, db_session) -> bool:
        """Atualiza o valor FIPE de uma viatura no banco de dados."""
        logger.info(f"Atualizando valor FIPE para {viatura.prefixo}")
        return False  # Fallback — requer configuração de IDs FIPE por viatura
