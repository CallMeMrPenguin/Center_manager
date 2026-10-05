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

def _sync_cloud_delete_statements(statements: list, timeout: int = 3):
    """
    Executes multiple SQL delete statements against remote PostgreSQL in a SINGLE connection & transaction.
    If no remote database is configured, returns immediately in 0ms without network overhead.
    """
    try:
        import os
        if os.environ.get("APP_MODE") in ("web", "vps", "server"):
            return
        from database.connection import get_target_db_url
        target_url = get_target_db_url()
        if not target_url:
            return
        import psycopg2
        pconn = psycopg2.connect(target_url, connect_timeout=timeout)
        try:
            with pconn.cursor() as pcur:
                for sql_pg, params in statements:
                    pcur.execute(sql_pg, params)
            pconn.commit()
        finally:
            pconn.close()
    except Exception:
        pass

def _sync_cloud_delete(sql_pg: str, params: tuple):
    import threading
    def _task():
        _sync_cloud_delete_statements([(sql_pg, params)])
    threading.Thread(target=_task, daemon=True).start()

def _sync_cloud_delete_sync(sql_pg: str, params: tuple):
    _sync_cloud_delete_statements([(sql_pg, params)])
