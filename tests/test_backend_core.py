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

