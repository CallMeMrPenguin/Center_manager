from typing import List, Dict, Any, Optional
from database.connection import get_connection
from database.crud_users import hash_password

# ----------------------------------------------------
# CENTER MANAGER — STUDENTS CRUD
# ----------------------------------------------------
def get_students(search: str = "", status: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = """
            SELECT s.*, 
                   GROUP_CONCAT(DISTINCT c.class_name) as enrolled_classes,
                   MAX(u.username) as account_username,
                   MAX(u.status) as account_status,
                   MAX(u.role) as account_role,
                   MAX(u.last_login) as account_last_login
            FROM students s
            LEFT JOIN class_students cs ON s.id = cs.student_id
            LEFT JOIN classes c ON cs.class_id = c.id
            LEFT JOIN app_users u ON (
                LOWER(u.username) = LOWER('hs_' || printf('%04d', s.id))
                OR (u.role = 'Học sinh' AND LOWER(TRIM(u.display_name)) = LOWER(TRIM(s.full_name)))
            )
            WHERE 1=1
        """
        params = []
        if search:
            query += " AND (s.full_name LIKE ? OR s.nickname LIKE ? OR s.school LIKE ? OR s.father_phone LIKE ? OR s.mother_phone LIKE ? OR u.username LIKE ?)"
            pattern = f"%{search}%"
            params.extend([pattern, pattern, pattern, pattern, pattern, pattern])
        if status:
            query += " AND s.status = ?"
            params.append(status)
        query += " GROUP BY s.id ORDER BY s.id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def create_student(data: Dict[str, Any]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        full_name = str(data.get("full_name") or "").strip()
        if not full_name:
            raise ValueError("Vui lòng nhập họ và tên học sinh.")

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
        new_id = cursor.lastrowid

        # Auto-create corresponding app_user account and sync with Supabase Auth
        if new_id:
            custom_user = str(data.get("account_username") or "").strip()
            username = custom_user if custom_user else f"hs_{new_id:04d}"
            raw_pwd = str(data.get("account_password") or "").strip() or "123456"
            pwd_hash = hash_password(raw_pwd)
            user_status = data.get("account_status") or ("Hoạt động" if data.get("status") != "Đã nghỉ" else "Tạm khóa")
            try:
                cursor.execute("""
                    INSERT INTO app_users (display_name, username, password_hash, role, status)
                    VALUES (?, ?, ?, 'Học sinh', ?)
                    ON CONFLICT(username) DO UPDATE SET 
                        display_name = EXCLUDED.display_name, 
                        password_hash = EXCLUDED.password_hash,
                        status = EXCLUDED.status
                """, (full_name, username, pwd_hash, user_status))
                conn.commit()
            except Exception as e:
                print(f"[Student CRUD] Auto create user notice: {e}")

            try:
                from services.supabase_auth_service import sync_create_supabase_user
                sync_create_supabase_user(username, raw_pwd, full_name, "Học sinh")
            except Exception as e:
                print(f"[Supabase Auth] Sync student create warning: {e}")

        return new_id
    finally:
        conn.close()

def update_student(student_id: int, data: Dict[str, Any]):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        new_full_name = data.get("full_name")
        new_status = data.get("status")

        cursor.execute("""
            UPDATE students SET
                full_name = ?, nickname = ?, gender = ?, grade = ?, date_of_birth = ?, enroll_date = ?, school = ?, status = ?,
                father_name = ?, father_phone = ?, mother_name = ?, mother_phone = ?, address = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            new_full_name, data.get("nickname", ""), data.get("gender"), data.get("grade", "Lớp 6"), data.get("date_of_birth"),
            data.get("enroll_date"), data.get("school"), new_status,
            data.get("father_name"), data.get("father_phone"), data.get("mother_name"),
            data.get("mother_phone"), data.get("address"), data.get("notes"),
            student_id
        ))
        conn.commit()

        # Auto-update corresponding app_user account and sync to Supabase Auth
        custom_user = str(data.get("account_username") or "").strip()
        default_user = f"hs_{student_id:04d}"
        username = custom_user if custom_user else default_user
        user_status = data.get("account_status") or ("Hoạt động" if new_status != "Đã nghỉ" else "Tạm khóa")
        raw_pwd = str(data.get("account_password") or "").strip()

        if new_full_name:
            try:
                if raw_pwd:
                    pwd_hash = hash_password(raw_pwd)
                    cursor.execute("""
                        INSERT INTO app_users (display_name, username, password_hash, role, status)
                        VALUES (?, ?, ?, 'Học sinh', ?)
                        ON CONFLICT(username) DO UPDATE SET 
                            display_name = EXCLUDED.display_name,
                            password_hash = EXCLUDED.password_hash,
                            status = EXCLUDED.status
                    """, (new_full_name, username, pwd_hash, user_status))
                else:
                    cursor.execute("""
                        INSERT INTO app_users (display_name, username, password_hash, role, status)
                        VALUES (?, ?, ?, 'Học sinh', ?)
                        ON CONFLICT(username) DO UPDATE SET 
                            display_name = EXCLUDED.display_name,
                            status = EXCLUDED.status
                    """, (new_full_name, username, hash_password("123456"), user_status))
                conn.commit()
            except Exception as e:
                print(f"[Student CRUD] Auto update user notice: {e}")

            try:
                from services.supabase_auth_service import sync_update_supabase_user
                sync_update_supabase_user(username, display_name=new_full_name, role="Học sinh")
            except Exception as e:
                print(f"[Supabase Auth] Sync student update warning: {e}")
    finally:
        conn.close()

def delete_student(student_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        username = f"hs_{student_id:04d}"
        cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
        try:
            cursor.execute("DELETE FROM app_users WHERE username = ? OR username = (SELECT username FROM app_users WHERE display_name = (SELECT full_name FROM students WHERE id = ?))", (username, student_id))
        except Exception:
            pass
        conn.commit()

        try:
            from services.supabase_auth_service import sync_delete_supabase_user
            sync_delete_supabase_user(username)
        except Exception as e:
            print(f"[Supabase Auth] Sync student delete warning: {e}")
    finally:
        conn.close()

# ----------------------------------------------------
# CENTER MANAGER — TEACHERS CRUD
# ----------------------------------------------------
def get_teachers_cm(search: str = "", role: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = """
            SELECT t.*,
                   MAX(u.username) as account_username,
                   MAX(u.status) as account_status,
                   MAX(u.role) as account_role,
                   MAX(u.last_login) as account_last_login
            FROM teachers_cm t
            LEFT JOIN app_users u ON (
                LOWER(u.username) = LOWER('gv_' || printf('%04d', t.id))
                OR (t.phone IS NOT NULL AND t.phone != '' AND LOWER(u.username) = LOWER(t.phone))
                OR (u.role IN ('Giáo viên', 'Trợ giảng', 'Quản trị viên') AND LOWER(TRIM(u.display_name)) = LOWER(TRIM(t.full_name)))
            )
            WHERE 1=1
        """
        params = []
        if search:
            query += " AND (t.full_name LIKE ? OR t.phone LIKE ? OR u.username LIKE ?)"
            pattern = f"%{search}%"
            params.extend([pattern, pattern, pattern])
        if role:
            query += " AND t.role = ?"
            params.append(role)
        query += " GROUP BY t.id ORDER BY t.id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def create_teacher_cm(data: Dict[str, Any]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        full_name = str(data.get("full_name") or "").strip()
        role = data.get("role", "Giáo viên")
        phone = data.get("phone", "")

        cursor.execute("""
            INSERT INTO teachers_cm (full_name, role, date_of_birth, phone, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (
            full_name, role, data.get("date_of_birth"), phone, data.get("notes")
        ))
        conn.commit()
        new_id = cursor.lastrowid

        # Auto-create or link corresponding app_user account
        if new_id:
            custom_user = str(data.get("account_username") or "").strip()
            username = custom_user if custom_user else f"gv_{new_id:04d}"
            raw_pwd = str(data.get("account_password") or "").strip() or "123456"
            pwd_hash = hash_password(raw_pwd)
            user_status = data.get("account_status") or "Hoạt động"
            account_role = data.get("account_role") or role

            try:
                cursor.execute("""
                    INSERT INTO app_users (display_name, username, password_hash, role, status)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(username) DO UPDATE SET 
                        display_name = EXCLUDED.display_name,
                        password_hash = EXCLUDED.password_hash,
                        role = EXCLUDED.role,
                        status = EXCLUDED.status
                """, (full_name, username, pwd_hash, account_role, user_status))
                conn.commit()
            except Exception as e:
                print(f"[Teacher CRUD] Auto create user notice: {e}")

            try:
                from services.supabase_auth_service import sync_create_supabase_user
                sync_create_supabase_user(username, raw_pwd, full_name, account_role)
            except Exception as e:
                print(f"[Supabase Auth] Sync teacher create warning: {e}")

        return new_id
    finally:
        conn.close()

def update_teacher_cm(teacher_id: int, data: Dict[str, Any]):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        full_name = str(data.get("full_name") or "").strip()
        role = data.get("role", "Giáo viên")
        phone = data.get("phone", "")

        cursor.execute("""
            UPDATE teachers_cm SET
                full_name = ?, role = ?, date_of_birth = ?, phone = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            full_name, role, data.get("date_of_birth"), phone, data.get("notes"), teacher_id
        ))
        conn.commit()

        # Update corresponding app_user account
        custom_user = str(data.get("account_username") or "").strip()
        default_user = f"gv_{teacher_id:04d}"
        username = custom_user if custom_user else default_user
        raw_pwd = str(data.get("account_password") or "").strip()
        user_status = data.get("account_status") or "Hoạt động"
        account_role = data.get("account_role") or role

        try:
            if raw_pwd:
                pwd_hash = hash_password(raw_pwd)
                cursor.execute("""
                    INSERT INTO app_users (display_name, username, password_hash, role, status)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(username) DO UPDATE SET 
                        display_name = EXCLUDED.display_name,
                        password_hash = EXCLUDED.password_hash,
                        role = EXCLUDED.role,
                        status = EXCLUDED.status
                """, (full_name, username, pwd_hash, account_role, user_status))
            else:
                cursor.execute("""
                    INSERT INTO app_users (display_name, username, password_hash, role, status)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(username) DO UPDATE SET 
                        display_name = EXCLUDED.display_name,
                        role = EXCLUDED.role,
                        status = EXCLUDED.status
                """, (full_name, username, hash_password("123456"), account_role, user_status))
            conn.commit()
        except Exception as e:
            print(f"[Teacher CRUD] Auto update user notice: {e}")

        try:
            from services.supabase_auth_service import sync_update_supabase_user
            sync_update_supabase_user(username, display_name=full_name, role=account_role)
        except Exception as e:
            print(f"[Supabase Auth] Sync teacher update warning: {e}")
    finally:
        conn.close()

def delete_teacher_cm(teacher_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        username = f"gv_{teacher_id:04d}"
        cursor.execute("DELETE FROM teachers_cm WHERE id = ?", (teacher_id,))
        try:
            cursor.execute("DELETE FROM app_users WHERE username = ?", (username,))
        except Exception:
            pass
        conn.commit()

        try:
            from services.supabase_auth_service import sync_delete_supabase_user
            sync_delete_supabase_user(username)
        except Exception as e:
            print(f"[Supabase Auth] Sync teacher delete warning: {e}")
    finally:
        conn.close()
