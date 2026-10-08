import os
import sys
import json
import time
import sqlite3
import urllib.request
import urllib.error
import ssl
from typing import Dict, Any, List, Optional
from datetime import datetime, date, timezone

from config.settings import BASE_DIR, load_settings
from database.connection import get_connection, DB_PATH
from services.sync_service import FAST_SYNC_TABLES, _parse_ts

DEFAULT_REMOTE_URL = "https://upkidscentermanager.io.vn"

def _clean_val(v: Any) -> Any:
    """Converts datatypes to JSON-safe primitives (handles date, datetime, Decimal, bytes)."""
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    if hasattr(v, "__float__") and not isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, (bytes, bytearray)):
        return v.decode("utf-8", errors="ignore")
    return v

def _clean_row(d: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _clean_val(v) for k, v in d.items()}

def get_sync_token() -> str:
    """Returns persistent sync secret shared between local and VPS."""
    secret_file = os.path.join(BASE_DIR, ".auth_secret")
    try:
        if os.path.exists(secret_file):
            with open(secret_file, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    return content
    except Exception:
        pass
    return os.environ.get("AUTH_SECRET_KEY", "5f54741078b525e23c8ffdca96bb7fbefd7f617c867f26891c3bc6a3537d0eba")

def get_remote_vps_url() -> str:
    """Retrieves target remote VPS base URL."""
    env_url = os.environ.get("REMOTE_VPS_URL")
    if env_url and env_url.strip():
        return env_url.strip().rstrip("/")
    try:
        st = load_settings()
        if st.get("remote_vps_url"):
            return str(st["remote_vps_url"]).strip().rstrip("/")
    except Exception:
        pass
    return DEFAULT_REMOTE_URL

def handle_sync_exchange(payload: Dict[str, Any], token: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes on the server (VPS or local receiver) to idempotently merge changes and return updates.
    Uses Last-Write-Wins based on timestamps with savepoints for zero-crash stability.
    """
    expected_tokens = {
        get_sync_token(),
        "cm_sync_secret_vps_center_manager_2026",
        "5f54741078b525e23c8ffdca96bb7fbefd7f617c867f26891c3bc6a3537d0eba"
    }
    clean_token = (token or "").replace("Bearer ", "").strip()
    if clean_token not in expected_tokens:
        try:
            from services.auth_security import verify_access_token
            decoded = verify_access_token(clean_token)
            if not decoded or decoded.get("role") not in ("Quản trị viên", "admin"):
                return {"success": False, "error": "Unauthorized sync token"}
        except Exception:
            return {"success": False, "error": "Unauthorized sync token"}

    since = payload.get("since") or payload.get("last_synced_at")
    client_dirty = payload.get("dirty_rows") or payload.get("pushed_records") or {}
    client_tombstones = payload.get("tombstones", [])
    now_utc = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    try:
        cur = conn.cursor()
        pushed_accepted = 0

        # 1. Apply client tombstones (deletions)
        for ts in client_tombstones:
            tbl = ts.get("table") or ts.get("table_name")
            rec_id = ts.get("id") or ts.get("record_id")
            if tbl and rec_id is not None:
                try:
                    cur.execute(f"DELETE FROM {tbl} WHERE id = ?", (rec_id,))
                    from database.utils import record_tombstone
                    record_tombstone(tbl, rec_id)
                except Exception:
                    pass

        # 2. Ingest client dirty rows using Last-Write-Wins (protected by savepoints)
        for t_info in FAST_SYNC_TABLES:
            table = t_info["table"]
            pks = t_info["pk"]
            rows = client_dirty.get(table, [])
            if not rows:
                continue

            for r in rows:
                if not isinstance(r, dict):
                    continue
                cols = list(r.keys())
                if not cols:
                    continue

                try:
                    try:
                        cur.execute("SAVEPOINT row_sp;")
                    except Exception:
                        pass

                    pk_where = " AND ".join([f"{k} = ?" for k in pks])
                    pk_vals = [r.get(k) for k in pks]
                    cur.execute(f"SELECT * FROM {table} WHERE {pk_where} LIMIT 1", pk_vals)
                    existing_row = cur.fetchone()

                    should_apply = True
                    if existing_row:
                        ex_dict = dict(existing_row)
                        client_ts = _parse_ts(r.get("updated_at") or r.get("created_at"))
                        server_ts = _parse_ts(ex_dict.get("updated_at") or ex_dict.get("created_at"))
                        if server_ts > client_ts:
                            should_apply = False

                    if should_apply:
                        col_str = ", ".join(cols)
                        ph_str = ", ".join(["?" for _ in cols])
                        pk_str = ", ".join(pks)
                        upd_cols = [c for c in cols if c not in pks and c != "id"]

                        if upd_cols:
                            upd_clause = ", ".join([f"{c} = EXCLUDED.{c}" for c in upd_cols])
                            sql = f"INSERT INTO {table} ({col_str}) VALUES ({ph_str}) ON CONFLICT ({pk_str}) DO UPDATE SET {upd_clause}"
                        else:
                            sql = f"INSERT INTO {table} ({col_str}) VALUES ({ph_str}) ON CONFLICT ({pk_str}) DO NOTHING"

                        cur.execute(sql, [r.get(c) for c in cols])
                        pushed_accepted += 1

                    try:
                        cur.execute("RELEASE SAVEPOINT row_sp;")
                    except Exception:
                        pass
                except Exception as e:
                    try:
                        cur.execute("ROLLBACK TO SAVEPOINT row_sp;")
                    except Exception:
                        pass
                    print(f"[Sync Ingest Notice on {table}]:", e)

        conn.commit()

        # 3. Gather server updates modified since 'since'
        server_rows = {}
        total_server_rows = 0

        for t_info in FAST_SYNC_TABLES:
            table = t_info["table"]
            try:
                try:
                    cur.execute(f"SAVEPOINT tbl_sp;")
                except Exception:
                    pass

                # Inspect columns in table
                cols_check = set()
                try:
                    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}';")
                    cols_check = {r["column_name"] if isinstance(r, dict) else r[0] for r in cur.fetchall()}
                except Exception:
                    pass

                has_updated = "updated_at" in cols_check if cols_check else True
                has_created = "created_at" in cols_check if cols_check else True

                if since and (has_updated or has_created):
                    since_ts = _parse_ts(since)
                    since_dt = datetime.fromtimestamp(since_ts, timezone.utc)
                    since_iso = since_dt.isoformat()
                    since_plain = since_dt.strftime("%Y-%m-%d %H:%M:%S")
                    conds = []
                    params = []
                    if has_updated:
                        conds.append("(updated_at > ? OR updated_at > ?)")
                        params.extend([since_iso, since_plain])
                    if has_created:
                        conds.append("(created_at > ? OR created_at > ?)")
                        params.extend([since_iso, since_plain])
                    sql = f"SELECT * FROM {table} WHERE " + " OR ".join(conds)
                    cur.execute(sql, tuple(params))
                else:
                    cur.execute(f"SELECT * FROM {table}")

                fetched = [_clean_row(dict(r)) for r in cur.fetchall()]
                if fetched:
                    server_rows[table] = fetched
                    total_server_rows += len(fetched)

                try:
                    cur.execute(f"RELEASE SAVEPOINT tbl_sp;")
                except Exception:
                    pass
            except Exception:
                try:
                    cur.execute(f"ROLLBACK TO SAVEPOINT tbl_sp;")
                except Exception:
                    pass

        # 4. Gather server tombstones
        server_tombstones = []
        try:
            if since:
                cur.execute("SELECT table_name, record_id, deleted_at FROM _sync_tombstones WHERE deleted_at > ?", (since,))
            else:
                cur.execute("SELECT table_name, record_id, deleted_at FROM _sync_tombstones")
            server_tombstones = [_clean_row(dict(r)) for r in cur.fetchall()]
        except Exception:
            pass

        return {
            "success": True,
            "server_time": now_utc,
            "server_rows": server_rows,
            "pulled_records": server_rows,
            "tombstones": server_tombstones,
            "pushed_accepted": pushed_accepted,
            "pushed_count": pushed_accepted,
            "pulled_count": total_server_rows
        }
    finally:
        conn.close()

def run_http_bidirectional_sync(force_full: bool = False) -> Dict[str, Any]:
    """
    Executes bidirectional HTTP delta sync between local desktop SQLite and remote VPS.
    Works seamlessly through Caddy HTTPS over WAN without exposing raw PostgreSQL ports.
    """
    if not os.path.exists(DB_PATH):
        return {"success": False, "error": "Local SQLite database not found"}

    remote_url = get_remote_vps_url()
    sync_token = get_sync_token()

    sconn = sqlite3.connect(DB_PATH)
    sconn.row_factory = sqlite3.Row
    scur = sconn.cursor()

    try:
        # Checkpoint meta table
        scur.execute("""
            CREATE TABLE IF NOT EXISTS _local_sync_meta (
                key TEXT PRIMARY KEY,
                val TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        last_synced_at = None
        if not force_full:
            scur.execute("SELECT val FROM _local_sync_meta WHERE key = 'last_synced_at'")
            row = scur.fetchone()
            if row:
                last_synced_at = row["val"]

        # 1. Collect local dirty rows with SQLite datetime comparison
        client_dirty = {}
        for t_info in FAST_SYNC_TABLES:
            table = t_info["table"]
            scur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
            if not scur.fetchone():
                continue

            try:
                scur.execute(f"PRAGMA table_info({table})")
                cols = {r[1] for r in scur.fetchall()}
                has_updated = "updated_at" in cols
                has_created = "created_at" in cols

                if last_synced_at and (has_updated or has_created):
                    sync_ts = _parse_ts(last_synced_at)
                    sync_dt_plain = datetime.fromtimestamp(sync_ts, timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                    conds = []
                    params = []
                    if has_updated:
                        conds.append("(updated_at IS NOT NULL AND datetime(updated_at) > datetime(?))")
                        params.append(sync_dt_plain)
                    if has_created:
                        conds.append("(created_at IS NOT NULL AND datetime(created_at) > datetime(?))")
                        params.append(sync_dt_plain)
                    sql = f"SELECT * FROM {table} WHERE " + " OR ".join(conds)
                    scur.execute(sql, tuple(params))
                else:
                    scur.execute(f"SELECT * FROM {table}")
                rows = [_clean_row(dict(r)) for r in scur.fetchall()]
                if rows:
                    client_dirty[table] = rows
            except Exception:
                try:
                    scur.execute(f"SELECT * FROM {table}")
                    rows = [_clean_row(dict(r)) for r in scur.fetchall()]
                    if rows:
                        client_dirty[table] = rows
                except Exception:
                    pass

        # 2. Collect local tombstones
        client_tombstones = []
        try:
            if last_synced_at:
                scur.execute("SELECT table_name, record_id, deleted_at FROM _sync_tombstones WHERE datetime(deleted_at) > datetime(?)", (last_synced_at,))
            else:
                scur.execute("SELECT table_name, record_id, deleted_at FROM _sync_tombstones")
            client_tombstones = [_clean_row(dict(r)) for r in scur.fetchall()]
        except Exception:
            pass

        # 3. Send HTTP request to VPS exchange endpoint
        exchange_url = f"{remote_url}/api/sync/exchange"
        now_str = datetime.now(timezone.utc).isoformat()
        payload_data = json.dumps({
            "client_time": now_str,
            "last_synced_at": last_synced_at,
            "since": last_synced_at,
            "force_full": force_full,
            "pushed_records": client_dirty,
            "dirty_rows": client_dirty,
            "tombstones": client_tombstones
        }, default=str).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "CenterManagerSync/1.0",
            "X-Sync-Key": "cm_sync_secret_vps_center_manager_2026",
            "X-Sync-Token": sync_token or "cm_sync_secret_vps_center_manager_2026",
        }

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(exchange_url, data=payload_data, headers=headers, method="POST")

        res_data = None
        last_err = ""
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, context=ctx, timeout=25) as response:
                    resp_text = response.read().decode("utf-8")
                    res_data = json.loads(resp_text)
                    break
            except urllib.error.HTTPError as he:
                err_body = he.read().decode("utf-8", errors="ignore")
                last_err = f"VPS HTTP {he.code}: {err_body[:200]}"
                if he.code in (502, 503, 504) and attempt < 2:
                    time.sleep(2)
                    continue
                return {"success": False, "error": last_err}
            except Exception as e:
                last_err = f"Không thể kết nối đến máy chủ VPS: {str(e)}"
                if attempt < 2:
                    time.sleep(2)
                    continue
                return {"success": False, "error": last_err}

        if not res_data:
            return {"success": False, "error": last_err or "VPS connection timeout"}

        if not res_data.get("success"):
            return {"success": False, "error": res_data.get("error", "Sync exchange failed on VPS")}

        server_time = res_data.get("server_time")
        server_rows = res_data.get("server_rows") or res_data.get("pulled_records") or {}
        server_tombstones = res_data.get("tombstones", [])
        pulled_total = 0

        # 4. Ingest server tombstones (deletions) into local SQLite
        for ts in server_tombstones:
            tbl = ts.get("table") or ts.get("table_name")
            rec_id = ts.get("id") or ts.get("record_id")
            if tbl and rec_id is not None:
                try:
                    scur.execute(f"DELETE FROM {tbl} WHERE id = ?", (rec_id,))
                except Exception:
                    pass

        # 5. Ingest server rows into local SQLite with Last-Write-Wins
        for t_info in FAST_SYNC_TABLES:
            table = t_info["table"]
            pks = t_info["pk"]
            rows = server_rows.get(table, [])
            if not rows:
                continue

            for r in rows:
                cols = list(r.keys())
                if not cols:
                    continue

                # Check if local record exists and is newer
                pk_where = " AND ".join([f"{k} = ?" for k in pks])
                pk_vals = [r.get(k) for k in pks]
                try:
                    scur.execute(f"SELECT * FROM {table} WHERE {pk_where} LIMIT 1", pk_vals)
                    local_ex = scur.fetchone()
                    if local_ex:
                        local_dict = dict(local_ex)
                        local_ts = _parse_ts(local_dict.get("updated_at") or local_dict.get("created_at"))
                        srv_ts = _parse_ts(r.get("updated_at") or r.get("created_at"))
                        if local_ts > srv_ts:
                            continue
                except Exception:
                    pass

                col_names = ", ".join(cols)
                placeholders = ", ".join(["?" for _ in cols])
                pk_names = ", ".join(pks)
                update_cols = [c for c in cols if c not in pks]

                if update_cols:
                    update_clause = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_cols])
                    sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT ({pk_names}) DO UPDATE SET {update_clause}"
                else:
                    sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT ({pk_names}) DO NOTHING"

                try:
                    scur.execute(sql, [r.get(c) for c in cols])
                    pulled_total += 1
                except Exception as e:
                    print(f"[Local SQLite Ingest Notice on {table}]:", e)

        sconn.commit()

        # 6. Save checkpoint in _local_sync_meta
        now_utc = datetime.now(timezone.utc).isoformat()
        checkpoint_val = server_time or now_utc
        scur.execute("""
            INSERT INTO _local_sync_meta (key, val, updated_at)
            VALUES ('last_synced_at', ?, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET val = EXCLUDED.val, updated_at = CURRENT_TIMESTAMP
        """, (checkpoint_val,))
        sconn.commit()

        # 7. Invalidate local backend caches
        try:
            from services.cache_service import cache_invalidate
            cache_invalidate("*")
        except Exception:
            pass

        return {
            "success": True,
            "pushed_records": res_data.get("pushed_accepted", res_data.get("pushed_count", 0)),
            "pulled_records": pulled_total,
            "synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "mode": "http_delta"
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        sconn.close()
