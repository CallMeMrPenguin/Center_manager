import os
import sys
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime
import psycopg2
import psycopg2.extras

from database.connection import DB_PATH, get_target_db_url, SUPABASE_DEFAULT_DB_URL

FAST_SYNC_TABLES = [
    # Level 0 (Master / Standalone)
    {"table": "app_settings", "pk": ["setting_key"]},
    {"table": "role_permissions", "pk": ["role", "tab_id"]},
    {"table": "app_users", "pk": ["id"]},
    {"table": "teachers_cm", "pk": ["id"]},
    {"table": "students", "pk": ["id"]},
    {"table": "courses", "pk": ["id"]},
    {"table": "document_folders", "pk": ["id"]},
    {"table": "documents", "pk": ["id"]},
    # Level 1 (Dependent on Master)
    {"table": "classes", "pk": ["id"]},
    {"table": "assignments", "pk": ["id"]},
    {"table": "custom_time_phases", "pk": ["id"]},
    {"table": "friend_groups", "pk": ["id"]},
    {"table": "conflict_groups", "pk": ["id"]},
    # Level 2 (Junction / Details)
    {"table": "class_students", "pk": ["class_id", "student_id"]},
    {"table": "class_schedule_weekly", "pk": ["id"]},
    {"table": "class_sessions", "pk": ["id"]},
    {"table": "class_attendance_grades", "pk": ["class_id", "student_id", "date"]},
    {"table": "assignment_submissions", "pk": ["assignment_id", "student_id"]},
    {"table": "friend_group_members", "pk": ["class_id", "student_id"]},
    {"table": "conflict_group_members", "pk": ["class_id", "student_id"]},
    {"table": "conflict_relationships", "pk": ["class_id", "student_id1", "student_id2"]},
    {"table": "trusted_swap_relationships", "pk": ["class_id", "student_id1", "student_id2"]},
    {"table": "trusted_swap_students", "pk": ["class_id", "student_id"]},
    {"table": "student_scores", "pk": ["student_id", "class_id", "score_type"]},
]

HEAVY_STATIC_TABLES = [
    {"table": "question_bank", "pk": ["id"]},
    {"table": "vocabulary_list", "pk": ["id"]},
    {"table": "document_attachments", "pk": ["id"]},
]

def _parse_ts(val: Any) -> float:
    """Parses timestamp or string to epoch seconds for accurate comparison."""
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, datetime):
        return val.timestamp()
    try:
        s = str(val).replace("T", " ").split("+")[0].split(".")[0]
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S").timestamp()
    except Exception:
        return 0.0

def run_bidirectional_sync(force_full: bool = False) -> Dict[str, Any]:
    """
    Executes conflict-free near-instant bidirectional delta sync between Local SQLite and Supabase PostgreSQL.
    Uses Last-Write-Wins based on updated_at and idempotent upserts.
    """
    if not os.path.exists(DB_PATH):
        return {"success": False, "error": "Local SQLite database not found"}

    target_url = get_target_db_url() or SUPABASE_DEFAULT_DB_URL
    if not target_url:
        return {"success": False, "error": "No remote PostgreSQL database URL configured"}

    sconn = sqlite3.connect(DB_PATH)
    sconn.row_factory = sqlite3.Row
    scur = sconn.cursor()

    try:
        pconn = psycopg2.connect(target_url, connect_timeout=8)
        pcur = pconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except Exception as e:
        sconn.close()
        return {"success": False, "error": f"Failed to connect to Supabase: {str(e)}"}

    pushed_total = 0
    pulled_total = 0
    synced_tables = []
    sync_start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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

        tables_to_sync = FAST_SYNC_TABLES + (HEAVY_STATIC_TABLES if force_full or not last_synced_at else [])

        for t_info in tables_to_sync:
            table = t_info["table"]
            pks = t_info["pk"]

            # 1. Check if table exists on both sides
            scur.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
            if not scur.fetchone():
                continue

            try:
                pcur.execute(f"SELECT 1 FROM information_schema.tables WHERE table_name = %s", (table,))
                if not pcur.fetchone():
                    continue
            except Exception:
                continue

            # 2. Fetch records
            scur.execute(f"SELECT * FROM {table}")
            local_rows = [dict(r) for r in scur.fetchall()]

            pcur.execute(f"SELECT * FROM {table}")
            cloud_rows = [dict(r) for r in pcur.fetchall()]

            # Index by primary key tuple
            def make_pk(row):
                return tuple(str(row.get(k, "")) for k in pks)

            local_map = {make_pk(r): r for r in local_rows}
            cloud_map = {make_pk(r): r for r in cloud_rows}

            to_push = []
            to_pull = []
            all_keys = set(local_map.keys()) | set(cloud_map.keys())

            for k in all_keys:
                loc = local_map.get(k)
                cld = cloud_map.get(k)

                if loc and not cld:
                    to_push.append(loc)
                elif cld and not loc:
                    to_pull.append(cld)
                elif loc and cld:
                    loc_ts = _parse_ts(loc.get("updated_at") or loc.get("created_at"))
                    cld_ts = _parse_ts(cld.get("updated_at") or cld.get("created_at"))

                    if loc_ts > cld_ts:
                        to_push.append(loc)
                    elif cld_ts > loc_ts:
                        to_pull.append(cld)

            # 3. Apply PUSH (Local -> Cloud)
            if to_push:
                cols = list(to_push[0].keys())
                col_names = ", ".join(cols)
                pk_names = ", ".join(pks)
                update_cols = [c for c in cols if c not in pks]
                
                if update_cols:
                    update_clause = ", ".join([f"{c} = EXCLUDED.{c}" for c in update_cols])
                    sql = f"INSERT INTO {table} ({col_names}) VALUES %s ON CONFLICT ({pk_names}) DO UPDATE SET {update_clause}"
                else:
                    sql = f"INSERT INTO {table} ({col_names}) VALUES %s ON CONFLICT ({pk_names}) DO NOTHING"

                values = [tuple(r.get(c) for c in cols) for r in to_push]
                psycopg2.extras.execute_values(pcur, sql, values, page_size=500)
                pconn.commit()
                pushed_total += len(to_push)

            # 4. Apply PULL (Cloud -> Local)
            if to_pull:
                cols = list(to_pull[0].keys())
                col_names = ", ".join(cols)
                placeholders = ", ".join(["?" for _ in cols])
                sql = f"INSERT OR REPLACE INTO {table} ({col_names}) VALUES ({placeholders})"

                for r in to_pull:
                    scur.execute(sql, tuple(r.get(c) for c in cols))
                sconn.commit()
                pulled_total += len(to_pull)

            # 5. Resync Sequence in Postgres if table has integer id
            if "id" in pks and to_push:
                try:
                    pcur.execute(f"SELECT setval('{table}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM {table}));")
                    pconn.commit()
                except Exception:
                    pass

            synced_tables.append(table)

        # 6. Save checkpoint to _local_sync_meta
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        scur.execute("""
            INSERT INTO _local_sync_meta (key, val, updated_at)
            VALUES ('last_synced_at', ?, ?)
            ON CONFLICT (key) DO UPDATE SET val = EXCLUDED.val, updated_at = EXCLUDED.updated_at
        """, (sync_start_time, now_str))
        sconn.commit()

        return {
            "success": True,
            "pushed_records": pushed_total,
            "pulled_records": pulled_total,
            "synced_tables": synced_tables,
            "synced_at": now_str,
            "fast_mode": not force_full and bool(last_synced_at)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        sconn.close()
        pconn.close()
