import logging
from typing import Any, Dict, List

import httpx

from config.settings import settings

logger = logging.getLogger(__name__)


class FIPEService:
    """Client for the Tabela FIPE public API."""

    def __init__(self, base_url: str = settings.FIPE_API_URL):
        self.base_url = base_url.rstrip("/")

    def _get(self, path: str) -> Any:
        url = f"{self.base_url}/{path}"
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(url)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            logger.error("FIPE HTTP error %s for %s", exc.response.status_code, url)
            raise
        except httpx.RequestError as exc:
            logger.error("FIPE request error for %s: %s", url, exc)
            raise

    def get_brands(self, vehicle_type: str) -> List[Dict[str, Any]]:
        """Return all brands for a given vehicle type (carros, motos, caminhoes)."""
        return self._get(f"{vehicle_type}/marcas")

    def get_models(self, vehicle_type: str, brand_code: str) -> Dict[str, Any]:
        """Return models for a given brand."""
        return self._get(f"{vehicle_type}/marcas/{brand_code}/modelos")

    def get_years(self, vehicle_type: str, brand_code: str, model_code: str) -> List[Dict[str, Any]]:
        """Return available model years."""
        return self._get(f"{vehicle_type}/marcas/{brand_code}/modelos/{model_code}/anos")

    def get_price(
        self, vehicle_type: str, brand_code: str, model_code: str, year_code: str
    ) -> Dict[str, Any]:
        """Return FIPE price for a specific vehicle/year combination."""
        return self._get(f"{vehicle_type}/marcas/{brand_code}/modelos/{model_code}/anos/{year_code}")
