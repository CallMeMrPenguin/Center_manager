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

def upsert_class_attendance_grades(class_id: int, date_str: str, records: List[Dict[str, Any]]):
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

        for rec in records:
            student_id = rec.get("student_id")
            if not student_id:
                continue
            
            def parse_score(val):
                if val is None or val == "" or val == "null" or val == "undefined":
                    return None
                try:
                    v = float(val)
                    return v if v >= 0 else None
                except (ValueError, TypeError):
                    return None

            c1 = parse_score(rec.get("check_1"))
            c2 = parse_score(rec.get("check_2"))
            hw = parse_score(rec.get("homework"))
            mock = parse_score(rec.get("mock_test"))

            today_str = datetime.now().strftime("%Y-%m-%d")
            is_past_date = str(date_str) < today_str

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

            cursor.execute("""
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
            """, (class_id, student_id, date_str, status, c1, c2, hw, mock, notes))
        conn.commit()
    finally:
        conn.close()
