import logging
from typing import Any, Dict, List

import httpx
from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import JSONResponse

from config.settings import settings
from models.schemas import FIPEBrand, FIPEModel, FIPEPrice, FIPEYear
from routers.auth import get_current_active_user
from models.driver import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fipe", tags=["fipe"])

VALID_TYPES = {"carros", "motos", "caminhoes"}


def _validate_type(vehicle_type: str) -> None:
    if vehicle_type not in VALID_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid vehicle type. Must be one of: {', '.join(VALID_TYPES)}",
        )


async def _fipe_get(path: str) -> Any:
    url = f"{settings.FIPE_API_URL}/{path}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("FIPE API HTTP error %s for %s", exc.response.status_code, url)
        raise HTTPException(status_code=502, detail="FIPE API returned an error") from exc
    except httpx.RequestError as exc:
        logger.error("FIPE API request error: %s", exc)
        raise HTTPException(status_code=503, detail="Could not reach FIPE API") from exc


@router.get("/brands/{vehicle_type}", response_model=List[FIPEBrand])
async def get_brands(
    vehicle_type: str = Path(..., description="carros, motos or caminhoes"),
    _: User = Depends(get_current_active_user),
):
    _validate_type(vehicle_type)
    return await _fipe_get(f"{vehicle_type}/marcas")


@router.get("/models/{vehicle_type}/{brand_code}", response_model=Dict[str, Any])
async def get_models(
    vehicle_type: str = Path(...),
    brand_code: str = Path(...),
    _: User = Depends(get_current_active_user),
):
    _validate_type(vehicle_type)
    return await _fipe_get(f"{vehicle_type}/marcas/{brand_code}/modelos")


@router.get("/years/{vehicle_type}/{brand_code}/{model_code}", response_model=List[FIPEYear])
async def get_years(
    vehicle_type: str = Path(...),
    brand_code: str = Path(...),
    model_code: str = Path(...),
    _: User = Depends(get_current_active_user),
):
    _validate_type(vehicle_type)
    return await _fipe_get(f"{vehicle_type}/marcas/{brand_code}/modelos/{model_code}/anos")


@router.get("/price/{vehicle_type}/{brand_code}/{model_code}/{year_code}", response_model=FIPEPrice)
async def get_price(
    vehicle_type: str = Path(...),
    brand_code: str = Path(...),
    model_code: str = Path(...),
    year_code: str = Path(...),
    _: User = Depends(get_current_active_user),
):
    _validate_type(vehicle_type)
    return await _fipe_get(f"{vehicle_type}/marcas/{brand_code}/modelos/{model_code}/anos/{year_code}")
