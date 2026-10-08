import os
import sys
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    psycopg2 = None

from database.connection import DB_PATH, get_target_db_url

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

def run_bidirectional_sync(force_full: bool = False) -> Dict[str, Any]:
    """
    Executes conflict-free bidirectional delta sync between Local SQLite and remote VPS.
    Uses high-performance HTTP Delta Exchange with REST fallback.
    If running on Cloud Server (VPS), returns active server mode.
    """
    if os.environ.get("APP_MODE") in ("web", "vps", "server"):
        return {
            "success": True,
            "mode": "cloud_server",
            "message": "Trực tuyến (Máy chủ PostgreSQL Live)",
            "synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    from services.sync_http import get_remote_sync_url, sync_via_http_exchange
    remote_url = get_remote_sync_url()
    return sync_via_http_exchange(remote_url, force_full=force_full)


