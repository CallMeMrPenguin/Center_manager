import math
from typing import Dict, Any, Optional

def trunc_1_dec(val: Any) -> float:
    """Format/truncate to strictly 1 decimal place without rounding up or down."""
    try:
        if val is None or val == "" or val == "null" or val == "undefined":
            return 0.0
        v = float(val)
        return math.floor(v * 10.0) / 10.0
    except (ValueError, TypeError):
        return 0.0

def clean_num(val: Any) -> float:
    """Safely extracts a numeric float value."""
    if val is None:
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0

def get_grade_weights() -> Dict[str, float]:
    """Retrieves fractional weight map {grade_key: fraction_weight} from database app_settings."""
    try:
        from database.crud_settings import get_db_grade_weights
        return get_db_grade_weights()
    except Exception:
        return {"check_1": 0.55, "check_2": 0.35, "homework": 0.10, "mock_test": 0.0}

_get_grade_weights = get_grade_weights
