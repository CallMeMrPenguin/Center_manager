from typing import List, Dict, Any, Optional
from database.connection import get_connection

# ----------------------------------------------------
# FRIEND GROUPS, CONFLICTS & TRUSTED SWAPS
# ----------------------------------------------------
def get_friend_groups(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM friend_groups WHERE class_id = ? ORDER BY id ASC", (class_id,))
        groups = [dict(g) for g in cursor.fetchall()]
        if not groups:
            return []

        cursor.execute("""
            SELECT fgm.group_id, fgm.student_id, s.full_name
            FROM friend_group_members fgm
            JOIN students s ON fgm.student_id = s.id
            WHERE fgm.class_id = ?
            ORDER BY s.full_name ASC
        """, (class_id,))
        members_rows = cursor.fetchall()
        members_by_group: Dict[int, List[Dict[str, Any]]] = {}
        for m in members_rows:
            members_by_group.setdefault(m["group_id"], []).append({
                "student_id": m["student_id"],
                "full_name": m["full_name"]
            })

        for g in groups:
            g["members"] = members_by_group.get(g["id"], [])

        return groups
    finally:
        conn.close()

def create_friend_group(class_id: int, group_name: str, color_hex: str = '#6366F1') -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO friend_groups (class_id, group_name, color_hex)
            VALUES (?, ?, ?)
        """, (class_id, group_name, color_hex))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def delete_friend_group(group_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM friend_groups WHERE id = ?", (group_id,))
        conn.commit()
    finally:
        conn.close()

def add_member_to_group(group_id: int, student_id: int, class_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO friend_group_members (group_id, student_id, class_id)
            VALUES (?, ?, ?)
            ON CONFLICT(class_id, student_id) DO UPDATE SET group_id = EXCLUDED.group_id
        """, (group_id, student_id, class_id))
        conn.commit()
    finally:
        conn.close()

def remove_member_from_group(class_id: int, student_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM friend_group_members WHERE class_id = ? AND student_id = ?", (class_id, student_id))
        conn.commit()
    finally:
        conn.close()

def get_student_group(class_id: int, student_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT fg.*
            FROM friend_group_members fgm
            JOIN friend_groups fg ON fgm.group_id = fg.id
            WHERE fgm.class_id = ? AND fgm.student_id = ?
        """, (class_id, student_id))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_conflict_pairs(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT cr.id, cr.class_id, cr.student_id1, s1.full_name as student_name1,
                   cr.student_id2, s2.full_name as student_name2
            FROM conflict_relationships cr
            JOIN students s1 ON cr.student_id1 = s1.id
            JOIN students s2 ON cr.student_id2 = s2.id
            WHERE cr.class_id = ?
            ORDER BY cr.id DESC
        """, (class_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def add_conflict_pair(class_id: int, s1: int, s2: int) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        id1, id2 = min(s1, s2), max(s1, s2)
        cursor.execute("""
            INSERT INTO conflict_relationships (class_id, student_id1, student_id2)
            VALUES (?, ?, ?)
            ON CONFLICT(class_id, student_id1, student_id2) DO NOTHING
        """, (class_id, id1, id2))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def remove_conflict_pair(conflict_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM conflict_relationships WHERE id = ?", (conflict_id,))
        conn.commit()
    finally:
        conn.close()

def get_trusted_swap_pairs(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ts.id, ts.class_id, ts.student_id1, s1.full_name as student_name1,
                   ts.student_id2, s2.full_name as student_name2
            FROM trusted_swap_relationships ts
            JOIN students s1 ON ts.student_id1 = s1.id
            JOIN students s2 ON ts.student_id2 = s2.id
            WHERE ts.class_id = ?
            ORDER BY ts.id DESC
        """, (class_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def add_trusted_swap_pair(class_id: int, s1: int, s2: int) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        id1, id2 = min(s1, s2), max(s1, s2)
        cursor.execute("""
            INSERT INTO trusted_swap_relationships (class_id, student_id1, student_id2)
            VALUES (?, ?, ?)
            ON CONFLICT(class_id, student_id1, student_id2) DO NOTHING
        """, (class_id, id1, id2))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def remove_trusted_swap_pair(swap_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trusted_swap_relationships WHERE id = ?", (swap_id,))
        conn.commit()
    finally:
        conn.close()

# --- CONFLICT GROUPS ---
def get_conflict_groups(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM conflict_groups WHERE class_id = ? ORDER BY id ASC", (class_id,))
        groups = [dict(r) for r in cursor.fetchall()]
        if not groups:
            return []

        cursor.execute("""
            SELECT cgm.group_id, cgm.student_id, s.full_name
            FROM conflict_group_members cgm
            JOIN students s ON cgm.student_id = s.id
            WHERE cgm.class_id = ?
            ORDER BY s.full_name ASC
        """, (class_id,))
        members_rows = cursor.fetchall()
        members_by_group: Dict[int, List[Dict[str, Any]]] = {}
        for m in members_rows:
            members_by_group.setdefault(m["group_id"], []).append({
                "student_id": m["student_id"],
                "full_name": m["full_name"]
            })

        for g in groups:
            g["members"] = members_by_group.get(g["id"], [])

        return groups
    finally:
        conn.close()

def create_conflict_group(class_id: int, group_name: str) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO conflict_groups (class_id, group_name) VALUES (?, ?)", (class_id, group_name))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def delete_conflict_group(group_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM conflict_groups WHERE id = ?", (group_id,))
        conn.commit()
    finally:
        conn.close()

def add_member_to_conflict_group(group_id: int, student_id: int, class_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO conflict_group_members (group_id, student_id, class_id)
            VALUES (?, ?, ?)
            ON CONFLICT(class_id, student_id) DO UPDATE SET group_id = EXCLUDED.group_id
        """, (group_id, student_id, class_id))
        conn.commit()
    finally:
        conn.close()

def remove_member_from_conflict_group(class_id: int, student_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM conflict_group_members WHERE class_id = ? AND student_id = ?", (class_id, student_id))
        conn.commit()
    finally:
        conn.close()

# --- TRUSTED SWAP INDIVIDUALS ---
def get_trusted_swap_students(class_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT tss.id, tss.class_id, tss.student_id, s.full_name as student_name, s.gender
            FROM trusted_swap_students tss
            JOIN students s ON tss.student_id = s.id
            WHERE tss.class_id = ?
            ORDER BY tss.id DESC
        """, (class_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def add_trusted_swap_student(class_id: int, student_id: int) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO trusted_swap_students (class_id, student_id)
            VALUES (?, ?)
            ON CONFLICT(class_id, student_id) DO NOTHING
        """, (class_id, student_id))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def remove_trusted_swap_student(class_id: int, student_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trusted_swap_students WHERE class_id = ? AND student_id = ?", (class_id, student_id))
        conn.commit()
    finally:
        conn.close()
