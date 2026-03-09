from datetime import date, datetime
from typing import Optional
import re


def format_currency(value: float) -> str:
    """Format a float value as Brazilian Real currency string.

    Args:
        value: Numeric value to format.

    Returns:
        Formatted string, e.g. 'R$ 1.234,56'.
    """
    formatted = f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {formatted}"


def format_date_br(dt: Optional[date]) -> str:
    """Format a date object as DD/MM/YYYY.

    Args:
        dt: Date to format.

    Returns:
        Formatted string or empty string if *dt* is None.
    """
    if dt is None:
        return ""
    return dt.strftime("%d/%m/%Y")


def calcular_dias_desde(dt: Optional[date]) -> int:
    """Return the number of days elapsed since *dt*.

    Args:
        dt: Reference date.

    Returns:
        Number of days, or -1 if *dt* is None.
    """
    if dt is None:
        return -1
    today = date.today()
    return (today - dt).days


def parse_km(km_str: str) -> int:
    """Parse a kilometre string coming from Google Sheets.

    Handles values like '12.500', '12500', '12,500 km'.

    Args:
        km_str: Raw string representation.

    Returns:
        Integer kilometre value, or 0 on parse failure.
    """
    try:
        cleaned = re.sub(r"[^\d]", "", str(km_str))
        return int(cleaned) if cleaned else 0
    except (ValueError, TypeError):
        return 0
