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
        if not val:
            return 0.0
        try:
            clean_str = val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            if dt.tzinfo is not None:
                return dt.timestamp()
            return dt.replace(tzinfo=timezone.utc).timestamp()
        except Exception:
            pass

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
    Cloud Server endpoint on VPS PostgreSQL (or local fallback).
    Accepts client delta changes & tombstones, performs conflict-free Last-Write-Wins updates,
    advances PostgreSQL sequence counters to prevent ID collisions,
    and returns newer server records & tombstones since client's last_synced_at.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        pushed_count = 0
        server_now = datetime.now(timezone.utc).isoformat()
        pk_lookup = {item["table"]: item["pk"] for item in FAST_SYNC_TABLES + HEAVY_STATIC_TABLES}

        # Ensure server _sync_tombstones table exists
        try:
            if is_postgres():
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS public._sync_tombstones (
                        table_name TEXT NOT NULL,
                        record_id TEXT NOT NULL,
                        deleted_at TIMESTAMPTZ DEFAULT NOW(),
                        PRIMARY KEY (table_name, record_id)
                    );
                """)
            else:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS _sync_tombstones (
                        table_name TEXT NOT NULL,
                        record_id TEXT NOT NULL,
                        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (table_name, record_id)
                    );
                """)
            conn.commit()
        except Exception:
            pass

        # 1. Apply client tombstones (deletions from client)
        if req.tombstones:
            for item in req.tombstones:
                t_table = item.get("table")
                t_id = item.get("id")
                t_del_at = item.get("deleted_at") or server_now
                if not t_table or not t_id or t_table not in pk_lookup:
                    continue

                pks = pk_lookup[t_table]
                try:
                    if len(pks) == 1:
                        pk_col = pks[0]
                        del_q = f"DELETE FROM {t_table} WHERE {pk_col} = %s" if is_postgres() else f"DELETE FROM {t_table} WHERE {pk_col} = ?"
                        cursor.execute(del_q, (t_id,))
                    elif ":" in str(t_id):
                        parts = str(t_id).split(":")
                        if len(parts) == len(pks):
                            conds = [f"{pk} = %s" if is_postgres() else f"{pk} = ?" for pk in pks]
                            del_q = f"DELETE FROM {t_table} WHERE " + " AND ".join(conds)
                            cursor.execute(del_q, tuple(parts))

                    # Record tombstone on server so other clients also receive the deletion
                    if is_postgres():
                        cursor.execute("""
                            INSERT INTO public._sync_tombstones (table_name, record_id, deleted_at)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (table_name, record_id) DO UPDATE SET deleted_at = EXCLUDED.deleted_at;
                        """, (t_table, str(t_id), t_del_at))
                    else:
                        cursor.execute("""
                            INSERT INTO _sync_tombstones (table_name, record_id, deleted_at)
                            VALUES (?, ?, ?)
                            ON CONFLICT (table_name, record_id) DO UPDATE SET deleted_at = ?;
                        """, (t_table, str(t_id), t_del_at, t_del_at))
                except Exception:
                    continue
            conn.commit()

        # 2. Apply client pushed changes (Upserts with Last-Write-Wins)
        if req.pushed_records:
            for table, rows in req.pushed_records.items():
                if not rows or table not in pk_lookup:
                    continue
                pks = pk_lookup[table]

                # Check if table exists
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
                        if s_ts > c_ts:
                            should_update = False

                    if not should_update:
                        continue

                    cols = list(row_dict.keys())
                    if existing:
                        # Update existing row
                        update_cols = [c for c in cols if c not in pks]
                        if update_cols:
                            set_clause = ", ".join([f"{c} = %s" if is_postgres() else f"{c} = ?" for c in update_cols])
                            update_sql = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
                            update_vals = [row_dict.get(c) for c in update_cols] + pk_values
                            try:
                                cursor.execute(update_sql, tuple(update_vals))
                                pushed_count += 1
                            except Exception:
                                pass
                    else:
                        # Insert new row
                        # If composite key and id is autoincrement, let sequence assign id
                        insert_cols = cols
                        if pks != ["id"] and "id" in insert_cols and is_postgres():
                            insert_cols = [c for c in cols if c != "id"]

                        col_names = ", ".join(insert_cols)
                        placeholders = ", ".join(["%s" if is_postgres() else "?" for _ in insert_cols])
                        vals = [row_dict.get(c) for c in insert_cols]
                        insert_sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"
                        try:
                            cursor.execute(insert_sql, tuple(vals))
                            pushed_count += 1
                        except Exception:
                            pass

                # Advance PostgreSQL sequence to avoid primary key collision with future web mutations
                if is_postgres() and "id" in pks:
                    try:
                        cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM {table};")
                    except Exception:
                        try:
                            cursor.execute(f"SELECT setval('{table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM {table}));")
                        except Exception:
                            pass

            conn.commit()

        # 3. Collect server tombstones since client's last_synced_at
        server_tombstones = []
        try:
            if req.last_synced_at and not req.force_full:
                tomb_q = "SELECT table_name, record_id, deleted_at FROM _sync_tombstones WHERE deleted_at >= %s" if is_postgres() else "SELECT table_name, record_id, deleted_at FROM _sync_tombstones WHERE deleted_at >= ?"
                cursor.execute(tomb_q, (req.last_synced_at,))
            else:
                cursor.execute("SELECT table_name, record_id, deleted_at FROM _sync_tombstones" if not is_postgres() else "SELECT table_name, record_id, deleted_at FROM public._sync_tombstones")
            for r in cursor.fetchall():
                rd = dict(r)
                del_at_val = rd.get("deleted_at")
                if isinstance(del_at_val, datetime):
                    del_at_val = del_at_val.isoformat()
                server_tombstones.append({
                    "table": rd.get("table_name"),
                    "id": rd.get("record_id"),
                    "deleted_at": str(del_at_val)
                })
        except Exception:
            pass

        # 4. Collect server changes to send back to client
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
                    q = f"SELECT * FROM {table} WHERE updated_at >= (%s::timestamptz - interval '5 seconds')" if is_postgres() else f"SELECT * FROM {table} WHERE datetime(REPLACE(SUBSTR(updated_at, 1, 19), 'T', ' ')) >= datetime(REPLACE(SUBSTR(?, 1, 19), 'T', ' '))"
                    cursor.execute(q, (req.last_synced_at,))
                elif req.last_synced_at and not req.force_full and "created_at" in cols:
                    q = f"SELECT * FROM {table} WHERE created_at >= (%s::timestamptz - interval '5 seconds')" if is_postgres() else f"SELECT * FROM {table} WHERE datetime(REPLACE(SUBSTR(created_at, 1, 19), 'T', ' ')) >= datetime(REPLACE(SUBSTR(?, 1, 19), 'T', ' '))"
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
            "pulled_records": pulled_records,
            "tombstones": server_tombstones
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

