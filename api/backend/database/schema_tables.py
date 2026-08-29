import sqlite3

def create_all_tables(cursor: sqlite3.Cursor):
    """Creates all required SQLite tables for the Center Manager application."""
    
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

    # 18. Conflict Relationships table
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

    # 19. Trusted Swap Relationships table
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

    # 24. Assignments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        assigned_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        max_score REAL DEFAULT 10,
        content_json TEXT DEFAULT '',
        quiz_config TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 25. Assignment Submissions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        submitted INTEGER DEFAULT 0,
        score REAL DEFAULT NULL,
        notes TEXT DEFAULT '',
        submitted_at TIMESTAMP DEFAULT NULL,
        answers_json TEXT DEFAULT '',
        daily_logs TEXT DEFAULT '',
        UNIQUE(assignment_id, student_id)
    )
    """)

    # 26. App Users table (Local accounts management)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        display_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Giáo viên',
        status TEXT CHECK(status IN ('Hoạt động', 'Tạm khóa')) DEFAULT 'Hoạt động',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT NULL
    )
    """)

    # 27. Role Permissions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        tab_id TEXT NOT NULL,
        can_access INTEGER DEFAULT 1,
        UNIQUE(role, tab_id)
    )
    """)

    # 28. App Settings table (Synced global configurations & weights)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)


def create_all_indexes(cursor: sqlite3.Cursor):
    """Creates database indexes for optimized query performance."""
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_grade_unit ON question_bank(grade, unit);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_question_bank_type ON question_bank(question_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_list_grade_unit ON vocabulary_list(grade, unit);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vocabulary_list_grade ON vocabulary_list(grade);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_class_sessions_class_date ON class_sessions(class_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_class_student_date ON class_attendance_grades(class_id, student_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON class_attendance_grades(class_id, date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_custom_time_phases_class_dates ON custom_time_phases(class_id, from_date, to_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_assignments_class_date ON assignments(class_id, assigned_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_submissions_assign_student ON assignment_submissions(assignment_id, student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON assignment_submissions(assignment_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON assignment_submissions(student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON class_attendance_grades(student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_friend_group_members_cls_stu ON friend_group_members(class_id, student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);")


def create_post_migration_indexes(cursor: sqlite3.Cursor):
    """Creates indexes on columns added dynamically via migrations."""
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_documents_folder_deleted ON documents(folder_id, is_deleted);")
    except Exception:
        pass
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_document_folders_parent_deleted ON document_folders(parent_id, is_deleted);")
    except Exception:
        pass
