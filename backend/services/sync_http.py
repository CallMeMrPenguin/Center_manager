import os
import ssl
import json
import sqlite3
import hashlib
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

from config.settings import get_setting, set_setting, BASE_DIR
from database.connection import DB_PATH

DEFAULT_REMOTE_URL = "https://upkidscentermanager.io.vn"

def get_remote_sync_url() -> str:
    """Returns the configured remote VPS server URL for synchronization."""
    env_url = os.environ.get("REMOTE_SYNC_URL")
    if env_url and env_url.strip():
        return env_url.strip().rstrip("/")

    # Check local SQLite app_settings
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT setting_value FROM app_settings WHERE setting_key = 'remote_sync_url'")
            row = c.fetchone()
            conn.close()
            if row and row[0] and str(row[0]).strip():
                return str(row[0]).strip().rstrip("/")
        except Exception:
            pass

    cfg_url = get_setting("remote_sync_url")
    if cfg_url and str(cfg_url).strip():
        return str(cfg_url).strip().rstrip("/")

    return DEFAULT_REMOTE_URL

def set_remote_sync_url(url: str) -> bool:
    """Persists the remote VPS server URL in config and app_settings."""
    clean_url = str(url).strip().rstrip("/")
    set_setting("remote_sync_url", clean_url)
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("""
                CREATE TABLE IF NOT EXISTS app_settings (
                    setting_key TEXT PRIMARY KEY,
                    setting_value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            c.execute("""
                INSERT INTO app_settings (setting_key, setting_value, updated_at)
                VALUES ('remote_sync_url', ?, datetime('now'))
                ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = datetime('now')
            """, (clean_url,))
            conn.commit()
            conn.close()
            return True
        except Exception:
            pass
    return True

SYNC_SECRET_KEY = os.environ.get("SYNC_SECRET_KEY", "cm_sync_secret_vps_center_manager_2026")

def _make_http_request(url: str, method: str = "GET", data: Optional[Dict[str, Any]] = None, timeout: int = 15) -> Tuple[int, Any]:
    """
    Executes an HTTP/HTTPS request with robust SSL handling and X-Sync-Key header.
    Gracefully handles local clock discrepancies (e.g. year 2026) by falling back to unverified SSL context.
    """
    headers = {
        "User-Agent": "CenterManager-Sync/1.0",
        "Accept": "application/json",
        "X-Sync-Key": SYNC_SECRET_KEY,
    }
    encoded_data = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        encoded_data = json.dumps(data, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)

    # First attempt with standard default SSL context
    try:
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as res:
            res_body = res.read().decode("utf-8")
            return res.status, json.loads(res_body) if res_body else {}
    except urllib.error.URLError as url_err:
        # Check if SSL verification failed (e.g. machine clock is in future/past)
        err_str = str(url_err)
        if "CERTIFICATE_VERIFY_FAILED" in err_str or "certificate has expired" in err_str or "SSL" in err_str:
            try:
                unverified_ctx = ssl._create_unverified_context()
                with urllib.request.urlopen(req, context=unverified_ctx, timeout=timeout) as res:
                    res_body = res.read().decode("utf-8")
                    return res.status, json.loads(res_body) if res_body else {}
            except urllib.error.HTTPError as http_err:
                body = http_err.read().decode("utf-8")
                try:
                    return http_err.code, json.loads(body)
                except Exception:
                    return http_err.code, {"error": body}
            except Exception as e:
                return 500, {"error": str(e)}
        return 500, {"error": err_str}
    except urllib.error.HTTPError as http_err:
        body = http_err.read().decode("utf-8")
        try:
            return http_err.code, json.loads(body)
        except Exception:
            return http_err.code, {"error": body}
    except Exception as e:
        return 500, {"error": str(e)}

def _get_table_columns(cursor: sqlite3.Cursor, table: str) -> List[str]:
    """Retrieves column names for a SQLite table."""
    try:
        cursor.execute(f"PRAGMA table_info({table})")
        return [r[1] for r in cursor.fetchall()]
    except Exception:
        return []

def _upsert_rows_sqlite(cursor: sqlite3.Cursor, table: str, rows: List[Dict[str, Any]], pks: Optional[List[str]] = None) -> int:
    """Inserts or updates rows into a local SQLite table safely without cascade deletion risks."""
    if not rows:
        return 0
    table_cols = _get_table_columns(cursor, table)
    if not table_cols:
        return 0

    from services.sync_service import _parse_ts
    active_pks = pks or ["id"]

    count = 0
    for row in rows:
        row_dict = dict(row)

        # Special handling for app_users password_hash if missing
        if table == "app_users":
            if "password_hash" not in row_dict or not row_dict["password_hash"]:
                raw_pwd = row_dict.get("plain_password") or "123456"
                row_dict["password_hash"] = hashlib.sha256(raw_pwd.encode("utf-8")).hexdigest()

        cols = [col for col in table_cols if col in row_dict]
        if not cols:
            continue

        # Check existing row
        pk_conds = [f"{pk} = ?" for pk in active_pks]
        pk_vals = [row_dict.get(pk) for pk in active_pks]
        where_clause = " AND ".join(pk_conds)
        cursor.execute(f"SELECT * FROM {table} WHERE {where_clause}", tuple(pk_vals))
        existing = cursor.fetchone()

        if existing:
            existing_dict = dict(existing)
            r_ts = _parse_ts(row_dict.get("updated_at") or row_dict.get("created_at"))
            l_ts = _parse_ts(existing_dict.get("updated_at") or existing_dict.get("created_at"))
            # Last-Write-Wins: only update if remote is newer or equal
            if l_ts > r_ts:
                continue

            update_cols = [c for c in cols if c not in active_pks]
            if update_cols:
                set_clause = ", ".join([f"{c} = ?" for c in update_cols])
                vals = [row_dict.get(c) for c in update_cols] + pk_vals
                try:
                    cursor.execute(f"UPDATE {table} SET {set_clause} WHERE {where_clause}", vals)
                    count += 1
                except Exception:
                    continue
        else:
            placeholders = ", ".join(["?" for _ in cols])
            col_names = ", ".join(cols)
            vals = [row_dict.get(c) for c in cols]
            try:
                cursor.execute(f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})", vals)
                count += 1
            except Exception:
                continue
    return count


def sync_via_rest_fallback(remote_url: str) -> Dict[str, Any]:
    """
    Fallback synchronization pulling core resources via public REST endpoints.
    Used when /api/sync/exchange is not yet available or returning 404.
    """
    if not os.path.exists(DB_PATH):
        return {"success": False, "error": "Local database not found"}

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    pulled_total = 0
    synced_tables = []

    try:
        # 1. Teachers
        code, teachers = _make_http_request(f"{remote_url}/api/teachers", method="GET", timeout=12)
        if code == 200 and isinstance(teachers, list):
            c = _upsert_rows_sqlite(cur, "teachers_cm", teachers)
            pulled_total += c
            synced_tables.append("teachers_cm")

        # 2. Students
        code, students = _make_http_request(f"{remote_url}/api/students", method="GET", timeout=15)
        if code == 200 and isinstance(students, list):
            c = _upsert_rows_sqlite(cur, "students", students)
            pulled_total += c
            synced_tables.append("students")

        # 3. Classes
        code, classes = _make_http_request(f"{remote_url}/api/classes", method="GET", timeout=12)
        if code == 200 and isinstance(classes, list):
            c = _upsert_rows_sqlite(cur, "classes", classes)
            pulled_total += c
            synced_tables.append("classes")

        # 4. App Users
        code, users = _make_http_request(f"{remote_url}/api/users", method="GET", timeout=12)
        if code == 200 and isinstance(users, list):
            c = _upsert_rows_sqlite(cur, "app_users", users)
            pulled_total += c
            synced_tables.append("app_users")

        conn.commit()

        # Update last_synced_at
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _local_sync_meta (
                key TEXT PRIMARY KEY,
                val TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            INSERT INTO _local_sync_meta (key, val, updated_at)
            VALUES ('last_synced_at', ?, ?)
            ON CONFLICT (key) DO UPDATE SET val = EXCLUDED.val, updated_at = EXCLUDED.updated_at
        """, (now_str, now_str))
        conn.commit()

        return {
            "success": True,
            "pushed_records": 0,
            "pulled_records": pulled_total,
            "synced_tables": synced_tables,
            "synced_at": now_str,
            "mode": "rest_fallback"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def sync_via_http_exchange(remote_url: str, force_full: bool = False) -> Dict[str, Any]:
    """
    Executes bidirectional conflict-free sync with remote VPS using /api/sync/exchange.
    Falls back to sync_via_rest_fallback if exchange endpoint is unavailable.
    """
    if not os.path.exists(DB_PATH):
        return {"success": False, "error": "Local database not found"}

    from services.sync_service import FAST_SYNC_TABLES, HEAVY_STATIC_TABLES

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        pk_lookup = {item["table"]: item["pk"] for item in FAST_SYNC_TABLES + HEAVY_STATIC_TABLES}

        # Checkpoint table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _local_sync_meta (
                key TEXT PRIMARY KEY,
                val TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Ensure tombstones table exists
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _sync_tombstones (
                table_name TEXT NOT NULL,
                record_id TEXT NOT NULL,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (table_name, record_id)
            )
        """)

        last_synced_at = None
        if not force_full:
            cur.execute("SELECT val FROM _local_sync_meta WHERE key = 'last_synced_at'")
            row = cur.fetchone()
            if row:
                last_synced_at = row["val"]

        # Collect local tombstones (deletions)
        local_tombstones = []
        if last_synced_at and not force_full:
            cur.execute("SELECT table_name, record_id, deleted_at FROM _sync_tombstones WHERE deleted_at >= ?", (last_synced_at,))
        else:
            cur.execute("SELECT table_name, record_id, deleted_at FROM _sync_tombstones")
        for r in cur.fetchall():
            local_tombstones.append({
                "table": r["table_name"],
                "id": r["record_id"],
                "deleted_at": r["deleted_at"]
            })

        # Collect local changes to push
        tables_to_sync = FAST_SYNC_TABLES + (HEAVY_STATIC_TABLES if force_full or not last_synced_at else [])
        local_changes: Dict[str, List[Dict[str, Any]]] = {}

        for t_info in tables_to_sync:
            table = t_info["table"]
            cur.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
            if not cur.fetchone():
                continue

            cols = _get_table_columns(cur, table)
            if "updated_at" in cols and last_synced_at and not force_full:
                if "created_at" in cols:
                    cur.execute(f"SELECT * FROM {table} WHERE updated_at >= ? OR created_at >= ?", (last_synced_at, last_synced_at))
                else:
                    cur.execute(f"SELECT * FROM {table} WHERE updated_at >= ?", (last_synced_at,))
            elif "created_at" in cols and last_synced_at and not force_full:
                cur.execute(f"SELECT * FROM {table} WHERE created_at >= ?", (last_synced_at,))
            else:
                cur.execute(f"SELECT * FROM {table}")

            rows = [dict(r) for r in cur.fetchall()]
            if rows:
                local_changes[table] = rows

        # Prepare payload
        payload = {
            "client_time": datetime.now(timezone.utc).isoformat(),
            "last_synced_at": last_synced_at,
            "force_full": force_full,
            "pushed_records": local_changes,
            "tombstones": local_tombstones,
        }

        # Send HTTP exchange request
        exchange_url = f"{remote_url}/api/sync/exchange"
        status_code, resp = _make_http_request(exchange_url, method="POST", data=payload, timeout=25)

        # If endpoint not found or method not allowed on remote (e.g. before remote git pull):
        if status_code in (404, 405, 501):
            return sync_via_rest_fallback(remote_url)

        if status_code != 200 or not isinstance(resp, dict) or not resp.get("success"):
            err_msg = resp.get("error") or resp.get("detail") or f"HTTP {status_code}"
            # Try REST fallback as resilience measure
            fallback_res = sync_via_rest_fallback(remote_url)
            if fallback_res.get("success"):
                return fallback_res
            return {"success": False, "error": f"Remote sync error: {err_msg}"}

        # Apply pulled records & tombstones with cascade-safe constraints
        pulled_records = resp.get("pulled_records", {})
        server_tombstones = resp.get("tombstones", [])
        pulled_total = 0
        synced_tables = []

        cur.execute("PRAGMA foreign_keys = OFF;")
        try:
            # 1. Apply server tombstones
            for t_item in server_tombstones:
                t_tbl = t_item.get("table")
                t_id = t_item.get("id")
                t_del = t_item.get("deleted_at")
                if not t_tbl or not t_id or t_tbl not in pk_lookup:
                    continue
                pks = pk_lookup[t_tbl]
                try:
                    if len(pks) == 1:
                        cur.execute(f"DELETE FROM {t_tbl} WHERE {pks[0]} = ?", (t_id,))
                    elif ":" in str(t_id):
                        parts = str(t_id).split(":")
                        if len(parts) == len(pks):
                            conds = [f"{pk} = ?" for pk in pks]
                            cur.execute(f"DELETE FROM {t_tbl} WHERE " + " AND ".join(conds), tuple(parts))
                    cur.execute("""
                        INSERT INTO _sync_tombstones (table_name, record_id, deleted_at)
                        VALUES (?, ?, ?)
                        ON CONFLICT (table_name, record_id) DO UPDATE SET deleted_at = ?;
                    """, (t_tbl, str(t_id), t_del or datetime.now().strftime("%Y-%m-%d %H:%M:%S"), t_del or datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
                except Exception:
                    continue

            # 2. Apply pulled records in dependency order
            for table, rows in pulled_records.items():
                if rows and isinstance(rows, list):
                    cur.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
                    if not cur.fetchone():
                        continue
                    pks = pk_lookup.get(table, ["id"])
                    c = _upsert_rows_sqlite(cur, table, rows, pks=pks)
                    pulled_total += c
                    synced_tables.append(table)
        finally:
            cur.execute("PRAGMA foreign_keys = ON;")

        conn.commit()

        # Update last_synced_at checkpoint to authoritative server clock
        server_time = resp.get("server_time") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute("""
            INSERT INTO _local_sync_meta (key, val, updated_at)
            VALUES ('last_synced_at', ?, datetime('now'))
            ON CONFLICT (key) DO UPDATE SET val = EXCLUDED.val, updated_at = datetime('now')
        """, (server_time,))
        conn.commit()

        return {
            "success": True,
            "pushed_records": resp.get("pushed_count", 0),
            "pulled_records": pulled_total,
            "synced_tables": synced_tables,
            "synced_at": server_time,
            "mode": "http_exchange"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

