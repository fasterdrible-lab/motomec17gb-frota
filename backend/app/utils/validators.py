import re
from datetime import date
from typing import Optional


def validate_placa(placa: str) -> bool:
    """Validate a Brazilian vehicle licence plate.

    Accepts both old format (ABC-1234) and Mercosul format (ABC1D23).

    Args:
        placa: Plate string to validate.

    Returns:
        True if the format is valid, False otherwise.
    """
    if not placa:
        return False
    cleaned = placa.upper().replace("-", "").replace(" ", "")
    # Old format: 3 letters + 4 digits
    old_pattern = re.compile(r"^[A-Z]{3}\d{4}$")
    # Mercosul format: 3 letters + 1 digit + 1 letter + 2 digits
    mercosul_pattern = re.compile(r"^[A-Z]{3}\d[A-Z]\d{2}$")
    return bool(old_pattern.match(cleaned) or mercosul_pattern.match(cleaned))


def validate_cpf(cpf: str) -> bool:
    """Validate a Brazilian CPF number.

    Args:
        cpf: CPF string (with or without formatting).

    Returns:
        True if the CPF is structurally valid, False otherwise.
    """
    digits = re.sub(r"\D", "", cpf)
    if len(digits) != 11 or len(set(digits)) == 1:
        return False

    def calc_digit(partial: str, factor: int) -> int:
        total = sum(int(d) * f for d, f in zip(partial, range(factor, 1, -1)))
        remainder = (total * 10) % 11
        return 0 if remainder >= 10 else remainder

    first = calc_digit(digits[:9], 10)
    second = calc_digit(digits[:10], 11)
    return digits[-2:] == f"{first}{second}"


def validate_date_range(data_inicio: Optional[date], data_fim: Optional[date]) -> bool:
    """Validate that data_inicio is not after data_fim.

    Args:
        data_inicio: Start date.
        data_fim: End date.

    Returns:
        True if the range is valid (or if either date is None), False otherwise.
    """
    if data_inicio is None or data_fim is None:
        return True
    return data_inicio <= data_fim


def validate_km(km_atual: int, km_anterior: int) -> bool:
    """Validate that km_atual is not less than km_anterior.

    Args:
        km_atual: Current odometer reading.
        km_anterior: Previous odometer reading.

    Returns:
        True if progression is valid (km_atual >= km_anterior).
    """
    return km_atual >= km_anterior
