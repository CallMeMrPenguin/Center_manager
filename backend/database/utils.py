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

def record_tombstone(table_name: str, record_id: Any):
    """
    Records an entity deletion tombstone in _sync_tombstones to prevent zombie resurrection
    across bidirectional local <-> VPS synchronization.
    """
    if not table_name or record_id is None:
        return
    import os
    rec_str = str(record_id).strip()
    if not rec_str:
        return

    try:
        from database.connection import get_connection, is_postgres
        conn = get_connection()
        try:
            cur = conn.cursor()
            if is_postgres():
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS public._sync_tombstones (
                        table_name TEXT NOT NULL,
                        record_id TEXT NOT NULL,
                        deleted_at TIMESTAMPTZ DEFAULT NOW(),
                        PRIMARY KEY (table_name, record_id)
                    );
                """)
                cur.execute("""
                    INSERT INTO public._sync_tombstones (table_name, record_id, deleted_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (table_name, record_id) DO UPDATE SET deleted_at = EXCLUDED.deleted_at;
                """, (table_name, rec_str))
            else:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS _sync_tombstones (
                        table_name TEXT NOT NULL,
                        record_id TEXT NOT NULL,
                        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (table_name, record_id)
                    );
                """)
                cur.execute("""
                    INSERT INTO _sync_tombstones (table_name, record_id, deleted_at)
                    VALUES (?, ?, datetime('now'))
                    ON CONFLICT (table_name, record_id) DO UPDATE SET deleted_at = datetime('now');
                """, (table_name, rec_str))
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass

    # In local desktop mode, trigger instant sync worker
    if os.environ.get("APP_MODE") not in ("web", "vps", "server"):
        try:
            from services.sync_worker import trigger_instant_sync
            trigger_instant_sync()
        except Exception:
            pass

