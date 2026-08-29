from datetime import datetime
from typing import List, Dict, Any, Optional
from database.connection import get_connection

# ----------------------------------------------------
# CENTER MANAGER — COURSES CRUD
# ----------------------------------------------------
def get_courses(search: str = "", status: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM courses WHERE 1=1"
        params = []
        if search:
            query += " AND (course_name LIKE ? OR description LIKE ?)"
            pattern = f"%{search}%"
            params.extend([pattern, pattern])
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def create_course(data: Dict[str, Any]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO courses (course_name, description, price, duration_weeks, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data.get("course_name"), data.get("description"), data.get("price", 0),
            data.get("duration_weeks"), data.get("status", "Đang mở")
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def update_course(course_id: int, data: Dict[str, Any]):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE courses SET
                course_name = ?, description = ?, price = ?, duration_weeks = ?, status = ?
            WHERE id = ?
        """, (
            data.get("course_name"), data.get("description"), data.get("price"),
            data.get("duration_weeks"), data.get("status"), course_id
        ))
        conn.commit()
    finally:
        conn.close()

def delete_course(course_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        conn.commit()
    finally:
        conn.close()

# ----------------------------------------------------
# CENTER MANAGER — STUDENT SCORES
# ----------------------------------------------------
def get_student_scores(class_id: int = None, student_id: int = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = """
            SELECT sc.*, s.full_name as student_name, c.class_name
            FROM student_scores sc
            JOIN students s ON sc.student_id = s.id
            JOIN classes c ON sc.class_id = c.id
            WHERE 1=1
        """
        params = []
        if class_id:
            query += " AND sc.class_id = ?"
            params.append(class_id)
        if student_id:
            query += " AND sc.student_id = ?"
            params.append(student_id)
        query += " ORDER BY sc.id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def upsert_student_score(data: Dict[str, Any]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO student_scores (student_id, class_id, test_title, test_date, score_type, score, max_score, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(student_id, class_id, score_type) DO UPDATE SET
                test_title = EXCLUDED.test_title,
                test_date = EXCLUDED.test_date,
                score = EXCLUDED.score,
                max_score = EXCLUDED.max_score,
                notes = EXCLUDED.notes,
                created_at = CURRENT_TIMESTAMP
        """, (
            data.get("student_id"), data.get("class_id"), data.get("test_title"),
            data.get("test_date"), data.get("score_type"), data.get("score"),
            data.get("max_score", 10), data.get("notes")
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def delete_student_score(score_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM student_scores WHERE id = ?", (score_id,))
        conn.commit()
    finally:
        conn.close()

# ----------------------------------------------------
# CLASS ATTENDANCE & GRADES
# ----------------------------------------------------
def get_class_attendance_grades(class_id: int, date_str: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ag.*, s.full_name as student_name
            FROM class_attendance_grades ag
            JOIN students s ON ag.student_id = s.id
            WHERE ag.class_id = ? AND ag.date = ?
        """, (class_id, date_str))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def _parse_score(val: Any) -> Optional[float]:
    if val is None or val == "" or val == "null" or val == "undefined":
        return None
    try:
        val_str = str(val).strip().replace(',', '.')
        if not val_str or val_str in ("null", "undefined", "none"):
            return None
        v = float(val_str)
        return v if v >= 0 else None
    except (ValueError, TypeError):
        return None

def upsert_class_attendance_grades(class_id: int, date_str: str, records: List[Dict[str, Any]]):
    if not records:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Ensure class_sessions record exists for this date with valid status 'Đã học'
        cursor.execute("SELECT id FROM class_sessions WHERE class_id = ? AND date = ?", (class_id, date_str))
        if not cursor.fetchone():
            try:
                cursor.execute("""
                    INSERT INTO class_sessions (class_id, date, start_time, duration, status)
                    VALUES (?, ?, '18:00', 90, 'Đã học')
                """, (class_id, date_str))
            except Exception:
                pass

        # Validate student IDs in database to prevent foreign key errors
        student_ids_in_req = []
        for r in records:
            sid_val = r.get("student_id")
            if sid_val is not None:
                try:
                    student_ids_in_req.append(int(sid_val))
                except (ValueError, TypeError):
                    pass

        if not student_ids_in_req:
            return

        placeholders = ','.join(['?'] * len(student_ids_in_req))
        cursor.execute(f"SELECT id FROM students WHERE id IN ({placeholders})", student_ids_in_req)
        valid_student_ids = set()
        for r in cursor.fetchall():
            try:
                v_id = r["id"] if (hasattr(r, "keys") and "id" in r.keys()) or isinstance(r, dict) else r[0]
                valid_student_ids.add(int(v_id))
            except Exception:
                pass

        today_str = datetime.now().strftime("%Y-%m-%d")
        is_past_date = str(date_str) < today_str
        batch_data = []

        for rec in records:
            sid_raw = rec.get("student_id")
            try:
                student_id = int(sid_raw)
            except (ValueError, TypeError):
                continue

            if student_id not in valid_student_ids:
                continue

            c1 = _parse_score(rec.get("check_1"))
            c2 = _parse_score(rec.get("check_2"))
            hw = _parse_score(rec.get("homework"))
            mock = _parse_score(rec.get("mock_test"))

            has_score = (c1 is not None) or (c2 is not None) or (hw is not None) or (mock is not None)
            notes = (rec.get("notes") or "").strip()
            raw_status = rec.get("status")

            if raw_status:
                status = raw_status
            elif has_score:
                status = "Có mặt"
            elif is_past_date and not notes:
                status = "Vắng mặt"
            else:
                status = "Có mặt"

            batch_data.append((class_id, student_id, date_str, status, c1, c2, hw, mock, notes))

        if batch_data:
            cursor.executemany("""
                INSERT INTO class_attendance_grades (class_id, student_id, date, status, check_1, check_2, homework, mock_test, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(class_id, student_id, date) DO UPDATE SET
                    status = EXCLUDED.status,
                    check_1 = EXCLUDED.check_1,
                    check_2 = EXCLUDED.check_2,
                    homework = EXCLUDED.homework,
                    mock_test = EXCLUDED.mock_test,
                    notes = EXCLUDED.notes,
                    updated_at = CURRENT_TIMESTAMP
            """, batch_data)
        conn.commit()
    finally:
        conn.close()

def _sync_cloud_delete(sql_pg: str, params: tuple):
    try:
        from database.connection import get_target_db_url, IS_VERCEL
        if IS_VERCEL:
            return
        import psycopg2
        target_url = get_target_db_url()
        if not target_url:
            return
        pconn = psycopg2.connect(target_url, connect_timeout=5)
        try:
            pcur = pconn.cursor()
            pcur.execute(sql_pg, params)
            pconn.commit()
        finally:
            pconn.close()
    except Exception:
        pass

def delete_class_attendance_date(class_id: int, date_str: str) -> Dict[str, Any]:
    """Deletes all attendance records and sessions for a class on a specific date (e.g. wrong date recorded)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM class_attendance_grades WHERE class_id = ? AND date = ?", (class_id, date_str))
        deleted_grades = cursor.rowcount
        cursor.execute("DELETE FROM class_sessions WHERE class_id = ? AND date = ?", (class_id, date_str))
        deleted_sessions = cursor.rowcount
        conn.commit()
    finally:
        conn.close()

    # Propagate delete to cloud database to avoid pull re-insertion
    _sync_cloud_delete("DELETE FROM class_attendance_grades WHERE class_id = %s AND date = %s", (class_id, date_str))
    _sync_cloud_delete("DELETE FROM class_sessions WHERE class_id = %s AND date = %s", (class_id, date_str))

    return {
        "status": "success",
        "class_id": class_id,
        "date": date_str,
        "deleted_grades": deleted_grades,
        "deleted_sessions": deleted_sessions
    }
