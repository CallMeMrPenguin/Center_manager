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
        ("assignment_submissions", "attempts_count INTEGER DEFAULT 1"),
        ("assignment_submissions", "max_score REAL DEFAULT NULL"),
        ("assignment_submissions", "min_score REAL DEFAULT NULL"),
        ("assignment_submissions", "avg_score REAL DEFAULT NULL"),
        ("app_users", "updated_at TIMESTAMP DEFAULT NULL"),
        ("app_users", "plain_password TEXT DEFAULT NULL"),
        ("class_sessions", "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("class_students", "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ]

    for table, col_def in safe_columns:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
            conn.commit()
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass

    try:
        from datetime import datetime
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("UPDATE app_users SET updated_at = ? WHERE updated_at IS NULL", (now_str,))
        cursor.execute("SELECT password_hash FROM app_users WHERE LOWER(username) = 'admin'")
        admin_row = cursor.fetchone()
        if admin_row and not (admin_row["password_hash"] or "").startswith("pbkdf2:sha256:"):
            from database.crud_users import hash_password
            cursor.execute("UPDATE app_users SET password_hash = ?, plain_password = NULL, updated_at = ? WHERE LOWER(username) = 'admin'", (hash_password("callmemrpenguin"), now_str))
        conn.commit()
    except Exception as e:
        print("[Migration app_users notice]:", e)
        try:
            conn.rollback()
        except Exception:
            pass

    # Ensure sync tombstones table exists for conflict-free deletion propagation
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS _sync_tombstones (
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (table_name, record_id)
        );
        """)
        conn.commit()
    except Exception:
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

    # Migration: Update friend_group_members PK from (class_id, student_id) to (group_id, student_id)
    try:
        from database.connection import is_postgres
        if is_postgres():
            cursor.execute("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE table_name = 'friend_group_members' AND constraint_type = 'PRIMARY KEY'
                    ) THEN
                        ALTER TABLE public.friend_group_members DROP CONSTRAINT IF EXISTS friend_group_members_pkey;
                        ALTER TABLE public.friend_group_members ADD PRIMARY KEY (group_id, student_id);
                    END IF;
                END $$;
            """)
        else:
            cursor.execute("PRAGMA table_info(friend_group_members)")
            cols = cursor.fetchall()
            pk_cols = [c[1] for c in cols if c[5] > 0]
            if pk_cols == ["class_id", "student_id"] or ("class_id" in pk_cols and "group_id" not in pk_cols):
                cursor.execute("""
                    CREATE TABLE friend_group_members_migration (
                        group_id INTEGER REFERENCES friend_groups(id) ON DELETE CASCADE,
                        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
                        PRIMARY KEY (group_id, student_id)
                    )
                """)
                cursor.execute("""
                    INSERT OR IGNORE INTO friend_group_members_migration (group_id, student_id, class_id)
                    SELECT group_id, student_id, class_id FROM friend_group_members
                """)
                cursor.execute("DROP TABLE friend_group_members")
                cursor.execute("ALTER TABLE friend_group_members_migration RENAME TO friend_group_members")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_friend_group_members_cls_stu ON friend_group_members(class_id, student_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_friend_group_members_gid ON friend_group_members(group_id)")
        conn.commit()
    except Exception as e:
        print("[Migration friend_group_members note]:", e)

    # Migration: Ensure grade_weights & grade_types in app_settings are set to 30/30/5/35
    try:
        import json
        from datetime import datetime
        now_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        gw_json = json.dumps({"check_1": 30.0, "check_2": 30.0, "homework": 5.0, "mock_test": 35.0})
        gt_json = json.dumps([
            {"id": "check_1", "label": "Từ Vựng", "weight": 30.0, "color": "#3b82f6"},
            {"id": "check_2", "label": "Ngữ Pháp", "weight": 30.0, "color": "#a855f7"},
            {"id": "homework", "label": "BTVN", "weight": 5.0, "color": "#10b981"},
            {"id": "mock_test", "label": "Luyện Đề", "weight": 35.0, "color": "#f59e0b"}
        ], ensure_ascii=False)
        cursor.execute("""
            INSERT INTO app_settings (setting_key, setting_value, updated_at)
            VALUES ('grade_weights', ?, ?)
            ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = EXCLUDED.updated_at
        """, (gw_json, now_dt))
        cursor.execute("""
            INSERT INTO app_settings (setting_key, setting_value, updated_at)
            VALUES ('grade_types', ?, ?)
            ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = EXCLUDED.updated_at
        """, (gt_json, now_dt))
        conn.commit()
    except Exception as e:
        print("[Migration grade_weights note]:", e)


def seed_default_admin(cursor: sqlite3.Cursor):
    """Seeds the initial default admin account if table is empty."""
    try:
        import hashlib
        cursor.execute("SELECT COUNT(*) as count FROM app_users")
        user_count = cursor.fetchone()["count"]
        if user_count == 0:
            from database.crud_users import hash_password
            default_pwd_hash = hash_password("callmemrpenguin")
            cursor.execute("""
                INSERT INTO app_users (display_name, username, password_hash, role, status, plain_password)
                VALUES ('Quản Trị Viên', 'admin', ?, 'Quản trị viên', 'Hoạt động', NULL)
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
