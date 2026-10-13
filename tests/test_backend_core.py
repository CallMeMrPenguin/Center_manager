import os
import sys
import pytest

# Ensure backend can be imported
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from database.utils import trunc_1_dec
from database.crud_scores_attendance import _parse_score
from database.crud_users import hash_password, verify_password
from services.auth_security import create_access_token, verify_access_token

def test_trunc_1_dec_strictly_no_rounding():
    """Verify single decimal truncation without rounding up or down (Rule 17)."""
    assert trunc_1_dec(6.21) == 6.2
    assert trunc_1_dec(6.28) == 6.2
    assert trunc_1_dec(8.89) == 8.8
    assert trunc_1_dec(8.81) == 8.8
    assert trunc_1_dec(0) == 0.0
    assert trunc_1_dec(10.0) == 10.0
    assert trunc_1_dec(None) == 0.0
    assert trunc_1_dec(None, allow_none=True) is None

def test_parse_score_rules():
    """Verify missing/absent grades return None (NULL) and valid scores are truncated."""
    # When present:
    assert _parse_score(8.89, is_present=True) == 8.8
    assert _parse_score("6,75", is_present=True) == 6.7
    assert _parse_score("", is_present=True) is None
    assert _parse_score(None, is_present=True) is None
    assert _parse_score("nan", is_present=True) is None
    assert _parse_score("null", is_present=True) is None

    # When absent:
    assert _parse_score(8.5, is_present=False) is None
    assert _parse_score("", is_present=False) is None

    # Out of bounds [0, 10]:
    assert _parse_score(10.5, is_present=True) is None
    assert _parse_score(-1.0, is_present=True) is None

