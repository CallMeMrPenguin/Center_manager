import sqlite3
from database.connection import get_connection
from database.schema_tables import create_all_tables, create_all_indexes, create_post_migration_indexes

def run_migrations(cursor: sqlite3.Cursor, conn: sqlite3.Connection):
    """Executes schema migrations and safe column additions."""
    # Migration: Convert all existing 'wf' / 'Word Form' questions to 'fb' (Fill in the Blank)
    try:
        cursor.execute("UPDATE question_bank SET question_type = 'fb' WHERE question_type IN ('wf', 'Word Form', 'word form', 'wordform')")
        conn.commit()
    except Exception:
        pass

    # Migration safe column additions
    safe_columns = [
        ("document_folders", "parent_id INTEGER DEFAULT NULL REFERENCES document_folders(id) ON DELETE SET NULL"),
        ("documents", "is_deleted INTEGER DEFAULT 0"),
        ("documents", "deleted_at TIMESTAMP DEFAULT NULL"),
        ("document_folders", "is_deleted INTEGER DEFAULT 0"),
        ("document_folders", "deleted_at TIMESTAMP DEFAULT NULL"),
        ("students", "grade TEXT DEFAULT 'Lớp 6'"),
        ("students", "nickname TEXT DEFAULT ''"),
        ("classes", "grade TEXT DEFAULT 'Lớp 6'"),
        ("classes", "color TEXT DEFAULT '#7c3aed'"),
        ("class_sessions", "color TEXT DEFAULT NULL"),
        ("class_attendance_grades", "mock_test REAL DEFAULT NULL"),
        ("class_attendance_grades", "homework_2 REAL DEFAULT NULL"),
        ("class_seating", "rows INTEGER DEFAULT 4"),
        ("class_seating", "cols INTEGER DEFAULT 6"),
        ("class_seating", "snapshot_name TEXT DEFAULT 'Bản chính'"),
        ("assignments", "content_json TEXT DEFAULT ''"),
        ("assignments", "quiz_config TEXT DEFAULT ''"),
        ("assignment_submissions", "answers_json TEXT DEFAULT ''"),
        ("assignment_submissions", "daily_logs TEXT DEFAULT ''"),
    ]

    for table, col_def in safe_columns:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
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


def seed_default_admin(cursor: sqlite3.Cursor):
    """Seeds the initial default admin account if table is empty."""
    try:
        import hashlib
        cursor.execute("SELECT COUNT(*) as count FROM app_users")
        user_count = cursor.fetchone()["count"]
        if user_count == 0:
            default_pwd_hash = hashlib.sha256("admin123".encode("utf-8")).hexdigest()
            cursor.execute("""
                INSERT INTO app_users (display_name, username, password_hash, role, status)
                VALUES ('Quản Trị Viên', 'admin', ?, 'Quản trị viên', 'Hoạt động')
            """, (default_pwd_hash,))
    except Exception as e:
        print("Default user seed error:", e)


def cleanup_legacy_scores(cursor: sqlite3.Cursor):
    """Cleans up legacy 0-value scores to NULL (rule: missing grades = NULL, never 0)."""
    try:
        cursor.execute("UPDATE class_attendance_grades SET check_1 = NULL WHERE check_1 = 0")
        cursor.execute("UPDATE class_attendance_grades SET check_2 = NULL WHERE check_2 = 0")
        cursor.execute("UPDATE class_attendance_grades SET homework = NULL WHERE homework = 0")
        cursor.execute("UPDATE class_attendance_grades SET mock_test = NULL WHERE mock_test = 0")
    except Exception as e:
        print("Attendance cleanup error:", e)


def init_db():
    """Initializes database schema, tables, migrations, and performance indexes."""
    conn = get_connection()
    try:
        cursor = conn.cursor()

        create_all_tables(cursor)
        conn.commit()

        create_all_indexes(cursor)
        conn.commit()

        run_migrations(cursor, conn)
        conn.commit()

        create_post_migration_indexes(cursor)
        conn.commit()

        seed_default_admin(cursor)
        cleanup_legacy_scores(cursor)
        conn.commit()

        try:
            from services.skill_mastery_service import init_skill_mastery_db
            init_skill_mastery_db(conn)
            conn.commit()
        except Exception as e:
            print("Skill mastery schema init error:", e)

        print("Database initialized successfully.")
    finally:
        conn.close()
