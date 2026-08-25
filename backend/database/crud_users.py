import hashlib
from typing import List, Dict, Any, Optional
from database.connection import get_connection

def hash_password(password: str) -> str:
    """Returns SHA-256 hash of password string."""
    if not password:
        return ""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def get_users() -> List[Dict[str, Any]]:
    """Returns list of app_users without revealing password hash."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, display_name, username, role, status, created_at, last_login
            FROM app_users
            ORDER BY id ASC
        """)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def create_user(data: Dict[str, Any]) -> int:
    """Creates a new user account."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        display_name = data.get("display_name", "").strip()
        username = data.get("username", "").strip()
        raw_password = data.get("password", "").strip()
        role = data.get("role", "Giáo viên")
        status = data.get("status", "Hoạt động")

        if not username:
            raise ValueError("Tên đăng nhập không được để trống")
        if not raw_password:
            raise ValueError("Mật khẩu không được để trống")

        pwd_hash = hash_password(raw_password)

        cursor.execute("""
            INSERT INTO app_users (display_name, username, password_hash, role, status)
            VALUES (?, ?, ?, ?, ?)
        """, (display_name or username, username, pwd_hash, role, status))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def update_user(user_id: int, data: Dict[str, Any]):
    """Updates user information, optionally updating password if provided."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        display_name = data.get("display_name", "").strip()
        username = data.get("username", "").strip()
        role = data.get("role", "Giáo viên")
        status = data.get("status", "Hoạt động")
        raw_password = data.get("password")

        if raw_password and raw_password.strip():
            pwd_hash = hash_password(raw_password.strip())
            cursor.execute("""
                UPDATE app_users
                SET display_name = ?, username = ?, role = ?, status = ?, password_hash = ?
                WHERE id = ?
            """, (display_name, username, role, status, pwd_hash, user_id))
        else:
            cursor.execute("""
                UPDATE app_users
                SET display_name = ?, username = ?, role = ?, status = ?
                WHERE id = ?
            """, (display_name, username, role, status, user_id))
        conn.commit()
    finally:
        conn.close()

def delete_user(user_id: int):
    """Deletes a user account."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM app_users WHERE id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()

# ----------------------------------------------------
# ROLE PERMISSIONS
# ----------------------------------------------------
DEFAULT_ROLES = ["Quản trị viên", "Giáo viên", "Trợ giảng", "Kế toán"]

def get_role_permissions() -> List[Dict[str, Any]]:
    """
    Returns all configured permissions for each role.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, role, tab_id, can_access FROM role_permissions")
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def save_role_permissions(permissions: List[Dict[str, Any]]):
    """
    Batch saves role permissions matrix.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        for p in permissions:
            role = p.get("role")
            tab_id = p.get("tab_id")
            can_access = 1 if p.get("can_access") in (1, True, "1", "true") else 0
            if role and tab_id:
                cursor.execute("""
                    INSERT INTO role_permissions (role, tab_id, can_access)
                    VALUES (?, ?, ?)
                    ON CONFLICT(role, tab_id) DO UPDATE SET can_access = EXCLUDED.can_access
                """, (role, tab_id, can_access))
        conn.commit()
    finally:
        conn.close()
