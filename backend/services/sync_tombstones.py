"""
Sync Tombstones Engine — Centralized Tombstone Processing & Anti-Resurrection Guard
Ensures deleted records (classes, sessions, weekly schedules, attendance) are reliably
deleted across local SQLite and remote PostgreSQL and never resurrected.
"""
from typing import Any, Dict, Set, Tuple, Optional

def apply_tombstone(cur: Any, tbl: str, rec_id: Any) -> bool:
    """
    Applies a deletion tombstone to the database using cursor.
    Supports both numeric IDs and composite keys across all system tables.
    """
    if not tbl or rec_id is None:
        return False
    rec_str = str(rec_id).strip()
    if not rec_str:
        return False

    try:
        if tbl == "class_sessions":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) >= 2:
                    cur.execute("DELETE FROM class_sessions WHERE class_id = ? AND date = ?", (parts[0], parts[1]))
                    return True
            try:
                cur.execute("DELETE FROM class_sessions WHERE id = ?", (int(rec_str),))
                return True
            except Exception:
                pass

        elif tbl == "class_attendance_grades":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) == 2:
                    cur.execute("DELETE FROM class_attendance_grades WHERE class_id = ? AND date = ?", (parts[0], parts[1]))
                    return True
                elif len(parts) >= 3:
                    cur.execute("DELETE FROM class_attendance_grades WHERE class_id = ? AND student_id = ? AND date = ?", (parts[0], parts[1], parts[2]))
                    return True

        elif tbl == "class_students":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) >= 2:
                    cur.execute("DELETE FROM class_students WHERE class_id = ? AND student_id = ?", (parts[0], parts[1]))
                    return True

        elif tbl == "class_schedule_weekly":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) >= 2:
                    cur.execute("DELETE FROM class_schedule_weekly WHERE class_id = ? AND day_of_week = ?", (parts[0], parts[1]))
                    return True
            try:
                cur.execute("DELETE FROM class_schedule_weekly WHERE id = ?", (int(rec_str),))
                return True
            except Exception:
                pass

        elif tbl == "app_settings":
            cur.execute("DELETE FROM app_settings WHERE setting_key = ?", (rec_str,))
            return True

        elif tbl == "role_permissions":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) >= 2:
                    cur.execute("DELETE FROM role_permissions WHERE role = ? AND tab_id = ?", (parts[0], parts[1]))
                    return True

        elif tbl == "friend_group_members":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) >= 2:
                    cur.execute("DELETE FROM friend_group_members WHERE group_id = ? AND student_id = ?", (parts[0], parts[1]))
                    return True

        elif tbl == "conflict_group_members":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) >= 2:
                    cur.execute("DELETE FROM conflict_group_members WHERE class_id = ? AND student_id = ?", (parts[0], parts[1]))
                    return True

        elif tbl == "trusted_swap_students":
            if ":" in rec_str:
                parts = rec_str.split(":")
                if len(parts) >= 2:
                    cur.execute("DELETE FROM trusted_swap_students WHERE class_id = ? AND student_id = ?", (parts[0], parts[1]))
                    return True

        else:
            try:
                cur.execute(f"DELETE FROM {tbl} WHERE id = ?", (rec_str,))
                return True
            except Exception:
                pass
    except Exception:
        pass
    return False

def load_tombstone_set(cur: Any) -> Set[Tuple[str, str]]:
    """Loads all existing tombstones from _sync_tombstones as {(table_name, record_id)}."""
    ts_set = set()
    try:
        cur.execute("SELECT table_name, record_id FROM _sync_tombstones")
        for r in cur.fetchall():
            tbl = r[0] if isinstance(r, (list, tuple)) else r["table_name"]
            rid = str(r[1] if isinstance(r, (list, tuple)) else r["record_id"]).strip()
            ts_set.add((tbl, rid))
    except Exception:
        pass
    return ts_set

def is_row_tombstoned(table: str, row: Dict[str, Any], ts_set: Set[Tuple[str, str]]) -> bool:
    """Checks whether an incoming row has been deleted according to the tombstone set."""
    if not ts_set or not isinstance(row, dict):
        return False

    row_id = row.get("id")
    if row_id is not None and (table, str(row_id).strip()) in ts_set:
        return True

    if table == "class_sessions":
        cid, dt = row.get("class_id"), row.get("date")
        if cid is not None and dt and (table, f"{cid}:{dt}") in ts_set:
            return True

    elif table == "class_schedule_weekly":
        cid, dow = row.get("class_id"), row.get("day_of_week")
        if cid is not None and dow and (table, f"{cid}:{dow}") in ts_set:
            return True

    elif table == "class_attendance_grades":
        cid, sid, dt = row.get("class_id"), row.get("student_id"), row.get("date")
        if cid is not None and dt:
            if (table, f"{cid}:{dt}") in ts_set:
                return True
            if sid is not None and (table, f"{cid}:{sid}:{dt}") in ts_set:
                return True

    elif table == "class_students":
        cid, sid = row.get("class_id"), row.get("student_id")
        if cid is not None and sid is not None and (table, f"{cid}:{sid}") in ts_set:
            return True

    elif table == "friend_group_members":
        gid, sid = row.get("group_id"), row.get("student_id")
        if gid is not None and sid is not None and (table, f"{gid}:{sid}") in ts_set:
            return True

    elif table == "conflict_group_members":
        cid, sid = row.get("class_id"), row.get("student_id")
        if cid is not None and sid is not None and (table, f"{cid}:{sid}") in ts_set:
            return True

    elif table == "trusted_swap_students":
        cid, sid = row.get("class_id"), row.get("student_id")
        if cid is not None and sid is not None and (table, f"{cid}:{sid}") in ts_set:
            return True

    elif table == "app_settings":
        sk = row.get("setting_key")
        if sk and (table, str(sk).strip()) in ts_set:
            return True

    return False