def test_password_hashing_and_verification():
    """Verify PBKDF2 salt and hash generation."""
    pwd = "SecurePassword2026!"
    hashed = hash_password(pwd)
    assert hashed.startswith("pbkdf2:sha256:100000$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_security():
    """Verify token generation, signature integrity, and tampering detection."""
    user = {"id": 1, "username": "teacher_01", "role": "teacher"}
    token = create_access_token(user, expires_in=3600)
    assert isinstance(token, str)

    payload = verify_access_token(token)
    assert payload["username"] == "teacher_01"
    assert payload["role"] == "teacher"

    # Tampered token must fail
    tampered = token[:-4] + "ABCD"
    with pytest.raises(ValueError):
        verify_access_token(tampered)

def test_admin_password_and_users_isolation():
    """Verify admin plaintext password is never leaked and backdoor is removed."""
    from database.crud_users import get_users, authenticate_user

    # 1. Backdoor password 'admin123' must be rejected
    with pytest.raises(ValueError):
        authenticate_user("admin", "admin123")

    # 2. Check get_users output: admin plain_password must be None
    users = get_users()
    admin_user = next((u for u in users if (u.get("username") or "").lower() == "admin"), None)
    if admin_user:
        assert admin_user.get("plain_password") is None

def test_api_endpoints_and_rbac():
    """Verify FastAPI integration: role authorization and data sanitization on /api/users."""
    from fastapi.testclient import TestClient
    from main import app
    from services.auth_security import create_access_token

    client = TestClient(app)

    # 1. Student token accessing /api/users must return 403 Forbidden
    student_token = create_access_token({"id": 99, "username": "student_01", "role": "student"})
    res = client.get("/api/users", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

    # 2. Admin token accessing /api/users must return 200 OK
    admin_token = create_access_token({"id": 1, "username": "admin", "role": "admin"})
    res = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    for u in data:
        if (u.get("username") or "").lower() == "admin":
            assert u.get("plain_password") is None

def test_modular_compiler_import_and_helpers():
    """Verify that the modularized compiler package exports classes and functions seamlessly."""
    from services.compiler import (
        WordDocumentCompiler,
        get_instruction_map,
        normalize_input_exercises,
        clean_option_text,
        cm_to_pt
    )
    assert WordDocumentCompiler is not None
    instructions = get_instruction_map()
    assert isinstance(instructions, dict)
    assert "pr" in instructions
    assert cm_to_pt(2.54) > 0
    assert clean_option_text("A. Hello world") == "Hello world"
    normalized = normalize_input_exercises([{"t": "mcq", "q": "1", "o": ["A", "B"]}])
    assert isinstance(normalized, list)
    assert len(normalized) == 1

def test_system_and_compiler_routes():
    """Verify that system.py and system_compiler.py routes are reachable via FastAPI client."""
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    # Check version endpoint
    res = client.get("/api/system/version")
    assert res.status_code == 200
    assert "boot_time" in res.json()

    # Check profiles endpoint
    res_prof = client.get("/api/profiles")
    assert res_prof.status_code == 200
    assert isinstance(res_prof.json(), dict)

def test_assignment_and_analytics_decimal_truncation():
    """Verify that assignment metrics and analytics attendance/performance never round up."""
    from database.crud_assignments import get_assignments
    from database.analytics_engine import calculate_performance_analytics

    # 1. Check trunc_1_dec on edge score calculations
    assert trunc_1_dec(6.28) == 6.2
    assert trunc_1_dec(7.89) == 7.8
    assert trunc_1_dec(9.99) == 9.9
    assert trunc_1_dec(85.67) == 85.6

    # 2. Check analytics engine output on sample records
    res = calculate_performance_analytics([])
    assert res["att_pct"] == 100.0
    assert res["performance_index"] == 0.0

    # 2. Check get_assignments runs cleanly
    assignments = get_assignments()
    assert isinstance(assignments, list)
    for a in assignments:
        if a.get("avg_score") is not None:
            # Must have at most 1 decimal place and match trunc_1_dec
            assert a["avg_score"] == trunc_1_dec(a["avg_score"])
        if a.get("submission_rate") is not None:
            assert a["submission_rate"] == trunc_1_dec(a["submission_rate"])

def test_security_hardening():
    """Verify security controls: 401 on unauthenticated access, 403 on student access, and tombstone table whitelist."""
    from fastapi.testclient import TestClient
    from main import app
    from services.http_sync import ALLOWED_SYNC_TABLES

    client = TestClient(app)

    # 1. Unauthenticated GET /api/users MUST return 401 Unauthorized
    res = client.get("/api/users")
    assert res.status_code == 401

    # 2. Tombstone table whitelist must contain valid tables and reject malicious injection attempts
    assert "students" in ALLOWED_SYNC_TABLES
    assert "classes" in ALLOWED_SYNC_TABLES
    assert "sqlite_master" not in ALLOWED_SYNC_TABLES
    assert "app_users; DROP TABLE students;" not in ALLOWED_SYNC_TABLES

def test_tombstone_engine_composite_keys():
    """Verify that sync_tombstones engine correctly applies deletions for composite keys and protects against resurrection."""
    import sqlite3
    from services.sync_tombstones import apply_tombstone, is_row_tombstoned, load_tombstone_set

    conn = sqlite3.connect(":memory:")
    cur = conn.cursor()

    cur.execute("CREATE TABLE class_sessions (id INTEGER PRIMARY KEY, class_id INT, date TEXT, start_time TEXT)")
    cur.execute("CREATE TABLE class_attendance_grades (class_id INT, student_id INT, date TEXT, status TEXT)")
    cur.execute("CREATE TABLE class_schedule_weekly (id INTEGER PRIMARY KEY, class_id INT, day_of_week TEXT)")
    cur.execute("CREATE TABLE class_students (class_id INT, student_id INT, seat_color TEXT)")
    cur.execute("CREATE TABLE _sync_tombstones (table_name TEXT, record_id TEXT, deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (table_name, record_id))")

    # Insert test data
    cur.execute("INSERT INTO class_sessions VALUES (10, 5, '2026-10-21', '06:00')")
    cur.execute("INSERT INTO class_attendance_grades VALUES (5, 1, '2026-10-21', 'Có mặt')")
    cur.execute("INSERT INTO class_schedule_weekly VALUES (20, 5, 'Thứ 4')")
    cur.execute("INSERT INTO class_students VALUES (5, 99, '#ff0000')")
    conn.commit()

    # 1. Apply composite tombstone on class_sessions
    assert apply_tombstone(cur, "class_sessions", "5:2026-10-21") is True
    cur.execute("SELECT COUNT(*) FROM class_sessions WHERE class_id = 5 AND date = '2026-10-21'")
    assert cur.fetchone()[0] == 0

    # 2. Apply composite tombstone on class_attendance_grades
    assert apply_tombstone(cur, "class_attendance_grades", "5:2026-10-21") is True
    cur.execute("SELECT COUNT(*) FROM class_attendance_grades WHERE class_id = 5 AND date = '2026-10-21'")
    assert cur.fetchone()[0] == 0

    # 3. Apply composite tombstone on class_schedule_weekly
    assert apply_tombstone(cur, "class_schedule_weekly", "5:Thứ 4") is True
    cur.execute("SELECT COUNT(*) FROM class_schedule_weekly WHERE class_id = 5 AND day_of_week = 'Thứ 4'")
    assert cur.fetchone()[0] == 0

    # 4. Apply composite tombstone on class_students
    assert apply_tombstone(cur, "class_students", "5:99") is True
    cur.execute("SELECT COUNT(*) FROM class_students WHERE class_id = 5 AND student_id = 99")
    assert cur.fetchone()[0] == 0

    # 5. Anti-resurrection guard test
    cur.execute("INSERT INTO _sync_tombstones (table_name, record_id) VALUES ('class_sessions', '5:2026-10-21')")
    cur.execute("INSERT INTO _sync_tombstones (table_name, record_id) VALUES ('class_schedule_weekly', '5:Thứ 4')")
    conn.commit()

    ts_set = load_tombstone_set(cur)
    assert is_row_tombstoned("class_sessions", {"id": 10, "class_id": 5, "date": "2026-10-21"}, ts_set) is True
    assert is_row_tombstoned("class_sessions", {"id": 11, "class_id": 5, "date": "2026-10-22"}, ts_set) is False
    assert is_row_tombstoned("class_schedule_weekly", {"id": 20, "class_id": 5, "day_of_week": "Thứ 4"}, ts_set) is True
    assert is_row_tombstoned("class_schedule_weekly", {"id": 21, "class_id": 5, "day_of_week": "Thứ 5"}, ts_set) is False



