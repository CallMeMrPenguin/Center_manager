import time
import json
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from database.connection import get_connection

_settings_cache: Dict[str, Tuple[Any, float]] = {}
CACHE_TTL_SECONDS = 30.0

def get_db_setting(key: str, default: Any = None) -> Any:
    """Retrieves a setting from app_settings database table with 30s in-memory TTL."""
    global _settings_cache
    now = time.time()
    if key in _settings_cache:
        val, cached_at = _settings_cache[key]
        if now - cached_at < CACHE_TTL_SECONDS:
            return val
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT setting_value FROM app_settings WHERE setting_key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        if row:
            val_str = row["setting_value"] if isinstance(row, dict) else row[0]
            try:
                val = json.loads(val_str)
                _settings_cache[key] = (val, now)
                return val
            except Exception:
                _settings_cache[key] = (val_str, now)
                return val_str
    except Exception:
        # Fallback to local config.json if table not yet initialized or offline
        pass

    try:
        from config.settings import load_settings
        cfg = load_settings()
        if key in cfg:
            return cfg[key]
    except Exception:
        pass

    return default

def save_db_setting(key: str, value: Any) -> bool:
    """Saves setting into app_settings table and updates memory cache."""
    global _settings_cache
    _settings_cache[key] = (value, time.time())

    val_str = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO app_settings (setting_key, setting_value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT (setting_key) DO UPDATE SET
                setting_value = EXCLUDED.setting_value,
                updated_at = EXCLUDED.updated_at
        """, (key, val_str, now_str))
        conn.commit()
        conn.close()
        try:
            from services.sync_worker import trigger_instant_sync
            trigger_instant_sync()
        except Exception:
            pass
    except Exception as e:
        print("[Settings DB] Error saving setting to DB:", e)

    # Also persist to local config.json if possible
    try:
        from config.settings import set_setting
        set_setting(key, value)
    except Exception:
        pass

    return True

def get_db_grade_weights() -> Dict[str, float]:
    """
    Returns unified fractional grade weights {grade_key: fraction_weight}.
    Example: {'check_1': 0.55, 'check_2': 0.35, 'homework': 0.10, 'mock_test': 0.0}
    """
    gt_list = get_db_setting("grade_types")
    if gt_list and isinstance(gt_list, list):
        res = {}
        for item in gt_list:
            gid = str(item.get("id", "")).strip()
            w = float(item.get("weight", 0)) / 100.0
            if gid:
                res[gid] = w
        if res:
            return res

    gw = get_db_setting("grade_weights") or {}
    w_c1 = float(gw.get("check_1", 55.0)) / 100.0
    w_c2 = float(gw.get("check_2", 35.0)) / 100.0
    w_hw = float(gw.get("homework", 10.0)) / 100.0
    w_mt = float(gw.get("mock_test", 0.0)) / 100.0
    return {"check_1": w_c1, "check_2": w_c2, "homework": w_hw, "mock_test": w_mt}

def clear_settings_cache():
    """Clears memory cache for settings."""
    global _settings_cache
    _settings_cache.clear()
