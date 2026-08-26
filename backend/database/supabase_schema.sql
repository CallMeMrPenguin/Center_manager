-- =========================================================================
-- Center Manager App — Supabase PostgreSQL Schema
-- Run this script in the Supabase Dashboard -> SQL Editor
-- =========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. STUDENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id BIGSERIAL PRIMARY KEY,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 2. TEACHERS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers_cm (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('Giáo viên', 'Trợ giảng')) DEFAULT 'Giáo viên',
    date_of_birth TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 3. CLASSES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classes (
    id BIGSERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    teacher_id BIGINT REFERENCES public.teachers_cm(id) ON DELETE SET NULL,
    grade TEXT DEFAULT 'Lớp 6',
    subject TEXT,
    room TEXT,
    color TEXT DEFAULT '#7c3aed',
    status TEXT CHECK(status IN ('Đang hoạt động', 'Tạm dừng', 'Đã kết thúc')) DEFAULT 'Đang hoạt động',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 4. CLASS - STUDENTS ENROLLMENT (JUNCTION)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_students (
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
    seat_color TEXT DEFAULT NULL,
    grade_group TEXT DEFAULT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (class_id, student_id)
);

-- -------------------------------------------------------------------------
-- 5. WEEKLY SCHEDULE TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_schedule_weekly (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    notes TEXT
);

-- -------------------------------------------------------------------------
-- 6. MONTHLY SESSIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT CHECK(status IN ('Sắp diễn ra', 'Đã học', 'Hủy')) DEFAULT 'Sắp diễn ra',
    teacher_id BIGINT REFERENCES public.teachers_cm(id) ON DELETE SET NULL,
    notes TEXT,
    color TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 7. SEATING LAYOUT TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_seating (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT UNIQUE REFERENCES public.classes(id) ON DELETE CASCADE,
    num_rows INTEGER NOT NULL DEFAULT 4,
    cols INTEGER DEFAULT 6,
    snapshot_name TEXT DEFAULT 'Bản chính',
    layout_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 8. COURSES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id BIGSERIAL PRIMARY KEY,
    course_name TEXT NOT NULL,
    description TEXT,
    price REAL DEFAULT 0,
    duration_weeks INTEGER,
    status TEXT CHECK(status IN ('Đang mở', 'Đã đóng')) DEFAULT 'Đang mở',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 9. STUDENT SCORES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_scores (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    test_title TEXT,
    test_date TEXT,
    score_type TEXT CHECK(score_type IN ('check_1', 'check_2', 'homework')) NOT NULL,
    score REAL,
    max_score REAL DEFAULT 10,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, class_id, score_type)
);

-- -------------------------------------------------------------------------
-- 10. CLASS ATTENDANCE & GRADES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_attendance_grades (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('Có mặt', 'Vắng mặt')) DEFAULT 'Có mặt',
    check_1 REAL DEFAULT NULL,
    check_2 REAL DEFAULT NULL,
    homework REAL DEFAULT NULL,
    mock_test REAL DEFAULT NULL,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, student_id, date)
);

-- -------------------------------------------------------------------------
-- 11. FRIEND GROUPS & RELATIONSHIPS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friend_groups (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    group_name TEXT NOT NULL,
    color_hex TEXT DEFAULT '#6366F1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.friend_group_members (
    group_id BIGINT REFERENCES public.friend_groups(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.conflict_relationships (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id1 BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    student_id2 BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (class_id, student_id1, student_id2)
);

CREATE TABLE IF NOT EXISTS public.trusted_swap_relationships (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id1 BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    student_id2 BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (class_id, student_id1, student_id2)
);

CREATE TABLE IF NOT EXISTS public.conflict_groups (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    group_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conflict_group_members (
    group_id BIGINT REFERENCES public.conflict_groups(id) ON DELETE CASCADE,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.trusted_swap_students (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (class_id, student_id)
);

-- -------------------------------------------------------------------------
-- 12. CUSTOM TIME PHASES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_time_phases (
    id BIGSERIAL PRIMARY KEY,
    phase_name TEXT NOT NULL,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE DEFAULT NULL,
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 13. ASSIGNMENTS & SUBMISSIONS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
    id BIGSERIAL PRIMARY KEY,
    class_id BIGINT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    assigned_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    max_score REAL DEFAULT 10,
    content_json TEXT DEFAULT '',
    quiz_config TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    submitted INTEGER DEFAULT 0,
    score REAL DEFAULT NULL,
    notes TEXT DEFAULT '',
    submitted_at TIMESTAMPTZ DEFAULT NULL,
    answers_json TEXT DEFAULT '',
    daily_logs TEXT DEFAULT '',
    UNIQUE(assignment_id, student_id)
);

-- -------------------------------------------------------------------------
-- 14. USERS & PERMISSIONS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_users (
    id BIGSERIAL PRIMARY KEY,
    display_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Giáo viên',
    status TEXT CHECK(status IN ('Hoạt động', 'Tạm khóa')) DEFAULT 'Hoạt động',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    tab_id TEXT NOT NULL,
    can_access INTEGER DEFAULT 1,
    UNIQUE(role, tab_id)
);

-- -------------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_date ON public.class_sessions(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_student_date ON public.class_attendance_grades(class_id, student_id, date);
CREATE INDEX IF NOT EXISTS idx_custom_time_phases_class_dates ON public.custom_time_phases(class_id, from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_assignments_class_date ON public.assignments(class_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_submissions_assign_student ON public.assignment_submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);

-- -------------------------------------------------------------------------
-- DEFAULT ADMIN SEED
-- Password hash: SHA256 of 'admin123'
-- -------------------------------------------------------------------------
INSERT INTO public.app_users (display_name, username, password_hash, role, status)
VALUES ('Quản Trị Viên', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Quản trị viên', 'Hoạt động')
ON CONFLICT (username) DO NOTHING;

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers_cm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_seating ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendance_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_swap_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_swap_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_time_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
