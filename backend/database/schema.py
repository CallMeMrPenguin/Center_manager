import sqlite3
from database.connection import get_connection

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
        check_1 REAL DEFAULT NULL,
        check_2 REAL DEFAULT NULL,
        homework REAL DEFAULT NULL,
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(class_id, student_id, date)
    )
    """)

    # Migration: Add mock_test column to class_attendance_grades if not exists (DEFAULT NULL)
    try:
        cursor.execute("ALTER TABLE class_attendance_grades ADD COLUMN mock_test REAL DEFAULT NULL")
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

    # Migration: clean up any legacy 0-value scores → NULL (rule: missing grades = NULL, never 0)
    try:
        cursor.execute("UPDATE class_attendance_grades SET check_1 = NULL WHERE check_1 = 0")
        cursor.execute("UPDATE class_attendance_grades SET check_2 = NULL WHERE check_2 = 0")
        cursor.execute("UPDATE class_attendance_grades SET homework = NULL WHERE homework = 0")
        cursor.execute("UPDATE class_attendance_grades SET mock_test = NULL WHERE mock_test = 0")
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
