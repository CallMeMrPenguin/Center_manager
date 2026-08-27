from typing import List, Dict, Any, Optional
from database.connection import get_connection

# ----------------------------------------------------
# QUESTION BANK OPERATIONS
# ----------------------------------------------------
def insert_questions(questions: List[Dict[str, Any]]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        sql = """
        INSERT INTO question_bank (
            grade, unit, test_type, question_text, question_type, 
            option_1, option_2, option_3, option_4, answer, level, frequency
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        data = []
        for q in questions:
            meta = q.get("meta") or {}
            opts = q.get("o") or []
            opt1 = opts[0] if len(opts) > 0 else ""
            opt2 = opts[1] if len(opts) > 1 else ""
            opt3 = opts[2] if len(opts) > 2 else ""
            opt4 = opts[3] if len(opts) > 3 else ""
            
            qtype = q.get("t", q.get("question_type", ""))
            if str(qtype).lower() in ["wf", "word form", "wordform"]:
                qtype = "fb"

            data.append((
                meta.get("grade", q.get("grade", "")),
                meta.get("unit", q.get("unit", "")),
                q.get("test_type", ""),
                q.get("x", q.get("question_text", "")),
                qtype,
                opt1, opt2, opt3, opt4,
                q.get("a", q.get("answer", "")),
                q.get("level", ""),
                q.get("frequency", "")
            ))
            
        cursor.executemany(sql, data)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def get_questions(grade=None, unit=None, qtype=None, level=None, search=None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM question_bank WHERE 1=1"
        params = []
        
        if grade:
            query += " AND grade = ?"
            params.append(str(grade))
        if unit:
            query += " AND unit = ?"
            params.append(str(unit))
        if qtype:
            query += " AND question_type = ?"
            params.append(str(qtype))
        if level:
            query += " AND level = ?"
            params.append(str(level))
        if search:
            query += " AND (question_text LIKE ? OR option_1 LIKE ? OR option_2 LIKE ? OR option_3 LIKE ? OR option_4 LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term, term, term])
            
        query += " ORDER BY COALESCE(CAST(frequency AS INTEGER), 0) ASC, id DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        result = []
        for r in rows:
            opts = []
            if r["option_1"]: opts.append(r["option_1"])
            if r["option_2"]: opts.append(r["option_2"])
            if r["option_3"]: opts.append(r["option_3"])
            if r["option_4"]: opts.append(r["option_4"])
            
            raw_t = r["question_type"]
            if str(raw_t).lower() in ["wf", "word form", "wordform"]:
                raw_t = "fb"

            result.append({
                "id": r["id"],
                "grade": r["grade"],
                "unit": r["unit"],
                "test_type": r["test_type"],
                "x": r["question_text"],
                "t": raw_t,
                "o": opts,
                "a": r["answer"],
                "level": r["level"],
                "frequency": r["frequency"]
            })
        return result
    finally:
        conn.close()

def delete_questions(ids: List[int]) -> int:
    if not ids:
        return 0
    conn = get_connection()
    try:
        cursor = conn.cursor()
        placeholders = ",".join("?" for _ in ids)
        cursor.execute(f"DELETE FROM question_bank WHERE id IN ({placeholders})", ids)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def clear_questions(grade = None, unit = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if grade and unit:
            cursor.execute("DELETE FROM question_bank WHERE grade = ? AND unit = ?", (grade, unit))
        elif grade:
            cursor.execute("DELETE FROM question_bank WHERE grade = ?", (grade,))
        else:
            cursor.execute("DELETE FROM question_bank")
        conn.commit()
    finally:
        conn.close()

def increment_question_frequency(ids: List[int]) -> int:
    if not ids:
        return 0
    conn = get_connection()
    try:
        cursor = conn.cursor()
        placeholders = ",".join("?" for _ in ids)
        cursor.execute(f"""
            UPDATE question_bank 
            SET frequency = COALESCE(CAST(frequency AS INTEGER), 0) + 1 
            WHERE id IN ({placeholders})
        """, ids)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def reset_question_frequency(ids: List[int] = None) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if ids:
            placeholders = ",".join("?" for _ in ids)
            cursor.execute(f"UPDATE question_bank SET frequency = 0 WHERE id IN ({placeholders})", ids)
        else:
            cursor.execute("UPDATE question_bank SET frequency = 0")
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

# ----------------------------------------------------
# VOCABULARY OPERATIONS
# ----------------------------------------------------
def insert_vocabulary(entries: List[Dict[str, Any]]) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        sql = """
        INSERT INTO vocabulary_list (
            no, grade, unit, vocabulary, pos, ipa, meaning, difficulty, root_word
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        data = []
        for e in entries:
            data.append((
                e.get("no", ""),
                e.get("grade", ""),
                e.get("unit", ""),
                e.get("vocabulary", ""),
                e.get("pos", ""),
                e.get("ipa", ""),
                e.get("meaning", ""),
                e.get("difficulty", ""),
                e.get("root_word", "")
            ))
            
        cursor.executemany(sql, data)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def get_vocabulary(grade=None, unit=None, difficulty=None, pos=None, search=None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM vocabulary_list WHERE 1=1"
        params = []
        
        if grade:
            query += " AND grade = ?"
            params.append(str(grade))
        if unit:
            query += " AND unit = ?"
            params.append(str(unit))
        if difficulty:
            query += " AND difficulty = ?"
            params.append(str(difficulty))
        if pos:
            query += " AND pos LIKE ?"
            params.append(f"%{pos}%")
        if search:
            query += " AND (vocabulary LIKE ? OR meaning LIKE ? OR root_word LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])
            
        query += " ORDER BY grade ASC, CAST(unit AS INTEGER) ASC, CAST(no AS INTEGER) ASC, id ASC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def delete_vocabulary(ids: List[int]) -> int:
    if not ids:
        return 0
    conn = get_connection()
    try:
        cursor = conn.cursor()
        placeholders = ",".join("?" for _ in ids)
        cursor.execute(f"DELETE FROM vocabulary_list WHERE id IN ({placeholders})", ids)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def clear_vocabulary(grade = None, unit = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if grade and unit:
            cursor.execute("DELETE FROM vocabulary_list WHERE grade = ? AND unit = ?", (grade, unit))
        elif grade:
            cursor.execute("DELETE FROM vocabulary_list WHERE grade = ?", (grade,))
        else:
            cursor.execute("DELETE FROM vocabulary_list")
        conn.commit()
    finally:
        conn.close()

def update_vocabulary(vocab_id: int, e: Dict[str, Any]) -> bool:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        sql = """
        UPDATE vocabulary_list
        SET no = ?, grade = ?, unit = ?, vocabulary = ?, pos = ?, ipa = ?, meaning = ?, difficulty = ?, root_word = ?
        WHERE id = ?
        """
        cursor.execute(sql, (
            str(e.get("no", "")),
            str(e.get("grade", "")),
            str(e.get("unit", "")),
            str(e.get("vocabulary", "")),
            str(e.get("pos", "")),
            str(e.get("ipa", "")),
            str(e.get("meaning", "")),
            str(e.get("difficulty", "")),
            str(e.get("root_word", "")),
            vocab_id
        ))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def update_question(question_id: int, q: Dict[str, Any]) -> bool:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        opts = q.get("o") or []
        opt1 = opts[0] if len(opts) > 0 else ""
        opt2 = opts[1] if len(opts) > 1 else ""
        opt3 = opts[2] if len(opts) > 2 else ""
        opt4 = opts[3] if len(opts) > 3 else ""
        
        sql = """
        UPDATE question_bank
        SET grade = ?, unit = ?, test_type = ?, question_text = ?, question_type = ?, 
            option_1 = ?, option_2 = ?, option_3 = ?, option_4 = ?, answer = ?, level = ?, frequency = ?
        WHERE id = ?
        """
        cursor.execute(sql, (
            str(q.get("grade", "")),
            str(q.get("unit", "")),
            str(q.get("test_type", "")),
            str(q.get("x", q.get("question_text", ""))),
            str(q.get("t", q.get("question_type", ""))),
            opt1, opt2, opt3, opt4,
            str(q.get("a", q.get("answer", ""))),
            str(q.get("level", "")),
            str(q.get("frequency", "")),
            question_id
        ))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def get_active_grades() -> List[str]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT grade FROM question_bank WHERE grade IS NOT NULL AND grade != ''
            UNION
            SELECT DISTINCT grade FROM vocabulary_list WHERE grade IS NOT NULL AND grade != ''
        """)
        grades = [str(r[0]) for r in cursor.fetchall()]
        
        digits = []
        others = []
        for g in grades:
            if g.isdigit():
                digits.append(int(g))
            else:
                others.append(g)
        digits.sort()
        others.sort()
        all_grades = [str(d) for d in digits] + others
        
        if not all_grades:
            return ["6", "7", "8", "9"]
        return all_grades
    finally:
        conn.close()
