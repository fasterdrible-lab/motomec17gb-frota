import logging
import threading
import time
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy.orm import Session

from app.config import settings
from app.models.frota import Viatura

logger = logging.getLogger(__name__)


class FipeIntegration:
    """Wraps the existing FIPEApi logic and integrates FIPE value updates into the DB."""

    def __init__(self) -> None:
        self.base_url = settings.FIPE_API_URL
        logger.info("✅ FIPE Integration inicializada: %s", self.base_url)

    # ------------------------------------------------------------------
    # Low-level API helpers (mirror of src/fipe_api.py)
    # ------------------------------------------------------------------

    def _get(self, path: str, timeout: int = 10) -> Any:
        """Perform a GET request to the FIPE API.

        Args:
            path: URL path relative to base_url.
            timeout: Request timeout in seconds.

        Returns:
            Parsed JSON response, or None on error.
        """
        try:
            response = requests.get(f"{self.base_url}/{path}", timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            logger.error("FIPE API error (%s): %s", path, exc)
            return None

    def get_marcas(self, tipo: str = "carros") -> List[Dict]:
        """Return all brands for a vehicle type.

        Args:
            tipo: 'carros', 'motos', or 'caminhoes'.
        """
        return self._get(f"{tipo}/marcas") or []

    def get_modelos(self, tipo: str, marca_id: str) -> Dict:
        """Return models for a given brand.

        Args:
            tipo: Vehicle type.
            marca_id: Brand code from FIPE.
        """
        return self._get(f"{tipo}/marcas/{marca_id}/modelos") or {}

    def get_anos(self, tipo: str, marca_id: str, modelo_id: str) -> List[Dict]:
        """Return available years for a given model.

        Args:
            tipo: Vehicle type.
            marca_id: Brand code.
            modelo_id: Model code.
        """
        return self._get(f"{tipo}/marcas/{marca_id}/modelos/{modelo_id}/anos") or []

    def get_preco(self, tipo: str, marca_id: str, modelo_id: str, ano: str) -> Dict:
        """Return full FIPE pricing info for a specific vehicle year.

        Args:
            tipo: Vehicle type.
            marca_id: Brand code.
            modelo_id: Model code.
            ano: Year identifier (e.g. '2020-1').
        """
        return self._get(f"{tipo}/marcas/{marca_id}/modelos/{modelo_id}/anos/{ano}") or {}

    def get_valor_veiculo(
        self,
        placa: str,
        marca: str,
        modelo: str,
        ano: int,
        tipo: str = "carros",
    ) -> Optional[float]:
        """Attempt to find and return the FIPE value for a vehicle.

        Searches by brand name match, then model name match.

        Args:
            placa: Vehicle plate (used for logging).
            marca: Brand name string.
            modelo: Model name string.
            ano: Manufacture year.
            tipo: Vehicle type key.

        Returns:
            Float FIPE value in BRL, or None if not found.
        """
        marcas = self.get_marcas(tipo)
        marca_lower = marca.lower()
        matched_marca = next(
            (m for m in marcas if marca_lower in m.get("nome", "").lower()),
            None,
        )
        if not matched_marca:
            logger.debug("Marca não encontrada na FIPE: %s", marca)
            return None

        modelos_data = self.get_modelos(tipo, matched_marca["codigo"])
        modelos = modelos_data.get("modelos", [])
        modelo_lower = modelo.lower()
        matched_modelo = next(
            (m for m in modelos if modelo_lower in m.get("nome", "").lower()),
            None,
        )
        if not matched_modelo:
            logger.debug("Modelo não encontrado na FIPE: %s", modelo)
            return None

        anos = self.get_anos(tipo, matched_marca["codigo"], matched_modelo["codigo"])
        ano_str = str(ano)
        matched_ano = next(
            (a for a in anos if ano_str in a.get("nome", "")),
            anos[0] if anos else None,
        )
        if not matched_ano:
            return None

        preco_data = self.get_preco(
            tipo,
            matched_marca["codigo"],
            matched_modelo["codigo"],
            matched_ano["codigo"],
        )
        valor_str = preco_data.get("Valor", "")
        if not valor_str:
            return None

        import re
        cleaned = re.sub(r"[^\d,]", "", str(valor_str)).replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return None

    def atualizar_valores_fipe(self, db: Session) -> int:
        """Update FIPE values for all active viaturas in the database.

        Args:
            db: Database session.

        Returns:
            Number of viaturas updated.
        """
        viaturas = db.query(Viatura).filter(Viatura.status != "inativo").all()
        updated = 0
        for viatura in viaturas:
            try:
                valor = self.get_valor_veiculo(
                    viatura.placa,
                    viatura.marca,
                    viatura.modelo,
                    viatura.ano,
                )
                if valor:
                    viatura.valor_fipe = valor
                    updated += 1
            except Exception as exc:
                logger.warning("Erro ao atualizar FIPE para %s: %s", viatura.placa, exc)
        db.commit()
        logger.info("atualizar_valores_fipe: %d viaturas atualizadas", updated)
        return updated

    def schedule_update(self, db_factory: Any) -> threading.Thread:
        """Start a daily background thread to update all FIPE values.

        Args:
            db_factory: Callable returning a new DB session.

        Returns:
            The daemon thread (already started).
        """
        def _loop() -> None:
            while True:
                try:
                    db = db_factory()
                    self.atualizar_valores_fipe(db)
                    db.close()
                except Exception as exc:
                    logger.error("Erro no schedule_update FIPE: %s", exc)
                time.sleep(86400)  # 24 hours

        thread = threading.Thread(target=_loop, daemon=True, name="fipe-update")
        thread.start()
        logger.info("FIPE update agendado diariamente")
        return thread
