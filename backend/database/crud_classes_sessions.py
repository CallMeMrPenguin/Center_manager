import calendar
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional
from database.connection import get_connection

# ----------------------------------------------------
# CENTER MANAGER — CLASSES CRUD & SEATING / SCHEDULE
# ----------------------------------------------------
def get_classes(search: str = "") -> List[Dict[str, Any]]:
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
        return [dict(r) for r in rows]
    finally:
        conn.close()

def create_class(data: Dict[str, Any]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        palette = [
            '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
            '#06b6d4', '#f97316', '#84cc16', '#a78bfa', '#fb7185',
            '#6366f1', '#8b5cf6', '#14b8a6', '#eab308', '#22c55e',
            '#60a5fa', '#c084fc', '#f472b6', '#38bdf8', '#e879f9'
        ]
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
    finally:
        conn.close()

def delete_class(class_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM classes WHERE id = ?", (class_id,))
        conn.commit()
    finally:
        conn.close()

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
        return [dict(r) for r in rows]
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
        cursor.execute("DELETE FROM class_students WHERE class_id = ? AND student_id = ?", (class_id, student_id))
        cursor.execute("DELETE FROM friend_group_members WHERE class_id = ? AND student_id = ?", (class_id, student_id))
        cursor.execute("DELETE FROM conflict_group_members WHERE class_id = ? AND student_id = ?", (class_id, student_id))
        conn.commit()
    finally:
        conn.close()

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

        # 1. Get explicit sessions
        query = """
            SELECT s.*, c.class_name, COALESCE(s.color, c.color) as color, t.full_name as teacher_name 
            FROM class_sessions s 
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN teachers_cm t ON s.teacher_id = t.id
        """
        params = []
        if not is_all_classes:
            query += " WHERE s.class_id = ?"
            params.append(class_id)
        else:
            query += " WHERE 1=1"
            
        if month_year:
            query += " AND s.date LIKE ?"
            params.append(f"{month_year}%")
        query += " ORDER BY s.date ASC, s.start_time ASC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        explicit_sessions = [dict(r) for r in rows]
        
        # 2. Get weekly slots
        if not is_all_classes:
            cursor.execute("""
                SELECT w.*, c.class_name, c.color as class_color, c.teacher_id as class_teacher_id, t.full_name as class_teacher_name
                FROM class_schedule_weekly w
                JOIN classes c ON w.class_id = c.id
                LEFT JOIN teachers_cm t ON c.teacher_id = t.id
                WHERE w.class_id = ?
            """, (class_id,))
        else:
            cursor.execute("""
                SELECT w.*, c.class_name, c.color as class_color, c.teacher_id as class_teacher_id, t.full_name as class_teacher_name
                FROM class_schedule_weekly w
                JOIN classes c ON w.class_id = c.id
                LEFT JOIN teachers_cm t ON c.teacher_id = t.id
            """)
        weekly_slots = [dict(r) for r in cursor.fetchall()]
        
        if not weekly_slots or not month_year:
            return explicit_sessions
            
        weekday_map = {
            0: "Thứ 2", 1: "Thứ 3", 2: "Thứ 4", 3: "Thứ 5", 4: "Thứ 6", 5: "Thứ 7", 6: "Chủ nhật"
        }
        
        try:
            year_str, month_str = month_year.split('-')
            year = int(year_str)
            month = int(month_str)
        except Exception:
            return explicit_sessions
            
        _, num_days = calendar.monthrange(year, month)
        explicit_keys = {(s["class_id"], s["date"], s["start_time"]) for s in explicit_sessions}
        
        virtual_sessions = []
        for day in range(1, num_days + 1):
            dt = datetime(year, month, day)
            day_name = weekday_map[dt.weekday()]
            date_str = f"{year:04d}-{month:02d}-{day:02d}"
            
            for slot in weekly_slots:
                if slot["day_of_week"] == day_name:
                    slot_cid = slot["class_id"]
                    start_time = slot["start_time"]
                    if (slot_cid, date_str, start_time) not in explicit_keys:
                        virtual_sessions.append({
                            "id": -slot["id"] - (day * 1000) - (slot_cid * 100000),
                            "class_id": slot_cid,
                            "class_name": slot["class_name"],
                            "color": slot.get("class_color") or "#7c3aed",
                            "date": date_str,
                            "start_time": start_time,
                            "duration": slot["duration"],
                            "status": "Sắp diễn ra",
                            "teacher_id": slot.get("class_teacher_id"),
                            "teacher_name": slot.get("class_teacher_name") or "",
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

def _sync_cloud_delete(sql_pg: str, params: tuple):
    def _task():
        try:
            from database.connection import get_target_db_url, IS_VERCEL
            if IS_VERCEL:
                return
            import psycopg2
            target_url = get_target_db_url()
            if not target_url:
                return
            pconn = psycopg2.connect(target_url, connect_timeout=4)
            try:
                pcur = pconn.cursor()
                pcur.execute(sql_pg, params)
                pconn.commit()
            finally:
                pconn.close()
        except Exception:
            pass
    threading.Thread(target=_task, daemon=True).start()

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
        _sync_cloud_delete("DELETE FROM class_sessions WHERE id = %s", (session_id,))
        if target_cid and target_date:
            _sync_cloud_delete("DELETE FROM class_attendance_grades WHERE class_id = %s AND date = %s", (target_cid, target_date))

def get_class_seating(class_id: int) -> Dict[str, Any]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM class_seating WHERE class_id = ?", (class_id,))
        row = cursor.fetchone()
        return dict(row) if row else {"class_id": class_id, "num_rows": 4, "layout_json": "[]"}
    finally:
        conn.close()

def save_class_seating(class_id: int, num_rows: int, layout_json: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO class_seating (class_id, num_rows, layout_json)
            VALUES (?, ?, ?)
            ON CONFLICT(class_id) DO UPDATE SET
                num_rows = EXCLUDED.num_rows,
                layout_json = EXCLUDED.layout_json,
                updated_at = CURRENT_TIMESTAMP
        """, (class_id, num_rows, layout_json))
        conn.commit()
    finally:
        conn.close()
