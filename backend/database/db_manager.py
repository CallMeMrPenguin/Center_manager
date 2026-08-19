import os
import sqlite3
import math
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

# Database Path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "test_formatter.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA cache_size = -64000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes the SQLite database schema for Question Bank, Vocabulary, and Document Manager."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Question Bank table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS question_bank (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade TEXT,
        unit TEXT,
        test_type TEXT,
        question_text TEXT,
        question_type TEXT,
        option_1 TEXT,
        option_2 TEXT,
        option_3 TEXT,
        option_4 TEXT,
        answer TEXT,
        level TEXT,
        frequency TEXT
    )
    """)
    
    # Migration: Convert all existing 'wf' / 'Word Form' questions to 'fb' (Fill in the Blank)
    try:
        cursor.execute("UPDATE question_bank SET question_type = 'fb' WHERE question_type IN ('wf', 'Word Form', 'word form', 'wordform')")
        conn.commit()
    except Exception:
        pass
    
    # 2. Vocabulary List table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vocabulary_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no TEXT,
        grade TEXT,
        unit TEXT,
        vocabulary TEXT,
        pos TEXT,
        ipa TEXT,
        meaning TEXT,
        difficulty TEXT,
        root_word TEXT
    )
    """)
    
    # 3. Document Folders table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS document_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Try to add parent_id to document_folders if it doesn't exist
    try:
        cursor.execute("ALTER TABLE document_folders ADD COLUMN parent_id INTEGER DEFAULT NULL REFERENCES document_folders(id) ON DELETE SET NULL")
    except sqlite3.OperationalError:
        pass
    
    # 4. Documents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        folder_id INTEGER DEFAULT NULL,
        file_type TEXT,
        file_size INTEGER,
        tags TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES document_folders(id) ON DELETE SET NULL
    )
    """)
    # 5. Document Attachments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS document_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
    """)
    
    # Check/add is_deleted and deleted_at columns for soft deletes
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN is_deleted INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE document_folders ADD COLUMN is_deleted INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE document_folders ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL")
    except sqlite3.OperationalError:
        pass
    
    # 6. Center Manager — Students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        nickname TEXT DEFAULT '',
        gender TEXT CHECK(gender IN ('Nam', 'Nữ', 'Khác')) DEFAULT 'Nam',
        grade TEXT DEFAULT 'Lớp 6',
        date_of_birth TEXT,
        enroll_date TEXT,
        school TEXT,
        status TEXT CHECK(status IN ('Đang học', 'Đã nghỉ')) DEFAULT 'Đang học',
        father_name TEXT,
        father_phone TEXT,
        mother_name TEXT,
        mother_phone TEXT,
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Try to add grade & nickname columns if table already exists
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN grade TEXT DEFAULT 'Lớp 6'")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN nickname TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    # 7. Center Manager — Teachers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teachers_cm (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        role TEXT CHECK(role IN ('Giáo viên', 'Trợ giảng')) DEFAULT 'Giáo viên',
        date_of_birth TEXT,
        phone TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 8. Center Manager — Classes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        teacher_id INTEGER REFERENCES teachers_cm(id) ON DELETE SET NULL,
        grade TEXT DEFAULT 'Lớp 6',
        subject TEXT,
        room TEXT,
        status TEXT CHECK(status IN ('Đang hoạt động', 'Tạm dừng', 'Đã kết thúc')) DEFAULT 'Đang hoạt động',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    try:
        cursor.execute("ALTER TABLE classes ADD COLUMN grade TEXT DEFAULT 'Lớp 6'")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE classes ADD COLUMN color TEXT DEFAULT '#7c3aed'")
    except sqlite3.OperationalError:
        pass

    # Auto-assign distinct colors to existing classes with default #7c3aed color
    palette = [
        '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
        '#06b6d4', '#f97316', '#84cc16', '#a78bfa', '#fb7185',
        '#6366f1', '#8b5cf6', '#14b8a6', '#eab308', '#22c55e',
        '#60a5fa', '#c084fc', '#f472b6', '#38bdf8', '#e879f9'
    ]
    try:
        cursor.execute("SELECT id, color FROM classes")
        existing_classes = cursor.fetchall()
        for row in existing_classes:
            cid = row["id"]
            c_color = row["color"]
            if not c_color or c_color == '#7c3aed':
                assigned_color = palette[(cid * 3 + 1) % len(palette)]
                cursor.execute("UPDATE classes SET color = ? WHERE id = ?", (assigned_color, cid))
        conn.commit()
    except Exception:
        pass

    # 9. Class Students enrollment junction
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS class_students (
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        seat_color TEXT DEFAULT NULL,
        grade_group TEXT DEFAULT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (class_id, student_id)
    )
    """)

    # 10. Class Weekly Schedule
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS class_schedule_weekly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        day_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        notes TEXT
    )
    """)

    # 11. Class Monthly Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS class_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        status TEXT CHECK(status IN ('Sắp diễn ra', 'Đã học', 'Hủy')) DEFAULT 'Sắp diễn ra',
        teacher_id INTEGER REFERENCES teachers_cm(id) ON DELETE SET NULL,
        notes TEXT,
        color TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    try:
        cursor.execute("ALTER TABLE class_sessions ADD COLUMN color TEXT DEFAULT NULL")
    except sqlite3.OperationalError:
        pass

    # 12. Class Seating Layout
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS class_seating (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER UNIQUE REFERENCES classes(id) ON DELETE CASCADE,
        num_rows INTEGER NOT NULL DEFAULT 4,
        layout_json TEXT NOT NULL DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 13. Center Manager — Courses table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        duration_weeks INTEGER,
        status TEXT CHECK(status IN ('Đang mở', 'Đã đóng')) DEFAULT 'Đang mở',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 14. Student Scores table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        test_title TEXT,
        test_date TEXT,
        score_type TEXT CHECK(score_type IN ('check_1', 'check_2', 'homework')) NOT NULL,
        score REAL,
        max_score REAL DEFAULT 10,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, class_id, score_type)
    )
    """)

    # 15. Class Attendance & Grades table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS class_attendance_grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        date TEXT NOT NULL,
        status TEXT CHECK(status IN ('Có mặt', 'Vắng mặt')) DEFAULT 'Có mặt',
        check_1 REAL DEFAULT 0,
        check_2 REAL DEFAULT 0,
        homework REAL DEFAULT 0,
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, student_id, date)
    )
    """)

    # Migration: Add mock_test column to class_attendance_grades if not exists
    try:
        cursor.execute("ALTER TABLE class_attendance_grades ADD COLUMN mock_test REAL DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    # 16. Friend Groups table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS friend_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        group_name TEXT NOT NULL,
        color_hex TEXT DEFAULT '#6366F1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 17. Friend Group Members table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS friend_group_members (
        group_id INTEGER REFERENCES friend_groups(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        PRIMARY KEY (class_id, student_id)
    )
    """)

    # 18. Conflict Relationships table (legacy pair compatibility)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conflict_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        student_id1 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        student_id2 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (class_id, student_id1, student_id2)
    )
    """)

    # 19. Trusted Swap Relationships table (legacy pair compatibility)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trusted_swap_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        student_id1 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        student_id2 INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (class_id, student_id1, student_id2)
    )
    """)

    # 20. Conflict Groups table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conflict_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        group_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 21. Conflict Group Members table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conflict_group_members (
        group_id INTEGER REFERENCES conflict_groups(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        PRIMARY KEY (class_id, student_id)
    )
    """)

    # 22. Trusted Swap Individual Students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trusted_swap_students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (class_id, student_id)
    )
    """)

    # Alter class_seating for extra columns
    try:
        cursor.execute("ALTER TABLE class_seating ADD COLUMN rows INTEGER DEFAULT 4")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE class_seating ADD COLUMN cols INTEGER DEFAULT 6")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE class_seating ADD COLUMN snapshot_name TEXT DEFAULT 'Bản chính'")
    except sqlite3.OperationalError:
        pass

    # 23. Custom Time Phases table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS custom_time_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phase_name TEXT NOT NULL,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE DEFAULT NULL,
        from_date TEXT NOT NULL,
        to_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Performance Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_grade_unit ON question_bank(grade, unit);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_list_grade_unit ON vocabulary_list(grade, unit);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_folder_deleted ON documents(folder_id, is_deleted);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_document_folders_parent_deleted ON document_folders(parent_id, is_deleted);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_class_sessions_class_date ON class_sessions(class_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_class_student_date ON class_attendance_grades(class_id, student_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_custom_time_phases_class_dates ON custom_time_phases(class_id, from_date, to_date);")
    # Cleanup / migration: Set status = 'Vắng mặt' ONLY for PAST attendance records (date < today) with no grades and no notes, while restoring today/future records to 'Có mặt'
    try:
        cursor.execute("""
            UPDATE class_attendance_grades
            SET status = 'Vắng mặt'
            WHERE date < DATE('now', 'localtime')
              AND (check_1 IS NULL OR check_1 = 0)
              AND (check_2 IS NULL OR check_2 = 0)
              AND (homework IS NULL OR homework = 0)
              AND (notes IS NULL OR TRIM(notes) = '')
        """)
        cursor.execute("""
            UPDATE class_attendance_grades
            SET status = 'Có mặt'
            WHERE date >= DATE('now', 'localtime')
              AND (check_1 IS NULL OR check_1 = 0)
              AND (check_2 IS NULL OR check_2 = 0)
              AND (homework IS NULL OR homework = 0)
              AND (notes IS NULL OR TRIM(notes) = '')
              AND status = 'Vắng mặt'
        """)
        cursor.execute("UPDATE class_attendance_grades SET check_1 = NULL WHERE check_1 = 0")
        cursor.execute("UPDATE class_attendance_grades SET check_2 = NULL WHERE check_2 = 0")
        cursor.execute("UPDATE class_attendance_grades SET homework = NULL WHERE homework = 0")
    except Exception as e:
        print("Attendance cleanup error:", e)

    try:
        from services.skill_mastery_service import init_skill_mastery_db
        init_skill_mastery_db(conn)
    except Exception as e:
        print("Skill mastery schema init error:", e)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

# ----------------------------------------------------
# QUESTION BANK OPERATIONS
# ----------------------------------------------------
def insert_questions(questions: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Prepare batch insert
    sql = """
    INSERT INTO question_bank (
        grade, unit, test_type, question_text, question_type, 
        option_1, option_2, option_3, option_4, answer, level, frequency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    data = []
    for q in questions:
        meta = q.get("meta") or {}
        # CSV options grid
        opts = q.get("o") or []
        opt1 = opts[0] if len(opts) > 0 else ""
        opt2 = opts[1] if len(opts) > 1 else ""
        opt3 = opts[2] if len(opts) > 2 else ""
        opt4 = opts[3] if len(opts) > 3 else ""
        
        qtype = q.get("t", q.get("question_type", ""))
        if str(qtype).lower() in ["wf", "word form", "wordform"]:
            qtype = "fb"

        data.append((
            meta.get("grade", q.get("grade", "")),
            meta.get("unit", q.get("unit", "")),
            q.get("test_type", ""),
            q.get("x", q.get("question_text", "")),
            qtype,
            opt1, opt2, opt3, opt4,
            q.get("a", q.get("answer", "")),
            q.get("level", ""),
            q.get("frequency", "")
        ))
        
    cursor.executemany(sql, data)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count

def get_questions(grade=None, unit=None, qtype=None, level=None, search=None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM question_bank WHERE 1=1"
    params = []
    
    if grade:
        query += " AND grade = ?"
        params.append(str(grade))
    if unit:
        query += " AND unit = ?"
        params.append(str(unit))
    if qtype:
        query += " AND question_type = ?"
        params.append(str(qtype))
    if level:
        query += " AND level = ?"
        params.append(str(level))
    if search:
        query += " AND (question_text LIKE ? OR option_1 LIKE ? OR option_2 LIKE ? OR option_3 LIKE ? OR option_4 LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term, term])
        
    query += " ORDER BY COALESCE(CAST(frequency AS INTEGER), 0) ASC, id DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        # Reconstruct compiler options list
        opts = []
        if r["option_1"]: opts.append(r["option_1"])
        if r["option_2"]: opts.append(r["option_2"])
        if r["option_3"]: opts.append(r["option_3"])
        if r["option_4"]: opts.append(r["option_4"])
        
        raw_t = r["question_type"]
        if str(raw_t).lower() in ["wf", "word form", "wordform"]:
            raw_t = "fb"

        result.append({
            "id": r["id"],
            "grade": r["grade"],
            "unit": r["unit"],
            "test_type": r["test_type"],
            "x": r["question_text"],
            "t": raw_t,
            "o": opts,
            "a": r["answer"],
            "level": r["level"],
            "frequency": r["frequency"]
        })
    return result

def delete_questions(ids: List[int]):
    if not ids:
        return 0
    conn = get_connection()
    cursor = conn.cursor()
    placeholders = ",".join("?" for _ in ids)
    cursor.execute(f"DELETE FROM question_bank WHERE id IN ({placeholders})", ids)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count

def clear_questions(grade = None, unit = None):
    conn = get_connection()
    cursor = conn.cursor()
    if grade and unit:
        cursor.execute("DELETE FROM question_bank WHERE grade = ? AND unit = ?", (grade, unit))
    elif grade:
        cursor.execute("DELETE FROM question_bank WHERE grade = ?", (grade,))
    else:
        cursor.execute("DELETE FROM question_bank")
    conn.commit()
    conn.close()

def increment_question_frequency(ids: List[int]) -> int:
    if not ids:
        return 0
    conn = get_connection()
    cursor = conn.cursor()
    placeholders = ",".join("?" for _ in ids)
    cursor.execute(f"""
        UPDATE question_bank 
        SET frequency = COALESCE(CAST(frequency AS INTEGER), 0) + 1 
        WHERE id IN ({placeholders})
    """, ids)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count

def reset_question_frequency(ids: List[int] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    if ids:
        placeholders = ",".join("?" for _ in ids)
        cursor.execute(f"UPDATE question_bank SET frequency = 0 WHERE id IN ({placeholders})", ids)
    else:
        cursor.execute("UPDATE question_bank SET frequency = 0")
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count

# ----------------------------------------------------
# VOCABULARY OPERATIONS
# ----------------------------------------------------
def insert_vocabulary(entries: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    
    sql = """
    INSERT INTO vocabulary_list (
        no, grade, unit, vocabulary, pos, ipa, meaning, difficulty, root_word
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    data = []
    for e in entries:
        data.append((
            e.get("no", ""),
            e.get("grade", ""),
            e.get("unit", ""),
            e.get("vocabulary", ""),
            e.get("pos", ""),
            e.get("ipa", ""),
            e.get("meaning", ""),
            e.get("difficulty", ""),
            e.get("root_word", "")
        ))
        
    cursor.executemany(sql, data)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count

def get_vocabulary(grade=None, unit=None, difficulty=None, pos=None, search=None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM vocabulary_list WHERE 1=1"
    params = []
    
    if grade:
        query += " AND grade = ?"
        params.append(str(grade))
    if unit:
        query += " AND unit = ?"
        params.append(str(unit))
    if difficulty:
        query += " AND difficulty = ?"
        params.append(str(difficulty))
    if pos:
        query += " AND pos LIKE ?"
        params.append(f"%{pos}%")
    if search:
        query += " AND (vocabulary LIKE ? OR meaning LIKE ? OR root_word LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    query += " ORDER BY grade ASC, CAST(unit AS INTEGER) ASC, CAST(no AS INTEGER) ASC, id ASC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(r) for r in rows]

def delete_vocabulary(ids: List[int]):
    if not ids:
        return 0
    conn = get_connection()
    cursor = conn.cursor()
    placeholders = ",".join("?" for _ in ids)
    cursor.execute(f"DELETE FROM vocabulary_list WHERE id IN ({placeholders})", ids)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count

def clear_vocabulary(grade = None, unit = None):
    conn = get_connection()
    cursor = conn.cursor()
    if grade and unit:
        cursor.execute("DELETE FROM vocabulary_list WHERE grade = ? AND unit = ?", (grade, unit))
    elif grade:
        cursor.execute("DELETE FROM vocabulary_list WHERE grade = ?", (grade,))
    else:
        cursor.execute("DELETE FROM vocabulary_list")
    conn.commit()
    conn.close()

def update_vocabulary(vocab_id: int, e: Dict[str, Any]) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    sql = """
    UPDATE vocabulary_list
    SET no = ?, grade = ?, unit = ?, vocabulary = ?, pos = ?, ipa = ?, meaning = ?, difficulty = ?, root_word = ?
    WHERE id = ?
    """
    cursor.execute(sql, (
        str(e.get("no", "")),
        str(e.get("grade", "")),
        str(e.get("unit", "")),
        str(e.get("vocabulary", "")),
        str(e.get("pos", "")),
        str(e.get("ipa", "")),
        str(e.get("meaning", "")),
        str(e.get("difficulty", "")),
        str(e.get("root_word", "")),
        vocab_id
    ))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

def update_question(question_id: int, q: Dict[str, Any]) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    opts = q.get("o") or []
    opt1 = opts[0] if len(opts) > 0 else ""
    opt2 = opts[1] if len(opts) > 1 else ""
    opt3 = opts[2] if len(opts) > 2 else ""
    opt4 = opts[3] if len(opts) > 3 else ""
    
    sql = """
    UPDATE question_bank
    SET grade = ?, unit = ?, test_type = ?, question_text = ?, question_type = ?, 
        option_1 = ?, option_2 = ?, option_3 = ?, option_4 = ?, answer = ?, level = ?, frequency = ?
    WHERE id = ?
    """
    cursor.execute(sql, (
        str(q.get("grade", "")),
        str(q.get("unit", "")),
        str(q.get("test_type", "")),
        str(q.get("x", q.get("question_text", ""))),
        str(q.get("t", q.get("question_type", ""))),
        opt1, opt2, opt3, opt4,
        str(q.get("a", q.get("answer", ""))),
        str(q.get("level", "")),
        str(q.get("frequency", "")),
        question_id
    ))
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count > 0

def get_active_grades() -> List[str]:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT grade FROM question_bank WHERE grade IS NOT NULL AND grade != ''")
    q_grades = [str(r[0]) for r in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT grade FROM vocabulary_list WHERE grade IS NOT NULL AND grade != ''")
    v_grades = [str(r[0]) for r in cursor.fetchall()]
    
    conn.close()
    
    digits = []
    others = []
    for g in set(q_grades + v_grades):
        if g.isdigit():
            digits.append(int(g))
        else:
            others.append(g)
    digits.sort()
    others.sort()
    all_grades = [str(d) for d in digits] + others
    
    if not all_grades:
        return ["6", "7", "8", "9"]
    return all_grades

# ----------------------------------------------------
# DOCUMENT MANAGER OPERATIONS
# ----------------------------------------------------
def insert_folder(name: str, parent_id: Any = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO document_folders (name, parent_id) VALUES (?, ?)", (name, parent_id))
    conn.commit()
    fid = cursor.lastrowid
    conn.close()
    return fid

def get_folders(is_deleted: int = 0) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM document_folders WHERE is_deleted = ? ORDER BY name ASC", (is_deleted,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_folder(folder_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    # Mark folder and all recursive subfolders as deleted
    cursor.execute("""
        WITH RECURSIVE sub_folders(id) AS (
            SELECT id FROM document_folders WHERE id = ?
            UNION ALL
            SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
        )
        UPDATE document_folders SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
        WHERE id IN (SELECT id FROM sub_folders)
    """, (folder_id,))
    # Soft delete all documents in folder and subfolders
    cursor.execute("""
        WITH RECURSIVE sub_folders(id) AS (
            SELECT id FROM document_folders WHERE id = ?
            UNION ALL
            SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
        )
        UPDATE documents SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
        WHERE folder_id IN (SELECT id FROM sub_folders)
    """, (folder_id,))
    conn.commit()
    conn.close()

def insert_document(name: str, filename: str, filepath: str, folder_id: Any, file_type: str, file_size: int, tags: str = "") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    # Normalize folder_id: convert falsy/empty values to None
    fid = int(folder_id) if (folder_id is not None and str(folder_id).strip() != '' and str(folder_id) != 'null') else None
    cursor.execute("""
        INSERT INTO documents (name, filename, filepath, folder_id, file_type, file_size, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name, filename, filepath, fid, file_type, file_size, tags))
    conn.commit()
    did = cursor.lastrowid
    conn.close()
    return did

def get_documents(folder_id: Any = '__ALL__', tag: str = None, search: str = None, is_deleted: int = 0) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM documents WHERE is_deleted = ?"
    params = [is_deleted]
    
    if folder_id != '__ALL__':
        if folder_id is None or str(folder_id).strip() == '' or str(folder_id) == 'null':
            query += " AND folder_id IS NULL"
        else:
            query += " AND folder_id = ?"
            params.append(int(folder_id))
            
    if tag:
        query += " AND (',' || tags || ',') LIKE ?"
        params.append(f"%,{tag.strip()},%")
        
    if search:
        query += " AND (name LIKE ? OR filename LIKE ? OR tags LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_document(doc_id: int) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_document(doc_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

def restore_document(doc_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET is_deleted = 0, deleted_at = NULL WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

def restore_folder(folder_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        WITH RECURSIVE sub_folders(id) AS (
            SELECT id FROM document_folders WHERE id = ?
            UNION ALL
            SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
        )
        UPDATE document_folders SET is_deleted = 0, deleted_at = NULL
        WHERE id IN (SELECT id FROM sub_folders)
    """, (folder_id,))
    cursor.execute("""
        WITH RECURSIVE sub_folders(id) AS (
            SELECT id FROM document_folders WHERE id = ?
            UNION ALL
            SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
        )
        UPDATE documents SET is_deleted = 0, deleted_at = NULL
        WHERE folder_id IN (SELECT id FROM sub_folders)
    """, (folder_id,))
    conn.commit()
    conn.close()

def permanently_delete_document(doc_id: int):
    from config.settings import get_setting
    files_dir = get_setting("files_dir")
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get document path
    cursor.execute("SELECT filepath FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    filepath = row[0] if row else None
    
    # Delete attachments
    cursor.execute("SELECT id, filepath FROM document_attachments WHERE document_id = ?", (doc_id,))
    atts = cursor.fetchall()
    for aid, att_filepath in atts:
        att_path = os.path.join(files_dir, att_filepath)
        if os.path.exists(att_path) and os.path.isfile(att_path):
            try: os.remove(att_path)
            except: pass
        cursor.execute("DELETE FROM document_attachments WHERE id = ?", (aid,))
        
    # Delete document file
    if filepath:
        doc_path = os.path.join(files_dir, filepath)
        if os.path.exists(doc_path) and os.path.isfile(doc_path):
            try: os.remove(doc_path)
            except: pass
            
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

def permanently_delete_folder_recursive(folder_id: int):
    from config.settings import get_setting
    files_dir = get_setting("files_dir")
    conn = get_connection()
    cursor = conn.cursor()
    
    # Find all documents in this folder and delete them permanently
    cursor.execute("SELECT id FROM documents WHERE folder_id = ?", (folder_id,))
    doc_ids = [r[0] for r in cursor.fetchall()]
    conn.close()
    
    for doc_id in doc_ids:
        permanently_delete_document(doc_id)
        
    # Find child folders and delete recursively
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM document_folders WHERE parent_id = ?", (folder_id,))
    child_ids = [r[0] for r in cursor.fetchall()]
    conn.commit()
    conn.close()
    
    for cid in child_ids:
        permanently_delete_folder_recursive(cid)
        
    # Delete folder itself
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document_folders WHERE id = ?", (folder_id,))
    conn.commit()
    conn.close()

def purge_old_trash():
    import os
    from config.settings import get_setting
    files_dir = get_setting("files_dir")
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Purge old documents (deleted_at > 30 days ago)
    # SQLite has datetime('now', '-30 days')
    cursor.execute("SELECT id FROM documents WHERE is_deleted = 1 AND deleted_at < datetime('now', '-30 days')")
    old_doc_ids = [r[0] for r in cursor.fetchall()]
    conn.close()
    
    for doc_id in old_doc_ids:
        try:
            permanently_delete_document(doc_id)
        except Exception as e:
            print(f"Error purging document {doc_id}: {e}")
            
    # 2. Purge old folders
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM document_folders WHERE is_deleted = 1 AND deleted_at < datetime('now', '-30 days')")
    old_folder_ids = [r[0] for r in cursor.fetchall()]
    conn.close()
    
    for f_id in old_folder_ids:
        try:
            permanently_delete_folder_recursive(f_id)
        except Exception as e:
            print(f"Error purging folder {f_id}: {e}")

def update_document_tags(doc_id: int, tags: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE documents SET tags = ? WHERE id = ?", (tags, doc_id))
    conn.commit()
    conn.close()

def update_document_folder(doc_id: int, folder_id: Any):
    conn = get_connection()
    cursor = conn.cursor()
    fid = int(folder_id) if (folder_id is not None and str(folder_id).strip() != '' and str(folder_id) != 'null') else None
    cursor.execute("UPDATE documents SET folder_id = ? WHERE id = ?", (fid, doc_id))
    conn.commit()
    conn.close()

def insert_attachment(document_id: int, filename: str, filepath: str, file_type: str, file_size: int) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO document_attachments (document_id, filename, filepath, file_type, file_size)
        VALUES (?, ?, ?, ?, ?)
    """, (document_id, filename, filepath, file_type, file_size))
    conn.commit()
    aid = cursor.lastrowid
    conn.close()
    return aid

def get_attachments(document_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM document_attachments WHERE document_id = ? ORDER BY id DESC", (document_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_attachment(attachment_id: int) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM document_attachments WHERE id = ?", (attachment_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_attachment(attachment_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document_attachments WHERE id = ?", (attachment_id,))
    conn.commit()
    conn.close()

def update_folder_parent(folder_id: int, parent_id: Any):
    conn = get_connection()
    cursor = conn.cursor()
    pid = int(parent_id) if (parent_id is not None and str(parent_id).strip() != '' and str(parent_id) != 'null') else None
    cursor.execute("UPDATE document_folders SET parent_id = ? WHERE id = ?", (pid, folder_id))
    conn.commit()
    conn.close()

# ----------------------------------------------------
# CENTER MANAGER — STUDENTS CRUD
# ----------------------------------------------------
def get_students(search: str = "", status: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = """
        SELECT s.*, GROUP_CONCAT(c.class_name, ', ') as enrolled_classes
        FROM students s
        LEFT JOIN class_students cs ON s.id = cs.student_id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE 1=1
    """
    params = []
    if search:
        query += " AND (s.full_name LIKE ? OR s.nickname LIKE ? OR s.school LIKE ? OR s.father_phone LIKE ? OR s.mother_phone LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern, pattern])
    if status:
        query += " AND s.status = ?"
        params.append(status)
    query += " GROUP BY s.id ORDER BY s.id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_student(data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    
    full_name = str(data.get("full_name") or "").strip()
    if not full_name:
        conn.close()
        raise ValueError("Vui lòng nhập họ và tên học sinh.")

    # Check for duplicate student name in database
    cursor.execute("SELECT id, full_name, date_of_birth, grade, gender, school FROM students WHERE LOWER(TRIM(full_name)) = LOWER(TRIM(?))", (full_name,))
    duplicates = cursor.fetchall()
    
    if duplicates:
        dob = str(data.get("date_of_birth") or "").strip()
        grade = str(data.get("grade") or "").strip()
        gender = str(data.get("gender") or "").strip()
        school = str(data.get("school") or "").strip()

        missing = []
        if not dob: missing.append("Ngày sinh")
        if not grade: missing.append("Lớp học")
        if not gender: missing.append("Giới tính")
        if not school: missing.append("Trường học")

        if missing:
            conn.close()
            raise ValueError(
                f"Phát hiện trùng tên học sinh '{full_name}' trong hệ thống! "
                f"Vui lòng nhập bổ sung đầy đủ thông tin định danh: {', '.join(missing)} để phân biệt."
            )

    cursor.execute("""
        INSERT INTO students (
            full_name, nickname, gender, grade, date_of_birth, enroll_date, school, status,
            father_name, father_phone, mother_name, mother_phone, address, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        full_name, data.get("nickname", ""), data.get("gender", "Nam"), data.get("grade", "Lớp 6"), data.get("date_of_birth"),
        data.get("enroll_date"), data.get("school"), data.get("status", "Đang học"),
        data.get("father_name"), data.get("father_phone"), data.get("mother_name"),
        data.get("mother_phone"), data.get("address"), data.get("notes")
    ))
    conn.commit()
    sid = cursor.lastrowid
    conn.close()
    return sid

def update_student(student_id: int, data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE students SET
            full_name = ?, nickname = ?, gender = ?, grade = ?, date_of_birth = ?, enroll_date = ?, school = ?, status = ?,
            father_name = ?, father_phone = ?, mother_name = ?, mother_phone = ?, address = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        data.get("full_name"), data.get("nickname", ""), data.get("gender"), data.get("grade", "Lớp 6"), data.get("date_of_birth"),
        data.get("enroll_date"), data.get("school"), data.get("status"),
        data.get("father_name"), data.get("father_phone"), data.get("mother_name"),
        data.get("mother_phone"), data.get("address"), data.get("notes"),
        student_id
    ))
    conn.commit()
    conn.close()

def delete_student(student_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()

# ----------------------------------------------------
# CENTER MANAGER — TEACHERS CRUD
# ----------------------------------------------------
def get_teachers_cm(search: str = "", role: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM teachers_cm WHERE 1=1"
    params = []
    if search:
        query += " AND (full_name LIKE ? OR phone LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern])
    if role:
        query += " AND role = ?"
        params.append(role)
    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_teacher_cm(data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO teachers_cm (full_name, role, date_of_birth, phone, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data.get("full_name"), data.get("role", "Giáo viên"),
        data.get("date_of_birth"), data.get("phone"), data.get("notes")
    ))
    conn.commit()
    tid = cursor.lastrowid
    conn.close()
    return tid

def update_teacher_cm(teacher_id: int, data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE teachers_cm SET
            full_name = ?, role = ?, date_of_birth = ?, phone = ?, notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        data.get("full_name"), data.get("role"), data.get("date_of_birth"),
        data.get("phone"), data.get("notes"), teacher_id
    ))
    conn.commit()
    conn.close()

def delete_teacher_cm(teacher_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM teachers_cm WHERE id = ?", (teacher_id,))
    conn.commit()
    conn.close()

# ----------------------------------------------------
# CENTER MANAGER — CLASSES CRUD & SEATING / SCHEDULE
# ----------------------------------------------------
def get_classes(search: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
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
    conn.close()
    return [dict(r) for r in rows]

def create_class(data: Dict[str, Any]) -> int:
    conn = get_connection()
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
    cid = cursor.lastrowid
    conn.close()
    return cid

def update_class(class_id: int, data: Dict[str, Any]):
    conn = get_connection()
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
    conn.close()

def delete_class(class_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM classes WHERE id = ?", (class_id,))
    conn.commit()
    conn.close()

def get_class_students(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
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
    conn.close()
    return [dict(r) for r in rows]

def enroll_student_to_class(class_id: int, student_id: int, seat_color: str = None, grade_group: str = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO class_students (class_id, student_id, seat_color, grade_group)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(class_id, student_id) DO UPDATE SET
            seat_color = EXCLUDED.seat_color,
            grade_group = EXCLUDED.grade_group
    """, (class_id, student_id, seat_color, grade_group))
    conn.commit()
    conn.close()

def unenroll_student_from_class(class_id: int, student_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM class_students WHERE class_id = ? AND student_id = ?", (class_id, student_id))
    conn.commit()
    conn.close()

def update_class_student_groups(class_id: int, student_id: int, seat_color: str, grade_group: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE class_students SET seat_color = ?, grade_group = ?
        WHERE class_id = ? AND student_id = ?
    """, (seat_color, grade_group, class_id, student_id))
    conn.commit()
    conn.close()

def get_class_weekly_schedule(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM class_schedule_weekly WHERE class_id = ? ORDER BY id ASC", (class_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_class_weekly_slot(class_id: int, day_of_week: str, start_time: str, duration: int, notes: str = "") -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO class_schedule_weekly (class_id, day_of_week, start_time, duration, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (class_id, day_of_week, start_time, duration, notes))
    conn.commit()
    sid = cursor.lastrowid
    conn.close()
    return sid

def delete_class_weekly_slot(slot_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM class_schedule_weekly WHERE id = ?", (slot_id,))
    conn.commit()
    conn.close()

def get_class_sessions(class_id: int, month_year: str = "") -> List[Dict[str, Any]]:
    import calendar
    from datetime import datetime

    conn = get_connection()
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
    conn.close()
    
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


def add_class_session(class_id: int, date: str, start_time: str, duration: int, status: str = "Sắp diễn ra", teacher_id: int = None, notes: str = "", color: str = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO class_sessions (class_id, date, start_time, duration, status, teacher_id, notes, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (class_id, date, start_time, duration, status, teacher_id, notes, color))
    conn.commit()
    sid = cursor.lastrowid
    conn.close()
    return sid

def update_class_session(session_id: int, data: Dict[str, Any], class_id: int = None):
    conn = get_connection()
    cursor = conn.cursor()
    
    target_cid = class_id or data.get("class_id")

    # If session_id is negative (virtual session generated from weekly slots)
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
                conn.close()
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
    conn.close()

def delete_class_session(session_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM class_sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

def get_class_seating(class_id: int) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM class_seating WHERE class_id = ?", (class_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {"class_id": class_id, "num_rows": 4, "layout_json": "[]"}

def save_class_seating(class_id: int, num_rows: int, layout_json: str):
    conn = get_connection()
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
    conn.close()

# ----------------------------------------------------
# CENTER MANAGER — COURSES CRUD
# ----------------------------------------------------
def get_courses(search: str = "", status: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
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
    conn.close()
    return [dict(r) for r in rows]

def create_course(data: Dict[str, Any]) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO courses (course_name, description, price, duration_weeks, status)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data.get("course_name"), data.get("description"), data.get("price", 0),
        data.get("duration_weeks"), data.get("status", "Đang mở")
    ))
    conn.commit()
    cid = cursor.lastrowid
    conn.close()
    return cid

def update_course(course_id: int, data: Dict[str, Any]):
    conn = get_connection()
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
    conn.close()

def delete_course(course_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM courses WHERE id = ?", (course_id,))
    conn.commit()
    conn.close()

# ----------------------------------------------------
# CENTER MANAGER — STUDENT SCORES
# ----------------------------------------------------
def get_student_scores(class_id: int = None, student_id: int = None) -> List[Dict[str, Any]]:
    conn = get_connection()
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
    conn.close()
    return [dict(r) for r in rows]

def upsert_student_score(data: Dict[str, Any]) -> int:
    conn = get_connection()
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
    sid = cursor.lastrowid
    conn.close()
    return sid

def delete_student_score(score_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM student_scores WHERE id = ?", (score_id,))
    conn.commit()
    conn.close()

# ----------------------------------------------------
# CLASS ATTENDANCE & GRADES
# ----------------------------------------------------
def get_class_attendance_grades(class_id: int, date_str: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ag.*, s.full_name as student_name
        FROM class_attendance_grades ag
        JOIN students s ON ag.student_id = s.id
        WHERE ag.class_id = ? AND ag.date = ?
    """, (class_id, date_str))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def upsert_class_attendance_grades(class_id: int, date_str: str, records: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    for rec in records:
        student_id = rec.get("student_id")
        if not student_id:
            continue
        
        def parse_score(val):
            if val is None or val == "" or val == 0 or val == "0":
                return None
            try:
                v = float(val)
                return v if v > 0 else None
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
        status = rec.get("status")

        if has_score:
            status = "Có mặt"
        elif is_past_date and not has_score and not notes:
            status = "Vắng mặt"
        elif not status:
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
    conn.close()


# ----------------------------------------------------
# FRIEND GROUPS, CONFLICTS & TRUSTED SWAPS
# ----------------------------------------------------
def get_friend_groups(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM friend_groups WHERE class_id = ? ORDER BY id ASC", (class_id,))
    groups = [dict(g) for g in cursor.fetchall()]
    
    for g in groups:
        cursor.execute("""
            SELECT fgm.student_id, s.full_name
            FROM friend_group_members fgm
            JOIN students s ON fgm.student_id = s.id
            WHERE fgm.group_id = ?
            ORDER BY s.full_name ASC
        """, (g["id"],))
        g["members"] = [dict(m) for m in cursor.fetchall()]
        
    conn.close()
    return groups

def create_friend_group(class_id: int, group_name: str, color_hex: str = '#6366F1') -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO friend_groups (class_id, group_name, color_hex)
        VALUES (?, ?, ?)
    """, (class_id, group_name, color_hex))
    conn.commit()
    gid = cursor.lastrowid
    conn.close()
    return gid

def delete_friend_group(group_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM friend_groups WHERE id = ?", (group_id,))
    conn.commit()
    conn.close()

def add_member_to_group(group_id: int, student_id: int, class_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    # Replace any existing group membership for this student in this class
    cursor.execute("""
        INSERT INTO friend_group_members (group_id, student_id, class_id)
        VALUES (?, ?, ?)
        ON CONFLICT(class_id, student_id) DO UPDATE SET group_id = EXCLUDED.group_id
    """, (group_id, student_id, class_id))
    conn.commit()
    conn.close()

def remove_member_from_group(class_id: int, student_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM friend_group_members WHERE class_id = ? AND student_id = ?", (class_id, student_id))
    conn.commit()
    conn.close()

def get_student_group(class_id: int, student_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT fg.*
        FROM friend_group_members fgm
        JOIN friend_groups fg ON fgm.group_id = fg.id
        WHERE fgm.class_id = ? AND fgm.student_id = ?
    """, (class_id, student_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_conflict_pairs(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT cr.id, cr.class_id, cr.student_id1, s1.full_name as student_name1,
               cr.student_id2, s2.full_name as student_name2
        FROM conflict_relationships cr
        JOIN students s1 ON cr.student_id1 = s1.id
        JOIN students s2 ON cr.student_id2 = s2.id
        WHERE cr.class_id = ?
        ORDER BY cr.id DESC
    """, (class_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_conflict_pair(class_id: int, s1: int, s2: int) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    id1, id2 = min(s1, s2), max(s1, s2)
    cursor.execute("""
        INSERT INTO conflict_relationships (class_id, student_id1, student_id2)
        VALUES (?, ?, ?)
        ON CONFLICT(class_id, student_id1, student_id2) DO NOTHING
    """, (class_id, id1, id2))
    conn.commit()
    cid = cursor.lastrowid
    conn.close()
    return cid

def remove_conflict_pair(conflict_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conflict_relationships WHERE id = ?", (conflict_id,))
    conn.commit()
    conn.close()

def get_trusted_swap_pairs(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT ts.id, ts.class_id, ts.student_id1, s1.full_name as student_name1,
               ts.student_id2, s2.full_name as student_name2
        FROM trusted_swap_relationships ts
        JOIN students s1 ON ts.student_id1 = s1.id
        JOIN students s2 ON ts.student_id2 = s2.id
        WHERE ts.class_id = ?
        ORDER BY ts.id DESC
    """, (class_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_trusted_swap_pair(class_id: int, s1: int, s2: int) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    id1, id2 = min(s1, s2), max(s1, s2)
    cursor.execute("""
        INSERT INTO trusted_swap_relationships (class_id, student_id1, student_id2)
        VALUES (?, ?, ?)
        ON CONFLICT(class_id, student_id1, student_id2) DO NOTHING
    """, (class_id, id1, id2))
    conn.commit()
    tid = cursor.lastrowid
    conn.close()
    return tid

def remove_trusted_swap_pair(swap_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trusted_swap_relationships WHERE id = ?", (swap_id,))
    conn.commit()
    conn.close()

# --- CONFLICT GROUPS ---
def get_conflict_groups(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conflict_groups WHERE class_id = ? ORDER BY id ASC", (class_id,))
    groups = [dict(r) for r in cursor.fetchall()]

    for g in groups:
        gid = g["id"]
        cursor.execute("""
            SELECT cgm.student_id, s.full_name
            FROM conflict_group_members cgm
            JOIN students s ON cgm.student_id = s.id
            WHERE cgm.group_id = ?
        """, (gid,))
        g["members"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return groups

def create_conflict_group(class_id: int, group_name: str) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO conflict_groups (class_id, group_name) VALUES (?, ?)", (class_id, group_name))
    conn.commit()
    gid = cursor.lastrowid
    conn.close()
    return gid

def delete_conflict_group(group_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conflict_groups WHERE id = ?", (group_id,))
    conn.commit()
    conn.close()

def add_member_to_conflict_group(group_id: int, student_id: int, class_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conflict_group_members (group_id, student_id, class_id)
        VALUES (?, ?, ?)
        ON CONFLICT(class_id, student_id) DO UPDATE SET group_id = EXCLUDED.group_id
    """, (group_id, student_id, class_id))
    conn.commit()
    conn.close()

def remove_member_from_conflict_group(class_id: int, student_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM conflict_group_members WHERE class_id = ? AND student_id = ?", (class_id, student_id))
    conn.commit()
    conn.close()

# --- TRUSTED SWAP INDIVIDUALS ---
def get_trusted_swap_students(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT tss.id, tss.class_id, tss.student_id, s.full_name as student_name, s.gender
        FROM trusted_swap_students tss
        JOIN students s ON tss.student_id = s.id
        WHERE tss.class_id = ?
        ORDER BY tss.id DESC
    """, (class_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_trusted_swap_student(class_id: int, student_id: int) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO trusted_swap_students (class_id, student_id)
        VALUES (?, ?)
        ON CONFLICT(class_id, student_id) DO NOTHING
    """, (class_id, student_id))
    conn.commit()
    tid = cursor.lastrowid
    conn.close()
    return tid

def remove_trusted_swap_student(class_id: int, student_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trusted_swap_students WHERE class_id = ? AND student_id = ?", (class_id, student_id))
    conn.commit()
    conn.close()

# --- ANALYTICS REPORTS ---
def trunc_1_dec(val: float) -> float:
    try:
        v = float(val)
        return math.floor(v * 10.0) / 10.0
    except (ValueError, TypeError):
        return 0.0

# ── Module-Level Tiered Prediction Engine ─────────────────────────────────────
# These are module-level so both calculate_performance_analytics AND
# get_class_student_predictions can call smart_predict without a NameError.

def _ema_predict(vals: List[float]) -> Tuple[float, float]:
    """EMA predictor for very short histories (< 5 data points)."""
    N = len(vals)
    if N == 0:
        return 0.0, 0.0
    if N == 1:
        return 0.0, trunc_1_dec(vals[0])
    alpha = 0.5
    ema = vals[0]
    for v in vals[1:]:
        ema = alpha * v + (1 - alpha) * ema
    slope = (vals[-1] - vals[0]) / (N - 1)
    predicted = max(0.0, min(10.0, ema))
    return slope, trunc_1_dec(predicted)

def _weighted_ols_predict(vals: List[float]) -> Tuple[float, float]:
    """Weighted OLS for moderate histories (5-19 data points).
    Recent sessions receive linearly higher weights so recent
    performance influences the prediction more than old sessions."""
    N = len(vals)
    if N < 2:
        return _ema_predict(vals)
    x_vals = list(range(1, N + 1))
    weights = list(range(1, N + 1))  # session 1 -> weight 1, latest -> weight N
    w_total = float(sum(weights))
    mean_x = sum(w * x for w, x in zip(weights, x_vals)) / w_total
    mean_y = sum(w * y for w, y in zip(weights, vals)) / w_total
    num = sum(weights[i] * (x_vals[i] - mean_x) * (vals[i] - mean_y) for i in range(N))
    den = sum(weights[i] * (x_vals[i] - mean_x) ** 2 for i in range(N))
    slope = num / den if den != 0 else 0.0
    intercept = mean_y - slope * mean_x
    raw_pred = slope * (N + 1) + intercept
    predicted = max(0.0, min(10.0, raw_pred))
    return slope, trunc_1_dec(predicted)

def _holtwinters_predict(vals: List[float]) -> Tuple[float, float]:
    """Holt's Double Exponential Smoothing for rich histories (20+ data points).
    Captures both current performance level and trend direction.
    Falls back to weighted OLS if statsmodels is unavailable or errors."""
    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
        model = ExponentialSmoothing(vals, trend="add", seasonal=None)
        fitted = model.fit(optimized=True, disp=False)
        predicted_val = float(fitted.forecast(1).iloc[0])
        predicted = max(0.0, min(10.0, predicted_val))
        trend_series = fitted.trend
        if trend_series is not None and len(trend_series) > 0:
            slope = float(trend_series.iloc[-1])
        else:
            slope = (vals[-1] - vals[0]) / (len(vals) - 1)
        return slope, trunc_1_dec(predicted)
    except Exception:
        return _weighted_ols_predict(vals)

def _get_grade_weights() -> Dict[str, float]:
    """Retrieves fractional weight map {grade_key: fraction_weight} from app settings."""
    try:
        from config.settings import get_setting
        gt_list = get_setting("grade_types")
        if gt_list and isinstance(gt_list, list):
            res = {}
            for item in gt_list:
                gid = str(item.get("id", "")).strip()
                w = float(item.get("weight", 0)) / 100.0
                if gid:
                    res[gid] = w
            if res:
                return res
        gw = get_setting("grade_weights") or {}
        w_c1 = float(gw.get("check_1", 35.0)) / 100.0
        w_c2 = float(gw.get("check_2", 55.0)) / 100.0
        w_hw = float(gw.get("homework", 10.0)) / 100.0
        return {"check_1": w_c1, "check_2": w_c2, "homework": w_hw}
    except Exception:
        return {"check_1": 0.35, "check_2": 0.55, "homework": 0.10}

def smart_predict(vals: List[float]) -> Tuple[float, float]:
    """Dispatch to the appropriate prediction model based on data volume.
    < 5  sessions -> EMA
    5-19 sessions -> Weighted OLS
    20+  sessions -> Holt-Winters
    Returns (slope, predicted_next_score).
    """
    N = len(vals)
    if N < 5:
        return _ema_predict(vals)
    elif N < 20:
        return _weighted_ols_predict(vals)
    else:
        return _holtwinters_predict(vals)


def calculate_performance_analytics(session_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    gw = _get_grade_weights()
    w_c1 = gw.get("check_1", 0.35)
    w_c2 = gw.get("check_2", 0.55)
    w_hw = gw.get("homework", 0.10)

    if not session_records:
        return {
            "academic_score": 82.0,
            "trend_slope": 0.38,
            "trend_label": "Đang cải thiện",
            "consistency_score": 92.0,
            "std_dev": 0.45,
            "consistency_label": "Rất ổn định",
            "ema_score": 85.0,
            "att_pct": 100.0,
            "performance_index": 87.5,
            "rating_label": "Rất Tốt",
            "pred_overall": 8.5,
            "pred_c1": 8.8,
            "pred_c2": 7.5,
            "pred_hw": 9.5,
            "model_used": "EMA",
            "recommendations": [
                "Duy trì tiến độ học tập hiện tại",
                "Dự đoán buổi tới: Check 1 (8.8), Check 2 (7.5), Homework (9.5)."
            ]
        }

    c1_list, c2_list, hw_list = [], [], []
    overall_session_scores = []
    present_count = 0

    for r in session_records:
        status = r.get("status", "Có mặt")
        if status in ("Vắng mặt", "Nghỉ học"):
            continue  # Exclude absent sessions from grade averages

        present_count += 1
        c1 = float(r.get("check_1") or 0)
        c2 = float(r.get("check_2") or 0)
        hw = float(r.get("homework") or 0)

        if c1 > 0: c1_list.append(c1)
        if c2 > 0: c2_list.append(c2)
        if hw > 0: hw_list.append(hw)

        w_sum = 0.0
        w_tot = 0.0
        if hw > 0:
            w_sum += hw * w_hw
            w_tot += w_hw
        if c1 > 0:
            w_sum += c1 * w_c1
            w_tot += w_c1
        if c2 > 0:
            w_sum += c2 * w_c2
            w_tot += w_c2
        if w_tot > 0:
            overall_session_scores.append(w_sum / w_tot)

    if not overall_session_scores:
        overall_session_scores = [8.0]

    # Proportional weighted academic average based on available score types
    weighted_sum = 0.0
    weight_total = 0.0

    if hw_list:
        avg_hw = sum(hw_list) / len(hw_list)
        weighted_sum += avg_hw * w_hw
        weight_total += w_hw
    else:
        avg_hw = 0.0

    if c1_list:
        avg_c1 = sum(c1_list) / len(c1_list)
        weighted_sum += avg_c1 * w_c1
        weight_total += w_c1
    else:
        avg_c1 = 0.0

    if c2_list:
        avg_c2 = sum(c2_list) / len(c2_list)
        weighted_sum += avg_c2 * w_c2
        weight_total += w_c2
    else:
        avg_c2 = 0.0

    if weight_total > 0:
        academic_10 = weighted_sum / weight_total
    else:
        academic_10 = sum(overall_session_scores) / len(overall_session_scores) if overall_session_scores else 8.0

    academic_score = academic_10 * 10.0

    # Prediction helpers are module-level (see smart_predict / _ema_predict etc. above)

    slope_overall, pred_overall = smart_predict(overall_session_scores)
    slope_c1, pred_c1 = smart_predict(c1_list) if c1_list else (0.0, trunc_1_dec(academic_10))
    slope_c2, pred_c2 = smart_predict(c2_list) if c2_list else (0.0, trunc_1_dec(academic_10))
    slope_hw, pred_hw = smart_predict(hw_list) if hw_list else (0.0, trunc_1_dec(academic_10))

    # ── Determine which model was selected (based on the overall series length) ─
    _N = len(overall_session_scores)
    if _N < 5:
        prediction_model = "EMA"
    elif _N < 20:
        prediction_model = "Weighted OLS"
    else:
        prediction_model = "Holt-Winters"

    # ── Per-session fitted values for tooltip display ────────────────────────
    # For each historical data point we produce a smoothed/fitted estimate so
    # the hover tooltip can show: "Check 1: 9.0 (EMA: 8.8)".
    def _fitted_ema(vals: List[float]) -> List[float]:
        """Running EMA fitted value at each position."""
        if not vals:
            return []
        alpha = 0.5
        fitted: List[float] = []
        ema_v = vals[0]
        for v in vals:
            ema_v = alpha * v + (1 - alpha) * ema_v
            fitted.append(trunc_1_dec(max(0.0, min(10.0, ema_v))))
        return fitted

    def _fitted_wols(vals: List[float]) -> List[float]:
        """In-sample weighted OLS fitted values along the regression trend line."""
        N = len(vals)
        if N < 2:
            return vals[:]
        x_vals = list(range(1, N + 1))
        weights = [0.85 ** (N - 1 - i) for i in range(N)]
        sum_w = sum(weights)
        mean_x = sum(w * x for w, x in zip(weights, x_vals)) / sum_w
        mean_y = sum(w * y for w, y in zip(weights, vals)) / sum_w
        num = sum(weights[i] * (x_vals[i] - mean_x) * (vals[i] - mean_y) for i in range(N))
        den = sum(weights[i] * (x_vals[i] - mean_x) ** 2 for i in range(N))
        slope = num / den if den != 0 else 0.0
        intercept = mean_y - slope * mean_x
        return [trunc_1_dec(max(0.0, min(10.0, slope * x + intercept))) for x in x_vals]

    def _fitted_holtwinters(vals: List[float]) -> List[float]:
        """Return Holt-Winters in-sample fitted values."""
        try:
            from statsmodels.tsa.holtwinters import ExponentialSmoothing
            model = ExponentialSmoothing(vals, trend="add", seasonal=None)
            fitted_model = model.fit(optimized=True, disp=False)
            return [trunc_1_dec(max(0.0, min(10.0, float(v)))) for v in fitted_model.fittedvalues]
        except Exception:
            return _fitted_wols(vals)

    def get_fitted_values(vals: List[float]) -> List[float]:
        """Select fitted-values method matching smart_predict's tier."""
        N = len(vals)
        if N < 5:
            return _fitted_ema(vals)
        elif N < 20:
            return _fitted_wols(vals)
        else:
            return _fitted_holtwinters(vals)

    fitted_c1 = get_fitted_values(c1_list) if c1_list else []
    fitted_c2 = get_fitted_values(c2_list) if c2_list else []
    fitted_hw = get_fitted_values(hw_list) if hw_list else []

    if slope_overall > 0.3:
        trend_label = "Tăng trưởng mạnh ↗"
    elif slope_overall >= 0.1:
        trend_label = "Đang cải thiện"
    elif slope_overall >= -0.1:
        trend_label = "Ổn định"
    elif slope_overall >= -0.3:
        trend_label = "Giảm nhẹ"
    else:
        trend_label = "Suy giảm nhanh"

    trend_score = max(0.0, min(100.0, 50.0 + (slope_overall * 25.0)))

    # Calculate residual SD (RMSE around fitted trajectory) for each score type
    # This prevents systematic upward progress from being falsely penalized as volatility
    def _calc_sd(vals: List[float], fitted_vals: Optional[List[float]] = None) -> float:
        if len(vals) < 2:
            return 0.0
        if fitted_vals and len(fitted_vals) == len(vals):
            # Residual variance from the progress trajectory
            v = sum((actual - fitted) ** 2 for actual, fitted in zip(vals, fitted_vals)) / len(vals)
        else:
            m = sum(vals) / len(vals)
            v = sum((x - m) ** 2 for x in vals) / len(vals)
        return math.sqrt(v)

    std_dev_c1 = _calc_sd(c1_list, fitted_c1)
    std_dev_c2 = _calc_sd(c2_list, fitted_c2)
    std_dev_hw = _calc_sd(hw_list, fitted_hw)

    # Weighted combined SD using configured grade weights
    sd_w_sum = 0.0
    sd_w_total = 0.0
    if hw_list:
        sd_w_sum += std_dev_hw * w_hw
        sd_w_total += w_hw
    if c1_list:
        sd_w_sum += std_dev_c1 * w_c1
        sd_w_total += w_c1
    if c2_list:
        sd_w_sum += std_dev_c2 * w_c2
        sd_w_total += w_c2

    std_dev = (sd_w_sum / sd_w_total) if sd_w_total > 0 else 0.0
    consistency_score = max(0.0, min(100.0, 100.0 - (std_dev * 15.0)))

    if std_dev < 0.5:
        consistency_label = "Rất ổn định"
    elif std_dev <= 1.0:
        consistency_label = "Ổn định"
    elif std_dev <= 2.2:
        consistency_label = "Biến động"
    elif std_dev <= 3.8:
        consistency_label = "Biến động mạnh"
    else:
        consistency_label = "Phân hóa cực lớn"

    def _calc_ema(vals: List[float]) -> float:
        if not vals:
            return 0.0
        e = vals[0]
        alpha = 0.5
        for v in vals[1:]:
            e = alpha * v + (1 - alpha) * e
        return e

    ema_c1 = _calc_ema(c1_list)
    ema_c2 = _calc_ema(c2_list)
    ema_hw = _calc_ema(hw_list)

    ema_w_sum = 0.0
    ema_w_tot = 0.0
    if hw_list:
        ema_w_sum += ema_hw * w_hw
        ema_w_tot += w_hw
    if c1_list:
        ema_w_sum += ema_c1 * w_c1
        ema_w_tot += w_c1
    if c2_list:
        ema_w_sum += ema_c2 * w_c2
        ema_w_tot += w_c2

    ema = (ema_w_sum / ema_w_tot) if ema_w_tot > 0 else (overall_session_scores[0] if overall_session_scores else 8.0)
    ema_score = max(0.0, min(100.0, ema * 10.0))

    total_rec_count = len(session_records)
    att_pct = (present_count / total_rec_count * 100) if total_rec_count > 0 else 100.0

    # Modern Multi-Factor Composite Performance Index (Scale 0 - 100):
    # 40% Recent Capability (EMA Score)
    # 25% Growth Trajectory (Trend Score)
    # 15% True Consistency (Residual Consistency Score)
    # 10% Historical Cumulative Average (Academic Score)
    # 10% Attendance & Discipline (att_pct)
    performance_index = (ema_score * 0.40) + (trend_score * 0.25) + (consistency_score * 0.15) + (academic_score * 0.10) + (att_pct * 0.10)
    performance_index = max(0.0, min(100.0, performance_index))

    if performance_index >= 90:
        rating_label = "Xuất Sắc"
    elif performance_index >= 80:
        rating_label = "Giỏi / Rất Tốt"
    elif performance_index >= 65:
        rating_label = "Khá"
    elif performance_index >= 50:
        rating_label = "Trung Bình"
    elif performance_index >= 35:
        rating_label = "Yếu (Hổng Kiến Thức)"
    else:
        rating_label = "Kém (Cần Phụ Đạo)"

    recs = []
    if slope_overall < -0.1:
        recs.append("Cảnh báo: Xu hướng điểm số đang giảm sút, cần giáo viên trao đổi trực tiếp.")
    if hw_list and avg_hw < 7.0:
        recs.append("Khuyên dùng: Cho học sinh luyện tập thêm bài tập về nhà để củng cố kiến thức căn bản.")
    if att_pct < 85:
        recs.append(f"Cảnh báo: Tỷ lệ vắng mặt cao ({att_pct:.0f}%), ảnh hưởng đến khả năng tiếp thu.")

    # Highly Specific Tiered Volatility & Dispersion Recommendations
    if std_dev >= 4.0:
        recs.append(f"Cảnh báo phân cực cực độ: Lớp học có sự chênh lệch trình độ rất lớn (SD = {std_dev:.1f}). Cần khẩn cấp chia nhóm phụ đạo riêng biệt hoặc áp dụng bài tập phân hóa.")
    elif std_dev >= 2.2:
        recs.append(f"Cảnh báo phân hóa mạnh: Khoảng cách học lực trong lớp khá cao (SD = {std_dev:.1f}). Giáo viên nên giao bài mở rộng cho nhóm giỏi và bài củng cố cho nhóm dưới.")
    elif std_dev >= 1.2:
        recs.append(f"Khuyên dùng: Điểm số có sự trồi sụt so với xu hướng (SD = {std_dev:.1f}), cần theo dõi sát sao từng buổi học.")
    elif slope_overall > 0.2:
        recs.append("Khen ngợi: Đang có sự tiến bộ vượt bậc và duy trì phong độ rất tốt!")

    if not recs:
        recs.append("Đánh giá: Duy trì phong độ tốt. Tiếp tục phát huy trong các kỳ tới.")
    recs.append(f"Dự đoán buổi tới: Check 1 ({pred_c1:.1f}), Check 2 ({pred_c2:.1f}), Homework ({pred_hw:.1f}).")

    return {
        "academic_score": trunc_1_dec(academic_score),
        "trend_slope": round(slope_overall, 2),
        "trend_label": trend_label,
        "consistency_score": trunc_1_dec(consistency_score),
        "std_dev": round(std_dev, 2),
        "std_dev_c1": round(std_dev_c1, 2),
        "std_dev_c2": round(std_dev_c2, 2),
        "std_dev_hw": round(std_dev_hw, 2),
        "consistency_label": consistency_label,
        "ema_level": trunc_1_dec(ema),
        "ema_c1": trunc_1_dec(ema_c1),
        "ema_c2": trunc_1_dec(ema_c2),
        "ema_hw": trunc_1_dec(ema_hw),
        "predicted_next": trunc_1_dec(pred_overall),
        "pred_c1": trunc_1_dec(pred_c1),
        "pred_c2": trunc_1_dec(pred_c2),
        "pred_hw": trunc_1_dec(pred_hw),
        "prediction_model": prediction_model,
        "fitted_c1": fitted_c1,
        "fitted_c2": fitted_c2,
        "fitted_hw": fitted_hw,
        "attendance_pct": round(att_pct, 1),
        "performance_index": round(performance_index, 1),
        "rating_label": rating_label,
        "recommendations": recs
    }

def get_class_student_predictions(class_id: int) -> Dict[int, Dict[str, float]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT student_id, check_1, check_2, homework, status
        FROM class_attendance_grades
        WHERE class_id = ?
        ORDER BY date ASC
    """, (class_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    records_by_student: Dict[int, List[Dict[str, Any]]] = {}
    for r in rows:
        sid = r["student_id"]
        if sid not in records_by_student:
            records_by_student[sid] = []
        records_by_student[sid].append(r)

    gw = _get_grade_weights()
    w_c1 = gw.get("check_1", 0.35)
    w_c2 = gw.get("check_2", 0.55)
    w_hw = gw.get("homework", 0.10)
    predictions: Dict[int, Dict[str, float]] = {}
    for sid, recs in records_by_student.items():
        c1_list, c2_list, hw_list = [], [], []
        overall_session_scores = []
        for r in recs:
            status = r.get("status", "Có mặt")
            if status in ("Vắng mặt", "Nghỉ học"):
                continue
            c1 = float(r.get("check_1") or 0)
            c2 = float(r.get("check_2") or 0)
            hw = float(r.get("homework") or 0)

            if c1 > 0: c1_list.append(c1)
            if c2 > 0: c2_list.append(c2)
            if hw > 0: hw_list.append(hw)

            w_sum = 0.0
            w_tot = 0.0
            if hw > 0:
                w_sum += hw * w_hw
                w_tot += w_hw
            if c1 > 0:
                w_sum += c1 * w_c1
                w_tot += w_c1
            if c2 > 0:
                w_sum += c2 * w_c2
                w_tot += w_c2
            if w_tot > 0:
                overall_session_scores.append(w_sum / w_tot)

        weighted_sum = 0.0
        weight_total = 0.0
        if hw_list:
            weighted_sum += (sum(hw_list) / len(hw_list)) * w_hw
            weight_total += w_hw
        if c1_list:
            weighted_sum += (sum(c1_list) / len(c1_list)) * w_c1
            weight_total += w_c1
        if c2_list:
            weighted_sum += (sum(c2_list) / len(c2_list)) * w_c2
            weight_total += w_c2

        academic_10 = (weighted_sum / weight_total) if weight_total > 0 else (sum(overall_session_scores) / len(overall_session_scores) if overall_session_scores else 8.0)

        _N_overall = len(overall_session_scores)
        if _N_overall < 5:
            _model_name = "EMA"
        elif _N_overall < 20:
            _model_name = "Weighted OLS"
        else:
            _model_name = "Holt-Winters"

        def _smart_pred(vals_list: List[float]) -> float:
            if not vals_list:
                return trunc_1_dec(academic_10)
            _, pv = smart_predict(vals_list)
            return pv

        predictions[sid] = {
            "pred_c1": _smart_pred(c1_list),
            "pred_c2": _smart_pred(c2_list),
            "pred_hw": _smart_pred(hw_list),
            "predicted_next": _smart_pred(overall_session_scores),
            "prediction_model": _model_name,
        }

    return predictions

def get_analytics_reports(class_id: Optional[int] = None, student_id: Optional[int] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    # Always fetch full session records across all classes to accurately populate student rankings and class analytics
    cursor.execute("""
        SELECT ag.*, s.full_name as student_name, s.nickname, c.class_name
        FROM class_attendance_grades ag
        JOIN students s ON ag.student_id = s.id
        JOIN classes c ON ag.class_id = c.id
        JOIN class_students cs ON ag.student_id = cs.student_id AND ag.class_id = cs.class_id
        ORDER BY ag.date ASC
    """)
    all_rows = [dict(r) for r in cursor.fetchall()]

    # Filter session records for the specific class / student view if requested
    if class_id or student_id:
        rows = [
            r for r in all_rows 
            if (not class_id or r.get("class_id") == class_id) and 
               (not student_id or r.get("student_id") == student_id)
        ]
    else:
        rows = all_rows

    rank_query = """
        SELECT 
            s.id as student_id,
            s.full_name,
            s.nickname,
            s.grade as student_grade,
            s.school,
            s.date_of_birth,
            s.gender,
            COALESCE(s.father_phone, s.mother_phone, '') as phone,
            s.father_name,
            s.father_phone,
            s.mother_name,
            s.mother_phone,
            s.address,
            c.id as class_id,
            c.class_name,
            c.grade as class_grade,
            COUNT(ag.id) as total_sessions,
            SUM(CASE WHEN ag.status = 'Có mặt' THEN 1 ELSE 0 END) as present_count,
            AVG(CASE WHEN ag.check_1 > 0 THEN ag.check_1 END) as avg_check_1,
            AVG(CASE WHEN ag.check_2 > 0 THEN ag.check_2 END) as avg_check_2,
            AVG(CASE WHEN ag.homework > 0 THEN ag.homework END) as avg_homework,
            AVG(CASE WHEN (ag.mock_test > 0) THEN ag.mock_test END) as avg_mock_test
        FROM students s
        JOIN class_students cs ON s.id = cs.student_id
        JOIN classes c ON cs.class_id = c.id
        LEFT JOIN class_attendance_grades ag ON s.id = ag.student_id AND c.id = ag.class_id
        GROUP BY s.id, c.id
        ORDER BY (
            COALESCE(AVG(CASE WHEN ag.check_1 > 0 THEN ag.check_1 END), 0) + 
            COALESCE(AVG(CASE WHEN ag.check_2 > 0 THEN ag.check_2 END), 0) + 
            COALESCE(AVG(CASE WHEN ag.homework > 0 THEN ag.homework END), 0)
        ) DESC
    """
    cursor.execute(rank_query)
    raw_rankings = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Calculate per-student individual analytics for ranking & level grouping using all records
    student_rows_map: Dict[int, List[Dict[str, Any]]] = {}
    for r in all_rows:
        sid = r.get("student_id")
        if sid is not None:
            student_rows_map.setdefault(sid, []).append(r)

    enriched_rankings = []
    for sr in raw_rankings:
        sid = sr.get("student_id")
        s_rows = student_rows_map.get(sid, [])
        if s_rows:
            s_analytics = calculate_performance_analytics(s_rows)
            sr["ema_level"] = s_analytics.get("ema_level", 0.0)
            sr["trend_slope"] = s_analytics.get("trend_slope", 0.0)
            sr["trend_label"] = s_analytics.get("trend_label", "Ổn định")
            sr["performance_index"] = s_analytics.get("performance_index", 0.0)
            sr["consistency_score"] = s_analytics.get("consistency_score", 100.0)
            sr["rating_label"] = s_analytics.get("rating_label", "Tốt")
            sr["predicted_next"] = s_analytics.get("predicted_next", 0.0)
            sr["std_dev"] = s_analytics.get("std_dev", 0.0)
        else:
            sr["ema_level"] = 0.0
            sr["trend_slope"] = 0.0
            sr["trend_label"] = "Chưa có dữ liệu"
            sr["performance_index"] = 0.0
            sr["consistency_score"] = 100.0
            sr["rating_label"] = "Chưa có dữ liệu"
            sr["predicted_next"] = 0.0
            sr["std_dev"] = 0.0
        enriched_rankings.append(sr)

    # Calculate per-class analytics summary for cross-class comparisons
    class_rows_map: Dict[int, List[Dict[str, Any]]] = {}
    for r in all_rows:
        cid = r.get("class_id")
        if cid is not None:
            class_rows_map.setdefault(cid, []).append(r)

    class_analytics_map: Dict[str, Dict[str, Any]] = {}
    for cid_k, c_rows in class_rows_map.items():
        class_analytics_map[str(cid_k)] = calculate_performance_analytics(c_rows)

    analytics_summary = calculate_performance_analytics(rows)

    return {
        "session_records": rows,
        "all_session_records": all_rows,
        "student_rankings": enriched_rankings,
        "analytics_summary": analytics_summary,
        "class_analytics_map": class_analytics_map
    }

def reset_student_grades(class_id: Optional[int] = None, student_id: Optional[int] = None, from_date: Optional[str] = None, to_date: Optional[str] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    query = "UPDATE class_attendance_grades SET check_1 = NULL, check_2 = NULL, homework = NULL WHERE 1=1"
    params = []
    if class_id:
        query += " AND class_id = ?"
        params.append(class_id)
    if student_id:
        query += " AND student_id = ?"
        params.append(student_id)
    if from_date:
        query += " AND date >= ?"
        params.append(from_date)
    if to_date:
        query += " AND date <= ?"
        params.append(to_date)
    cursor.execute(query, params)
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count

def get_custom_time_phases(class_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if class_id:
        cursor.execute("SELECT * FROM custom_time_phases WHERE class_id IS NULL OR class_id = ? ORDER BY from_date ASC", (class_id,))
    else:
        cursor.execute("SELECT * FROM custom_time_phases ORDER BY from_date ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def save_custom_time_phase(phase_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    phase_id = phase_data.get("id")
    phase_name = str(phase_data.get("phase_name", "")).strip()
    class_id = phase_data.get("class_id")
    if class_id is not None and str(class_id).strip() != "":
        try:
            class_id = int(class_id)
        except Exception:
            class_id = None
    else:
        class_id = None

    from_date = str(phase_data.get("from_date", "")).strip()
    to_date = str(phase_data.get("to_date", "")).strip()

    if phase_id:
        cursor.execute("""
            UPDATE custom_time_phases 
            SET phase_name = ?, class_id = ?, from_date = ?, to_date = ?
            WHERE id = ?
        """, (phase_name, class_id, from_date, to_date, phase_id))
    else:
        cursor.execute("""
            INSERT INTO custom_time_phases (phase_name, class_id, from_date, to_date)
            VALUES (?, ?, ?, ?)
        """, (phase_name, class_id, from_date, to_date))
        phase_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": phase_id,
        "phase_name": phase_name,
        "class_id": class_id,
        "from_date": from_date,
        "to_date": to_date
    }

def delete_custom_time_phase(phase_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM custom_time_phases WHERE id = ?", (phase_id,))
    conn.commit()
    conn.close()
    return True
