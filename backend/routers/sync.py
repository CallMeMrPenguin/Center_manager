import os
import json
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config.settings import BASE_DIR
from database.connection import DB_PATH, get_connection, get_target_db_url, is_postgres
from services.sync_service import FAST_SYNC_TABLES, HEAVY_STATIC_TABLES, run_bidirectional_sync
from services.sync_worker import get_sync_status, trigger_instant_sync
from services.sync_http import get_remote_sync_url, set_remote_sync_url

router = APIRouter()

class SyncExchangeRequest(BaseModel):
    client_time: Optional[str] = None
    last_synced_at: Optional[str] = None
    force_full: Optional[bool] = False
    pushed_records: Optional[Dict[str, List[Dict[str, Any]]]] = None
    tombstones: Optional[List[Dict[str, str]]] = None

class SyncConfigRequest(BaseModel):
    remote_sync_url: str

def _parse_ts(val: Any) -> float:
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, datetime):
        if val.tzinfo is not None:
            return val.timestamp()
        return val.replace(tzinfo=timezone.utc).timestamp()
    if isinstance(val, str):
        val = val.strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(val, fmt)
                return dt.replace(tzinfo=timezone.utc).timestamp()
            except ValueError:
                continue
    try:
        return float(val)
    except Exception:
        return 0.0

@router.get("/api/sync/status")
def api_get_sync_status():
    if os.environ.get("APP_MODE") in ("web", "vps", "server"):
        return {
            "status": "synced",
            "mode": "cloud_server",
            "last_synced_at": "Trực tuyến (PostgreSQL Live)",
            "syncing": False,
            "remote_url": "Đang chạy trên máy chủ đám mây"
        }
    status = get_sync_status()
    status["remote_url"] = get_remote_sync_url()
    return status

@router.post("/api/sync/trigger")
def api_trigger_sync():
    if os.environ.get("APP_MODE") in ("web", "vps", "server"):
        return {"success": True, "message": "Đang chạy trực tiếp trên máy chủ đám mây"}
    try:
        trigger_instant_sync()
        return {"success": True, "message": "Đã kích hoạt đồng bộ hóa tức thì"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/api/sync/config")
def api_get_sync_config():
    return {"remote_sync_url": get_remote_sync_url()}

@router.post("/api/sync/config")
def api_save_sync_config(cfg: SyncConfigRequest):
    try:
        set_remote_sync_url(cfg.remote_sync_url)
        trigger_instant_sync()
        return {"success": True, "remote_sync_url": get_remote_sync_url()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/sync/bidirectional")
def api_run_bidirectional_sync(force_full: bool = False):
    try:
        result = run_bidirectional_sync(force_full=force_full)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Đồng bộ thất bại"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/sync/exchange")
def api_sync_exchange(req: SyncExchangeRequest):
    """
    Cloud Server endpoint on VPS PostgreSQL.
    Accepts client delta changes, performs conflict-free Last-Write-Wins upserts,
    and returns newer server records since client's last_synced_at.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        pushed_count = 0
        server_now = datetime.now(timezone.utc).isoformat()

        # 1. Apply client pushed changes if any
        if req.pushed_records:
            pk_lookup = {item["table"]: item["pk"] for item in FAST_SYNC_TABLES + HEAVY_STATIC_TABLES}

            for table, rows in req.pushed_records.items():
                if not rows:
                    continue
                pks = pk_lookup.get(table, ["id"])

                # Check if table exists in PostgreSQL
                try:
                    if is_postgres():
                        cursor.execute("SELECT 1 FROM information_schema.tables WHERE table_name = %s", (table,))
                    else:
                        cursor.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,))
                    if not cursor.fetchone():
                        continue
                except Exception:
                    continue

                for row in rows:
                    row_dict = dict(row)
                    # Check existing record for conflict resolution
                    pk_conditions = []
                    pk_values = []
                    for pk in pks:
                        pk_conditions.append(f"{pk} = %s" if is_postgres() else f"{pk} = ?")
                        pk_values.append(row_dict.get(pk))

                    where_clause = " AND ".join(pk_conditions)
                    cursor.execute(f"SELECT * FROM {table} WHERE {where_clause}", tuple(pk_values))
                    existing = cursor.fetchone()

                    should_update = True
                    if existing:
                        existing_dict = dict(existing)
                        c_ts = _parse_ts(row_dict.get("updated_at") or row_dict.get("created_at"))
                        s_ts = _parse_ts(existing_dict.get("updated_at") or existing_dict.get("created_at"))
                        # Last-Write-Wins: only update if client is newer or equal
                        if s_ts > c_ts:
                            should_update = False

                    if not should_update:
                        continue

                    # Upsert row
                    cols = list(row_dict.keys())
                    col_names = ", ".join(cols)
                    if is_postgres():
                        placeholders = ", ".join(["%s" for _ in cols])
                        pk_names = ", ".join(pks)
                        update_cols = [c for c in cols if c not in pks and c != "id"]
                        if update_cols:
                            update_clause = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_cols])
                            sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT ({pk_names}) DO UPDATE SET {update_clause}"
                        else:
                            sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT ({pk_names}) DO NOTHING"
                    else:
                        placeholders = ", ".join(["?" for _ in cols])
                        sql = f"INSERT OR REPLACE INTO {table} ({col_names}) VALUES ({placeholders})"

                    vals = [row_dict.get(c) for c in cols]
                    try:
                        cursor.execute(sql, tuple(vals))
                        pushed_count += 1
                    except Exception:
                        continue

                # Advance PostgreSQL sequence if integer primary key
                if is_postgres() and "id" in pks:
                    try:
                        cursor.execute(f"SELECT setval('{table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM {table}));")
                    except Exception:
                        pass

            conn.commit()

        # 2. Collect server changes to send back to client
        tables_to_return = FAST_SYNC_TABLES + (HEAVY_STATIC_TABLES if req.force_full or not req.last_synced_at else [])
        pulled_records: Dict[str, List[Dict[str, Any]]] = {}

        for t_info in tables_to_return:
            table = t_info["table"]
            try:
                if is_postgres():
                    cursor.execute("SELECT 1 FROM information_schema.tables WHERE table_name = %s", (table,))
                else:
                    cursor.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,))
                if not cursor.fetchone():
                    continue

                if is_postgres():
                    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = %s", (table,))
                    cols = [r["column_name"] if isinstance(r, dict) else r[0] for r in cursor.fetchall()]
                else:
                    cursor.execute(f"PRAGMA table_info({table})")
                    cols = [r[1] for r in cursor.fetchall()]

                if req.last_synced_at and not req.force_full and "updated_at" in cols:
                    q = f"SELECT * FROM {table} WHERE updated_at >= %s" if is_postgres() else f"SELECT * FROM {table} WHERE updated_at >= ?"
                    cursor.execute(q, (req.last_synced_at,))
                else:
                    cursor.execute(f"SELECT * FROM {table}")

                rows = [dict(r) for r in cursor.fetchall()]

                # Clean datetime objects to ISO strings for JSON serialization
                cleaned_rows = []
                for r in rows:
                    row_clean = {}
                    for k, v in r.items():
                        if isinstance(v, datetime):
                            row_clean[k] = v.isoformat()
                        else:
                            row_clean[k] = v
                    cleaned_rows.append(row_clean)

                if cleaned_rows:
                    pulled_records[table] = cleaned_rows
            except Exception:
                continue

        return {
            "success": True,
            "server_time": server_now,
            "pushed_count": pushed_count,
            "pulled_records": pulled_records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
