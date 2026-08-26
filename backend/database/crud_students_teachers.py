from typing import List, Dict, Any, Optional
from database.connection import get_connection

# ----------------------------------------------------
# CENTER MANAGER — STUDENTS CRUD
# ----------------------------------------------------
def get_students(search: str = "", status: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = """
            SELECT s.*, GROUP_CONCAT(c.class_name, ', ') as enrolled_classes
            FROM students s
            LEFT JOIN class_students cs ON s.id = cs.student_id
            LEFT JOIN classes c ON cs.class_id = c.id
            WHERE 1=1
        """
        params = []
        if search:
            query += " AND (s.full_name LIKE ? OR s.nickname LIKE ? OR s.school LIKE ? OR s.father_phone LIKE ? OR s.mother_phone LIKE ?)"
            pattern = f"%{search}%"
            params.extend([pattern, pattern, pattern, pattern, pattern])
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
            username = f"hs_{new_id:04d}"
            from database.crud_users import hash_password
            pwd_hash = hash_password("123456")
            user_status = "Hoạt động" if data.get("status") != "Đã nghỉ" else "Tạm khóa"
            try:
                cursor.execute("""
                    INSERT INTO app_users (display_name, username, password_hash, role, status)
                    VALUES (?, ?, ?, 'Học sinh', ?)
                    ON CONFLICT(username) DO UPDATE SET display_name = EXCLUDED.display_name, status = EXCLUDED.status
                """, (full_name, username, pwd_hash, user_status))
                conn.commit()
            except Exception as e:
                print(f"[Student CRUD] Auto create user notice: {e}")

            try:
                from services.supabase_auth_service import sync_create_supabase_user
                sync_create_supabase_user(username, "123456", full_name, "Học sinh")
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
        username = f"hs_{student_id:04d}"
        user_status = "Hoạt động" if new_status != "Đã nghỉ" else "Tạm khóa"
        if new_full_name:
            try:
                cursor.execute("""
                    UPDATE app_users
                    SET display_name = ?, status = ?
                    WHERE username = ?
                """, (new_full_name, user_status, username))
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
            cursor.execute("DELETE FROM app_users WHERE username = ?", (username,))
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
        query = "SELECT * FROM teachers_cm WHERE 1=1"
        params = []
        if search:
            query += " AND (full_name LIKE ? OR phone LIKE ?)"
            pattern = f"%{search}%"
            params.extend([pattern, pattern])
        if role:
            query += " AND role = ?"
            params.append(role)
        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def create_teacher_cm(data: Dict[str, Any]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO teachers_cm (full_name, role, date_of_birth, phone, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data.get("full_name"), data.get("role", "Giáo viên"),
            data.get("date_of_birth"), data.get("phone"), data.get("notes")
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def update_teacher_cm(teacher_id: int, data: Dict[str, Any]):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE teachers_cm SET
                full_name = ?, role = ?, date_of_birth = ?, phone = ?, notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            data.get("full_name"), data.get("role"), data.get("date_of_birth"),
            data.get("phone"), data.get("notes"), teacher_id
        ))
        conn.commit()
    finally:
        conn.close()

def delete_teacher_cm(teacher_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM teachers_cm WHERE id = ?", (teacher_id,))
        conn.commit()
    finally:
        conn.close()
