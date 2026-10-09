import calendar
import json
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional
from database.connection import get_connection
from database.utils import _sync_cloud_delete, _sync_cloud_delete_sync, _sync_cloud_delete_statements
from services.cache_service import cache_get, cache_set, cache_invalidate

# ----------------------------------------------------
# CENTER MANAGER — CLASSES CRUD & SEATING / SCHEDULE
# ----------------------------------------------------
def get_classes(search: str = "") -> List[Dict[str, Any]]:
    cache_key = f"classes:{search}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = """
            SELECT c.*, t.full_name as teacher_name,
                (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as student_count
            FROM classes c
            LEFT JOIN teachers_cm t ON c.teacher_id = t.id
            WHERE 1=1
        """
        params = []
        if search:
            query += " AND (c.class_name LIKE ? OR c.subject LIKE ? OR c.room LIKE ?)"
            pattern = f"%{search}%"
            params.extend([pattern, pattern, pattern])
        query += " ORDER BY c.id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = [dict(r) for r in rows]
        cache_set(cache_key, result, 4.0)
        return result
    finally:
        conn.close()

def create_class(data: Dict[str, Any]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        palette = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a78bfa', '#fb7185', '#6366f1', '#8b5cf6', '#14b8a6', '#eab308', '#22c55e', '#60a5fa', '#c084fc', '#f472b6', '#38bdf8', '#e879f9']
        cursor.execute("SELECT COUNT(*) FROM classes")
        cls_cnt = cursor.fetchone()[0]
        auto_color = palette[(cls_cnt * 3 + 1) % len(palette)]
        chosen_color = data.get("color") or auto_color

        cursor.execute("""
            INSERT INTO classes (class_name, teacher_id, grade, subject, room, status, color, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("class_name"), data.get("teacher_id"), data.get("grade", "Lớp 6"), data.get("subject"),
            data.get("room"), data.get("status", "Đang hoạt động"), chosen_color, data.get("notes")
        ))
        conn.commit()
        cache_invalidate("classes")
        return cursor.lastrowid
    finally:
        conn.close()

def update_class(class_id: int, data: Dict[str, Any]):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        new_color = data.get("color")
        cursor.execute("""
            UPDATE classes SET
                class_name = ?, teacher_id = ?, grade = ?, subject = ?, room = ?, status = ?, color = COALESCE(?, color), notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            data.get("class_name"), data.get("teacher_id"), data.get("grade", "Lớp 6"), data.get("subject"),
            data.get("room"), data.get("status"), new_color, data.get("notes"), class_id
        ))
        if new_color:
            cursor.execute("UPDATE class_sessions SET color = ? WHERE class_id = ?", (new_color, class_id))
        conn.commit()
        cache_invalidate("classes")
    finally:
        conn.close()

def delete_class(class_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM classes WHERE id = ?", (class_id,))
        conn.commit()
        cache_invalidate("classes")
    finally:
        conn.close()
    from database.utils import record_tombstone
    record_tombstone("classes", class_id)


def get_class_students(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, cs.seat_color, cs.grade_group, cs.joined_at,
                   fgm.group_id, fg.group_name, fg.color_hex AS group_color
            FROM class_students cs
            JOIN students s ON cs.student_id = s.id
            LEFT JOIN friend_group_members fgm ON fgm.class_id = cs.class_id AND fgm.student_id = s.id
            LEFT JOIN friend_groups fg ON fgm.group_id = fg.id
            WHERE cs.class_id = ?
            ORDER BY s.full_name ASC
        """, (class_id,))
        rows = cursor.fetchall()
        seen_ids = set()
        unique_students = []
        for r in rows:
            d = dict(r)
            sid = d.get("id")
            if sid not in seen_ids:
                seen_ids.add(sid)
                unique_students.append(d)
        return unique_students
    finally:
        conn.close()

