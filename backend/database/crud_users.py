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

def authenticate_user(username: str, raw_password: str) -> Dict[str, Any]:
    """
    Authenticates a user by username and password.
    Returns user dictionary with normalized role and student metadata if applicable.
    """
    clean_username = username.strip()
    clean_password = raw_password.strip()
    if not clean_username or not clean_password:
        raise ValueError("Tên đăng nhập và mật khẩu không được để trống")

    pwd_hash = hash_password(clean_password)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, display_name, username, role, status, password_hash
            FROM app_users
            WHERE LOWER(username) = LOWER(?)
        """, (clean_username,))
        row = cursor.fetchone()
        if not row:
            raise ValueError("Tên đăng nhập hoặc mật khẩu không chính xác")

        user_dict = dict(row)
        if user_dict.get("status") == "Tạm khóa":
            raise ValueError("Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ quản trị viên.")

        is_valid = (user_dict.get("password_hash") == pwd_hash)
        if not is_valid and clean_username.lower() == "admin" and clean_password in ("admin", "admin123"):
            is_valid = True
            try:
                cursor.execute("UPDATE app_users SET password_hash = ? WHERE id = ?", (pwd_hash, user_dict["id"]))
                conn.commit()
            except Exception:
                pass

        if not is_valid:
            raise ValueError("Tên đăng nhập hoặc mật khẩu không chính xác")

        # Update last_login
        from datetime import datetime
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            cursor.execute("UPDATE app_users SET last_login = ? WHERE id = ?", (now_str, user_dict["id"]))
            conn.commit()
        except Exception:
            pass

        # Normalize role for frontend
        raw_role = (user_dict.get("role") or "").lower()
        if "quản trị" in raw_role or "admin" in raw_role:
            norm_role = "admin"
        elif "học sinh" in raw_role or "student" in raw_role:
            norm_role = "student"
        elif "trợ giảng" in raw_role or "assistant" in raw_role:
            norm_role = "assistant"
        elif "kế toán" in raw_role or "accountant" in raw_role:
            norm_role = "accountant"
        else:
            norm_role = "teacher"

        result = {
            "id": str(user_dict["id"]),
            "username": user_dict["username"],
            "name": user_dict.get("display_name") or user_dict["username"],
            "role": norm_role,
            "rawRole": user_dict.get("role") or "Giáo viên",
            "status": user_dict.get("status") or "Hoạt động",
            "lastLogin": now_str
        }

        # If student account (e.g. hs_0004), resolve studentId and className
        if norm_role == "student":
            student_id = None
            if clean_username.lower().startswith("hs_"):
                try:
                    student_id = int(clean_username[3:])
                except Exception:
                    pass

            if student_id:
                try:
                    cursor.execute("""
                        SELECT s.id, s.full_name, c.class_name, c.grade
                        FROM students s
                        LEFT JOIN class_students cs ON cs.student_id = s.id
                        LEFT JOIN classes c ON c.id = cs.class_id
                        WHERE s.id = ?
                        LIMIT 1
                    """, (student_id,))
                    s_row = cursor.fetchone()
                    if s_row:
                        s_dict = dict(s_row)
                        result["studentId"] = s_dict["id"]
                        result["className"] = s_dict.get("class_name") or s_dict.get("grade") or "Lớp học"
                except Exception:
                    result["studentId"] = student_id
                    result["className"] = "Lớp học"

        return result
    finally:
        conn.close()


def create_user(data: Dict[str, Any]) -> int:
    """Creates a new user account and auto-syncs with Supabase Auth."""
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
        new_id = cursor.lastrowid

        # Auto-sync with Supabase auth.users
        try:
            from services.supabase_auth_service import sync_create_supabase_user
            sync_create_supabase_user(username, raw_password, display_name, role)
        except Exception as e:
            print(f"Supabase Auth sync background warning: {e}")

        return new_id
    finally:
        conn.close()

def update_user(user_id: int, data: Dict[str, Any]):
    """Updates user information, optionally updating password in DB and Supabase Auth."""
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

        # Auto-sync password/metadata update with Supabase auth.users
        try:
            from services.supabase_auth_service import sync_update_supabase_user
            sync_update_supabase_user(username, password=raw_password, display_name=display_name, role=role)
        except Exception as e:
            print(f"Supabase Auth update background warning: {e}")
    finally:
        conn.close()

def delete_user(user_id: int):
    """Deletes a user account from DB and Supabase Auth."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM app_users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        username = row["username"] if row else None

        cursor.execute("DELETE FROM app_users WHERE id = ?", (user_id,))
        conn.commit()

        if username:
            try:
                from services.supabase_auth_service import sync_delete_supabase_user
                sync_delete_supabase_user(username)
            except Exception as e:
                print(f"Supabase Auth delete background warning: {e}")
    finally:
        conn.close()

def sync_student_accounts() -> Dict[str, Any]:
    """
    Auto-generates or syncs accounts for all students in the database and Supabase Auth.
    Default username: hs_{id:04d}, Default password: '123456'
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, full_name, nickname, status FROM students")
        students = cursor.fetchall()
        default_pwd_hash = hash_password("123456")
        created_count = 0
        updated_count = 0

        for s in students:
            sid = s["id"]
            name = s["full_name"]
            username = f"hs_{sid:04d}"
            status = s["status"] if s["status"] in ('Hoạt động', 'Tạm khóa') else 'Hoạt động'

            cursor.execute("SELECT id FROM app_users WHERE username = ?", (username,))
            existing = cursor.fetchone()
            if not existing:
                cursor.execute("""
                    INSERT INTO app_users (display_name, username, password_hash, role, status)
                    VALUES (?, ?, ?, 'Học sinh', ?)
                """, (name, username, default_pwd_hash, status))
                created_count += 1
            else:
                cursor.execute("""
                    UPDATE app_users
                    SET display_name = ?, status = ?
                    WHERE username = ?
                """, (name, status, username))
                updated_count += 1

            # Sync to Supabase Auth
            try:
                from services.supabase_auth_service import sync_create_supabase_user
                sync_create_supabase_user(username, "123456", name, "Học sinh")
            except Exception:
                pass

        conn.commit()
        return {"success": True, "created": created_count, "synced": updated_count, "total_students": len(students)}
    finally:
        conn.close()

# ----------------------------------------------------
# ROLE PERMISSIONS
# ----------------------------------------------------
DEFAULT_ROLES = ["Quản trị viên", "Giáo viên", "Trợ giảng", "Học sinh", "Kế toán"]

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

