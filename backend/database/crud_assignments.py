from typing import List, Dict, Any, Optional
from datetime import datetime
from database.connection import get_connection

def get_assignments(class_id: Optional[int] = None, month: str = "") -> List[Dict[str, Any]]:
    """
    Returns list of assignments with class name and aggregated metrics:
    total_students, submitted_count, avg_score.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = """
            SELECT 
                a.id,
                a.class_id,
                c.class_name,
                a.title,
                a.description,
                a.assigned_date,
                a.due_date,
                a.max_score,
                a.content_json,
                a.quiz_config,
                a.created_at,
                COUNT(sub.id) AS total_enrolled,
                SUM(CASE WHEN sub.submitted = 1 THEN 1 ELSE 0 END) AS submitted_count,
                AVG(sub.score) AS avg_score
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id
            WHERE 1=1
        """
        params: List[Any] = []
        if class_id is not None and class_id > 0:
            query += " AND a.class_id = ?"
            params.append(class_id)
        if month:
            query += " AND (a.assigned_date LIKE ? OR a.due_date LIKE ?)"
            pattern = f"{month}%"
            params.extend([pattern, pattern])

        query += " GROUP BY a.id, c.class_name ORDER BY a.assigned_date DESC, a.id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        result = []
        for r in rows:
            d = dict(r)
            total = d.get("total_enrolled", 0)
            submitted = d.get("submitted_count", 0)
            d["submission_rate"] = round((submitted / total * 100), 1) if total > 0 else 0
            d["avg_score"] = round(d["avg_score"], 1) if d.get("avg_score") is not None else None
            result.append(d)
        return result
    finally:
        conn.close()

def create_assignment(data: Dict[str, Any]) -> int:
    """
    Creates assignment record, and auto-populates assignment_submissions
    for all currently enrolled students in class_students.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        class_id = data.get("class_id")
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        assigned_date = data.get("assigned_date") or datetime.now().strftime("%Y-%m-%d")
        due_date = data.get("due_date") or assigned_date
        max_score = float(data.get("max_score", 10))
        content_json = data.get("content_json", "") or ""
        quiz_config = data.get("quiz_config", "") or ""

        cursor.execute("""
            INSERT INTO assignments (class_id, title, description, assigned_date, due_date, max_score, content_json, quiz_config)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (class_id, title, description, assigned_date, due_date, max_score, content_json, quiz_config))
        assignment_id = cursor.lastrowid

        # Auto-create submission records for all students currently in this class in a single set-based query
        cursor.execute("""
            INSERT INTO assignment_submissions (assignment_id, student_id, submitted, score, notes)
            SELECT ?, student_id, 0, NULL, ''
            FROM class_students
            WHERE class_id = ?
            ON CONFLICT (assignment_id, student_id) DO NOTHING
        """, (assignment_id, class_id))

        conn.commit()
        return assignment_id
    finally:
        conn.close()

def update_assignment(assignment_id: int, data: Dict[str, Any]):
    """Updates assignment details."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        title = data.get("title")
        description = data.get("description", "")
        assigned_date = data.get("assigned_date")
        due_date = data.get("due_date")
        max_score = float(data.get("max_score", 10))
        content_json = data.get("content_json", "") or ""
        quiz_config = data.get("quiz_config", "") or ""

        cursor.execute("""
            UPDATE assignments
            SET title = ?, description = ?, assigned_date = ?, due_date = ?, max_score = ?, content_json = ?, quiz_config = ?
            WHERE id = ?
        """, (title, description, assigned_date, due_date, max_score, content_json, quiz_config, assignment_id))
        conn.commit()
    finally:
        conn.close()


def get_assignment(assignment_id: int) -> Optional[Dict[str, Any]]:
    """Returns single assignment with full content."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.*, c.class_name
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE a.id = ?
        """, (assignment_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def delete_assignment(assignment_id: int):
    """Deletes an assignment and cascades to submissions."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM assignments WHERE id = ?", (assignment_id,))
        conn.commit()
    finally:
        conn.close()

def get_assignment_submissions(assignment_id: int) -> List[Dict[str, Any]]:
    """
    Returns all enrolled students in the class, outer-joined with submissions.
    Ensures newly enrolled students always appear even if created after assignment.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # First fetch assignment class_id
        cursor.execute("SELECT class_id FROM assignments WHERE id = ?", (assignment_id,))
        assign_row = cursor.fetchone()
        if not assign_row:
            return []
        class_id = assign_row["class_id"]

        # Ensure all students in class_students have a submission row in a single set-based query
        cursor.execute("""
            INSERT INTO assignment_submissions (assignment_id, student_id, submitted, score, notes)
            SELECT ?, student_id, 0, NULL, ''
            FROM class_students
            WHERE class_id = ?
            ON CONFLICT (assignment_id, student_id) DO NOTHING
        """, (assignment_id, class_id))
        conn.commit()

        # Query full submission list with student info
        query = """
            SELECT 
                sub.id AS submission_id,
                sub.assignment_id,
                s.id AS student_id,
                s.full_name AS student_name,
                s.nickname,
                s.grade,
                sub.submitted,
                sub.score,
                sub.notes,
                sub.submitted_at,
                sub.answers_json,
                sub.daily_logs
            FROM assignment_submissions sub
            JOIN students s ON sub.student_id = s.id
            WHERE sub.assignment_id = ?
            ORDER BY s.full_name ASC
        """
        cursor.execute(query, (assignment_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def batch_update_submissions(assignment_id: int, submissions: List[Dict[str, Any]]):
    """
    Upserts or updates submission status, scores, notes, answers_json, daily_logs for an assignment.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for item in submissions:
            student_id = item.get("student_id")
            if not student_id:
                continue

            submitted = 1 if item.get("submitted") in (1, True, "1", "true") else 0
            
            raw_score = item.get("score")
            score = None
            if raw_score not in (None, "", "null", "undefined"):
                try:
                    v = float(raw_score)
                    if v >= 0:
                        score = v
                except (ValueError, TypeError):
                    score = None

            notes = (item.get("notes") or "").strip()
            submitted_at = now_str if submitted == 1 else None
            answers_json = item.get("answers_json") or ""
            daily_logs = item.get("daily_logs") or ""

            cursor.execute("""
                INSERT INTO assignment_submissions (assignment_id, student_id, submitted, score, notes, submitted_at, answers_json, daily_logs)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(assignment_id, student_id) DO UPDATE SET
                    submitted = EXCLUDED.submitted,
                    score = EXCLUDED.score,
                    notes = EXCLUDED.notes,
                    answers_json = CASE WHEN EXCLUDED.answers_json != '' THEN EXCLUDED.answers_json ELSE assignment_submissions.answers_json END,
                    daily_logs = CASE WHEN EXCLUDED.daily_logs != '' THEN EXCLUDED.daily_logs ELSE assignment_submissions.daily_logs END,
                    submitted_at = CASE 
                        WHEN EXCLUDED.submitted = 1 AND assignment_submissions.submitted_at IS NULL THEN ?
                        WHEN EXCLUDED.submitted = 0 THEN NULL
                        ELSE assignment_submissions.submitted_at
                    END
            """, (assignment_id, student_id, submitted, score, notes, submitted_at, answers_json, daily_logs, now_str))

        conn.commit()
    finally:
        conn.close()

def save_student_progress(assignment_id: int, student_id: int, answers_json: str, score: Optional[float] = None, daily_logs: str = "") -> bool:
    """Saves or updates student's live answers and multi-day progress logs."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO assignment_submissions (assignment_id, student_id, submitted, score, answers_json, daily_logs, submitted_at)
            VALUES (?, ?, 1, ?, ?, ?, ?)
            ON CONFLICT(assignment_id, student_id) DO UPDATE SET
                answers_json = EXCLUDED.answers_json,
                score = COALESCE(EXCLUDED.score, assignment_submissions.score),
                daily_logs = CASE WHEN EXCLUDED.daily_logs != '' THEN EXCLUDED.daily_logs ELSE assignment_submissions.daily_logs END,
                submitted_at = COALESCE(assignment_submissions.submitted_at, EXCLUDED.submitted_at)
        """, (assignment_id, student_id, score, answers_json, daily_logs, now_str))
        conn.commit()
        return True
    finally:
        conn.close()