def enroll_student_to_class(class_id: int, student_id: int, seat_color: str = None, grade_group: str = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO class_students (class_id, student_id, seat_color, grade_group)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(class_id, student_id) DO UPDATE SET
                seat_color = EXCLUDED.seat_color,
                grade_group = EXCLUDED.grade_group
        """, (class_id, student_id, seat_color, grade_group))
        
        # When a student is enrolled to a class, ensure their status is active ('Đang học')
        cursor.execute("UPDATE students SET status = 'Đang học' WHERE id = ?", (student_id,))
        
        # Reactivate corresponding student user account if it was locked
        default_user = f"hs_{student_id:04d}"
        cursor.execute("""
            UPDATE app_users SET status = 'Hoạt động'
            WHERE role = 'Học sinh' AND (username = ? OR username = ?)
        """, (default_user, f"hs_{student_id}"))
        
        conn.commit()
    finally:
        conn.close()

def unenroll_student_from_class(class_id: int, student_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        for tbl in ("class_students", "friend_group_members", "conflict_group_members", "trusted_swap_students", "class_attendance_grades"):
            cursor.execute(f"DELETE FROM {tbl} WHERE class_id = ? AND student_id = ?", (class_id, student_id))
        cursor.execute("DELETE FROM conflict_relationships WHERE class_id = ? AND (student_id1 = ? OR student_id2 = ?)", (class_id, student_id, student_id))
        cursor.execute("DELETE FROM trusted_swap_relationships WHERE class_id = ? AND (student_id1 = ? OR student_id2 = ?)", (class_id, student_id, student_id))

        # Clear from class_seating layout
        try:
            cursor.execute("SELECT id, layout_json FROM class_seating WHERE class_id = ?", (class_id,))
            s_row = cursor.fetchone()
            if s_row:
                raw_layout = s_row[1] if isinstance(s_row, (tuple, list)) else s_row["layout_json"]
                if raw_layout and str(student_id) in str(raw_layout):
                    layout = json.loads(raw_layout)
                    modified = False
                    for col in layout:
                        for seat in col.get("seats", []):
                            if seat.get("student_id") == student_id:
                                seat["student_id"] = seat["student_name"] = seat["seat_color"] = seat["grade_group"] = None
                                modified = True
                    if modified:
                        sid = s_row[0] if isinstance(s_row, (tuple, list)) else s_row["id"]
                        cursor.execute("UPDATE class_seating SET layout_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (json.dumps(layout, ensure_ascii=False), sid))
        except Exception:
            pass

        conn.commit()
    finally:
        conn.close()
    from database.utils import record_tombstone
    record_tombstone("class_students", f"{class_id}:{student_id}")


def update_class_student_groups(class_id: int, student_id: int, seat_color: str, grade_group: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE class_students SET seat_color = ?, grade_group = ?
            WHERE class_id = ? AND student_id = ?
        """, (seat_color, grade_group, class_id, student_id))
        conn.commit()
    finally:
        conn.close()

def get_class_weekly_schedule(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM class_schedule_weekly WHERE class_id = ? ORDER BY id ASC", (class_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def add_class_weekly_slot(class_id: int, day_of_week: str, start_time: str, duration: int, notes: str = "") -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO class_schedule_weekly (class_id, day_of_week, start_time, duration, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (class_id, day_of_week, start_time, duration, notes))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def delete_class_weekly_slot(slot_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM class_schedule_weekly WHERE id = ?", (slot_id,))
        conn.commit()
    finally:
        conn.close()

