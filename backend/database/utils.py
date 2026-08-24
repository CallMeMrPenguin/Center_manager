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
    """Retrieves fractional weight map {grade_key: fraction_weight} from app settings."""
    try:
        from config.settings import get_setting
        gt_list = get_setting("grade_types")
        if gt_list and isinstance(gt_list, list):
            res = {}
            for item in gt_list:
                gid = str(item.get("id", "")).strip()
                w = float(item.get("weight", 0)) / 100.0
                if gid:
                    res[gid] = w
            if res:
                return res
        gw = get_setting("grade_weights") or {}
        w_c1 = float(gw.get("check_1", 55.0)) / 100.0
        w_c2 = float(gw.get("check_2", 35.0)) / 100.0
        w_hw = float(gw.get("homework", 10.0)) / 100.0
        return {"check_1": w_c1, "check_2": w_c2, "homework": w_hw}
    except Exception:
        return {"check_1": 0.55, "check_2": 0.35, "homework": 0.10}

_get_grade_weights = get_grade_weights
