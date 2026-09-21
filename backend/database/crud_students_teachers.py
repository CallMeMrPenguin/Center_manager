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

        # Auto-create corresponding app_user account
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

        # If student is set to inactive ('Đã nghỉ', 'Nghỉ', 'Nghỉ học', 'Tạm nghỉ'), auto-unenroll from all active classes
        if new_status in ("Đã nghỉ", "Nghỉ", "Nghỉ học", "Tạm nghỉ"):
            try:
                cursor.execute("DELETE FROM class_students WHERE student_id = ?", (student_id,))
                cursor.execute("DELETE FROM friend_group_members WHERE student_id = ?", (student_id,))
                cursor.execute("DELETE FROM conflict_group_members WHERE student_id = ?", (student_id,))
                conn.commit()
            except Exception as e:
                print(f"[Student CRUD] Auto-unenroll inactive student notice: {e}")

        # Auto-update corresponding app_user account
        custom_user = str(data.get("account_username") or "").strip()
        default_user = f"hs_{student_id:04d}"
        username = custom_user if custom_user else default_user
        user_status = data.get("account_status") or ("Hoạt động" if new_status not in ("Đã nghỉ", "Nghỉ", "Nghỉ học") else "Tạm khóa")
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


    finally:
        conn.close()

def delete_student(student_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT full_name FROM students WHERE id = ?", (student_id,))
        row = cursor.fetchone()
        full_name = row["full_name"] if row else ""

        username = f"hs_{student_id:04d}"
        cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
        cursor.execute("DELETE FROM class_students WHERE student_id = ?", (student_id,))
        cursor.execute("DELETE FROM friend_group_members WHERE student_id = ?", (student_id,))
        cursor.execute("DELETE FROM conflict_group_members WHERE student_id = ?", (student_id,))
        cursor.execute("DELETE FROM trusted_swap_students WHERE student_id = ?", (student_id,))
        cursor.execute("DELETE FROM conflict_relationships WHERE student_id1 = ? OR student_id2 = ?", (student_id, student_id))
        cursor.execute("DELETE FROM trusted_swap_relationships WHERE student_id1 = ? OR student_id2 = ?", (student_id, student_id))

        # Clear student from all class seating layouts
        try:
            cursor.execute("SELECT id, layout_json FROM class_seating WHERE layout_json LIKE ?", (f'%{student_id}%',))
            for s_row in cursor.fetchall():
                sid = s_row["id"] if hasattr(s_row, "__getitem__") else s_row[0]
                raw_json = s_row["layout_json"] if hasattr(s_row, "__getitem__") else s_row[1]
                if raw_json:
                    import json
                    grid = json.loads(raw_json)
                    mod = False
                    for col in grid:
                        for st in col.get("seats", []):
                            if st.get("student_id") == student_id:
                                st["student_id"] = None
                                st["student_name"] = None
                                mod = True
                    if mod:
                        cursor.execute("UPDATE class_seating SET layout_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (json.dumps(grid, ensure_ascii=False), sid))
        except Exception:
            pass

        try:
            if full_name:
                cursor.execute("""
                    DELETE FROM app_users 
                    WHERE username = ? 
                       OR (role = 'Học sinh' AND LOWER(TRIM(display_name)) = LOWER(TRIM(?)))
                """, (username, full_name))
            else:
                cursor.execute("DELETE FROM app_users WHERE username = ?", (username,))
        except Exception:
            pass
        conn.commit()


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
    finally:
        conn.close()