def get_class_sessions(class_id: int, month_year: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        is_all_classes = (not class_id or int(class_id) == 0)

        query = """
            SELECT s.*, c.class_name, c.room, COALESCE(s.color, c.color) as color, t.full_name as teacher_name,
                   (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as student_count,
                   (SELECT COUNT(*) FROM class_attendance_grades ag WHERE ag.class_id = s.class_id AND ag.date = s.date AND ag.status IN ('Có mặt', 'Đi muộn')) as attended_count,
                   (SELECT COUNT(*) FROM class_attendance_grades ag WHERE ag.class_id = s.class_id AND ag.date = s.date) as attendance_total
            FROM class_sessions s 
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN teachers_cm t ON s.teacher_id = t.id
        """
        params = []
        query += (" WHERE s.class_id = ?" if not is_all_classes else " WHERE 1=1")
        if not is_all_classes:
            params.append(class_id)
        if month_year:
            query += " AND s.date LIKE ?"
            params.append(f"{month_year}%")
        query += " ORDER BY s.date ASC, s.start_time ASC"
        cursor.execute(query, params)
        explicit_sessions = [dict(r) for r in cursor.fetchall()]
        
        # 2. Get weekly slots
        w_query = """
            SELECT w.*, c.class_name, c.room, c.color as class_color, c.teacher_id as class_teacher_id, t.full_name as class_teacher_name,
                   (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as student_count
            FROM class_schedule_weekly w
            JOIN classes c ON w.class_id = c.id
            LEFT JOIN teachers_cm t ON c.teacher_id = t.id
        """
        cursor.execute(w_query + (" WHERE w.class_id = ?" if not is_all_classes else ""), (class_id,) if not is_all_classes else ())
        weekly_slots = [dict(r) for r in cursor.fetchall()]
        if not weekly_slots or not month_year:
            return explicit_sessions
            
        weekday_map = {0: "Thứ 2", 1: "Thứ 3", 2: "Thứ 4", 3: "Thứ 5", 4: "Thứ 6", 5: "Thứ 7", 6: "Chủ nhật"}
        try:
            year_str, month_str = month_year.split('-')
            year, month = int(year_str), int(month_str)
        except Exception:
            return explicit_sessions
            
        slot_map = {(w["class_id"], w["day_of_week"]): w for w in weekly_slots}
        for s in explicit_sessions:
            try:
                s_dt = datetime.strptime(s["date"], "%Y-%m-%d")
                s_day = weekday_map.get(s_dt.weekday())
                w_slot = slot_map.get((s["class_id"], s_day))
                if w_slot and s.get("start_time") == "18:00" and s.get("duration") == 90:
                    s["start_time"], s["duration"] = w_slot["start_time"], w_slot["duration"]
            except Exception:
                pass

        today_str = datetime.now().strftime("%Y-%m-%d")
        try:
            from routers.holidays import OFFICIAL_VN_HOLIDAYS
            holiday_dates = {h["date"] for h in OFFICIAL_VN_HOLIDAYS if h.get("is_public")}
        except Exception:
            holiday_dates = set()

        for s in explicit_sessions:
            att = s.get("attended_count") or 0
            if att > 0 and s["date"] <= today_str:
                s["status"] = "Đã học"
            elif s.get("status") in ("Nghỉ", "Hủy", "Nghỉ học") or s["date"] in holiday_dates or (s["date"] < today_str and (s.get("attendance_total") or 0) > 0):
                s["status"] = "Nghỉ"

        _, num_days = calendar.monthrange(year, month)
        explicit_class_date_keys = {(s["class_id"], s["date"]) for s in explicit_sessions}
        virtual_sessions = []
        for day in range(1, num_days + 1):
            dt = datetime(year, month, day)
            day_name = weekday_map[dt.weekday()]
            date_str = f"{year:04d}-{month:02d}-{day:02d}"
            for slot in weekly_slots:
                if slot["day_of_week"] == day_name and (slot["class_id"], date_str) not in explicit_class_date_keys:
                    slot_cid = slot["class_id"]
                    is_off = (date_str in holiday_dates) or (date_str < today_str)
                    virtual_sessions.append({
                        "id": -slot["id"] - (day * 1000) - (slot_cid * 100000),
                        "class_id": slot_cid,
                        "class_name": slot["class_name"],
                        "color": slot.get("class_color") or "#7c3aed",
                        "date": date_str,
                        "start_time": slot["start_time"],
                        "duration": slot["duration"],
                        "status": "Nghỉ" if is_off else "Sắp diễn ra",
                        "teacher_id": slot.get("class_teacher_id"),
                        "teacher_name": slot.get("class_teacher_name") or "",
                        "room": slot.get("room") or "",
                        "student_count": slot.get("student_count") or 0,
                        "attended_count": 0,
                        "attendance_total": 0,
                        "notes": slot["notes"] or ""
                    })
        all_sessions = explicit_sessions + virtual_sessions
        all_sessions.sort(key=lambda s: (s["date"], s["start_time"]))
        return all_sessions
    finally:
        conn.close()

def add_class_session(class_id: int, date: str, start_time: str, duration: int, status: str = "Sắp diễn ra", teacher_id: int = None, notes: str = "", color: str = None) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM class_sessions WHERE class_id = ? AND date = ?", (class_id, date))
        row = cursor.fetchone()
        if row:
            sess_id = row[0] if isinstance(row, (list, tuple)) else row["id"]
            cursor.execute("""
                UPDATE class_sessions SET
                    start_time = COALESCE(?, start_time),
                    duration = COALESCE(?, duration),
                    status = COALESCE(?, status),
                    teacher_id = COALESCE(?, teacher_id),
                    notes = COALESCE(?, notes),
                    color = COALESCE(?, color)
                WHERE id = ?
            """, (start_time, duration, status, teacher_id, notes, color, sess_id))
            conn.commit()
            return sess_id

        cursor.execute("""
            INSERT INTO class_sessions (class_id, date, start_time, duration, status, teacher_id, notes, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (class_id, date, start_time, duration, status, teacher_id, notes, color))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def update_class_session(session_id: int, data: Dict[str, Any], class_id: int = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        target_cid = class_id or data.get("class_id")

        if session_id < 0:
            dt = data.get("date")
            st = data.get("start_time")
            if target_cid and dt and st:
                cursor.execute(
                    "SELECT id FROM class_sessions WHERE class_id = ? AND date = ? AND start_time = ?",
                    (target_cid, dt, st)
                )
                row = cursor.fetchone()
                if row:
                    session_id = row["id"]
                else:
                    cursor.execute("""
                        INSERT INTO class_sessions (class_id, date, start_time, duration, status, teacher_id, notes, color)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        target_cid, dt, st, data.get("duration", 90),
                        data.get("status", "Sắp diễn ra"), data.get("teacher_id"),
                        data.get("notes", ""), data.get("color")
                    ))
                    conn.commit()
                    return

        cursor.execute("""
            UPDATE class_sessions SET
                class_id = COALESCE(?, class_id),
                date = COALESCE(?, date),
                start_time = COALESCE(?, start_time),
                duration = COALESCE(?, duration),
                status = COALESCE(?, status),
                teacher_id = COALESCE(?, teacher_id),
                notes = COALESCE(?, notes),
                color = COALESCE(?, color)
            WHERE id = ?
        """, (
            data.get("class_id"), data.get("date"), data.get("start_time"), data.get("duration"),
            data.get("status"), data.get("teacher_id"), data.get("notes"), data.get("color"), session_id
        ))
        conn.commit()
    finally:
        conn.close()

def delete_class_session(session_id: int):
    conn = get_connection()
    target_cid = None
    target_date = None
    try:
        cursor = conn.cursor()
        if session_id > 0:
            cursor.execute("SELECT class_id, date FROM class_sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            if row:
                target_cid = row[0] if isinstance(row, (list, tuple)) else row["class_id"]
                target_date = row[1] if isinstance(row, (list, tuple)) else row["date"]
                if target_cid and target_date:
                    cursor.execute("DELETE FROM class_attendance_grades WHERE class_id = ? AND date = ?", (target_cid, target_date))
        cursor.execute("DELETE FROM class_sessions WHERE id = ?", (session_id,))
        conn.commit()
    finally:
        conn.close()

    if session_id > 0:
        from database.utils import record_tombstone
        record_tombstone("class_sessions", session_id)
        if target_cid and target_date:
            record_tombstone("class_attendance_grades", f"{target_cid}:{target_date}")


def sync_class_sessions_with_weekly_schedule(class_id: Optional[int] = None) -> Dict[str, Any]:
    weekday_map = {0: "Thứ 2", 1: "Thứ 3", 2: "Thứ 4", 3: "Thứ 5", 4: "Thứ 6", 5: "Thứ 7", 6: "Chủ nhật"}
    conn = get_connection()
    updated_cnt = 0
    deleted_cnt = 0
    try:
        cursor = conn.cursor()
        if class_id and int(class_id) > 0:
            cursor.execute("SELECT id FROM classes WHERE id = ?", (class_id,))
        else:
            cursor.execute("SELECT id FROM classes")
        target_cids = [r[0] if isinstance(r, (list, tuple)) else r["id"] for r in cursor.fetchall()]

        for cid in target_cids:
            cursor.execute("SELECT * FROM class_schedule_weekly WHERE class_id = ?", (cid,))
            weekly_slots = [dict(r) for r in cursor.fetchall()]
            slot_map = {w["day_of_week"]: w for w in weekly_slots}

            cursor.execute("SELECT id, date, start_time, duration, status FROM class_sessions WHERE class_id = ?", (cid,))
            sessions = [dict(r) for r in cursor.fetchall()]

            for sess in sessions:
                sid = sess["id"]
                date_str = sess["date"]
                try:
                    s_dt = datetime.strptime(date_str, "%Y-%m-%d")
                    day_name = weekday_map[s_dt.weekday()]
                except Exception:
                    continue

                if day_name in slot_map:
                    slot = slot_map[day_name]
                    t_time, t_dur = slot["start_time"], slot["duration"]
                    if sess["start_time"] != t_time or sess["duration"] != t_dur:
                        cursor.execute("UPDATE class_sessions SET start_time = ?, duration = ? WHERE id = ?", (t_time, t_dur, sid))
                        updated_cnt += 1
                elif slot_map:
                    cursor.execute("SELECT COUNT(*) FROM class_attendance_grades WHERE class_id = ? AND date = ?", (cid, date_str))
                    att_row = cursor.fetchone()
                    att_cnt = att_row[0] if isinstance(att_row, (list, tuple)) else (att_row["COUNT(*)"] if "COUNT(*)" in att_row.keys() else 0)
                    if att_cnt == 0 and sess.get("status") in ("Sắp diễn ra", ""):
                        cursor.execute("DELETE FROM class_sessions WHERE id = ?", (sid,))
                        deleted_cnt += 1

        conn.commit()
    finally:
        conn.close()
    try:
        from services.sync_worker import trigger_instant_sync
        trigger_instant_sync()
    except Exception:
        pass
    return {"status": "success", "updated": updated_cnt, "deleted": deleted_cnt}

from .crud_seating import get_class_seating, save_class_seating
