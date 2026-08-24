import json
from typing import List, Dict, Any, Optional
from database.connection import get_connection
from database.utils import trunc_1_dec
from database.analytics_engine import calculate_performance_analytics

def get_analytics_reports(class_id: Optional[int] = None, student_id: Optional[int] = None) -> Dict[str, Any]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ag.*, s.full_name as student_name, s.nickname, c.class_name, csess.test_config_json
            FROM class_attendance_grades ag
            JOIN students s ON ag.student_id = s.id
            JOIN classes c ON ag.class_id = c.id
            LEFT JOIN class_sessions csess ON ag.class_id = csess.class_id AND ag.date = csess.date
            ORDER BY ag.date ASC
        """)
        raw_db_rows = [dict(r) for r in cursor.fetchall()]

        # Rank query ordered with standard weighted average
        rank_query = """
            SELECT 
                s.id as student_id,
                s.full_name,
                s.nickname,
                s.grade as student_grade,
                s.school,
                s.date_of_birth,
                s.gender,
                COALESCE(s.father_phone, s.mother_phone, '') as phone,
                s.father_name,
                s.father_phone,
                s.mother_name,
                s.mother_phone,
                s.address,
                c.id as class_id,
                c.class_name,
                c.grade as class_grade,
                COUNT(ag.id) as total_sessions,
                SUM(CASE WHEN ag.status = 'Có mặt' THEN 1 ELSE 0 END) as present_count,
                AVG(CASE WHEN ag.check_1 > 0 THEN ag.check_1 END) as avg_check_1,
                AVG(CASE WHEN ag.check_2 > 0 THEN ag.check_2 END) as avg_check_2,
                AVG(CASE WHEN ag.homework > 0 THEN ag.homework END) as avg_homework,
                AVG(CASE WHEN (ag.mock_test > 0) THEN ag.mock_test END) as avg_mock_test
            FROM students s
            JOIN class_students cs ON s.id = cs.student_id
            JOIN classes c ON cs.class_id = c.id
            LEFT JOIN class_attendance_grades ag ON s.id = ag.student_id AND c.id = ag.class_id
            GROUP BY s.id, c.id
            ORDER BY (
                COALESCE(AVG(CASE WHEN ag.check_1 > 0 THEN ag.check_1 END), 0) * 0.55 + 
                COALESCE(AVG(CASE WHEN ag.check_2 > 0 THEN ag.check_2 END), 0) * 0.35 + 
                COALESCE(AVG(CASE WHEN ag.homework > 0 THEN ag.homework END), 0) * 0.10
            ) DESC
        """
        cursor.execute(rank_query)
        raw_rankings = [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()

    all_rows = []
    for r in raw_db_rows:
        cfg_str = r.get("test_config_json")
        c1_skill = "vocab"
        c2_skill = "grammar"
        topic = ""
        c1_topic = ""
        c2_topic = ""
        grammar_topic = ""
        if cfg_str:
            try:
                cfg = json.loads(cfg_str)
                c1_info = cfg.get("check_1") or {}
                c2_info = cfg.get("check_2") or {}
                c1_skill = c1_info.get("skill") or "vocab"
                c2_skill = c2_info.get("skill") or "grammar"
                if c1_skill == "grammar":
                    c1_topic = c1_info.get("grammar_topic") or c1_info.get("topic") or (", ".join(c1_info.get("units", [])) if c1_info.get("units") else "")
                else:
                    c1_topic = c1_info.get("topic") or (", ".join(c1_info.get("units", [])) if c1_info.get("units") else "")

                if c2_skill == "grammar":
                    c2_topic = c2_info.get("grammar_topic") or c2_info.get("topic") or (", ".join(c2_info.get("units", [])) if c2_info.get("units") else "")
                else:
                    c2_topic = c2_info.get("topic") or (", ".join(c2_info.get("units", [])) if c2_info.get("units") else "")

                if c2_skill == "grammar" and c2_topic:
                    grammar_topic = c2_topic
                elif c1_skill == "grammar" and c1_topic:
                    grammar_topic = c1_topic
                else:
                    grammar_topic = ""
                units_list = (c1_info.get("units") or []) + (c2_info.get("units") or [])
                unit_str = ", ".join(dict.fromkeys(units_list)) if units_list else ""
                topic = unit_str or c1_topic or c2_topic or "Chung"
            except Exception:
                unit_str = ""
                units_list = []
        else:
            unit_str = ""
            units_list = []
        r["check_1_skill"] = c1_skill
        r["check_2_skill"] = c2_skill
        r["check_1_topic"] = c1_topic
        r["check_2_topic"] = c2_topic
        r["grammar_topic"] = grammar_topic
        r["topic"] = topic
        r["unit_key"] = unit_str
        r["units"] = units_list
        all_rows.append(r)

    if class_id or student_id:
        rows = [
            r for r in all_rows 
            if (not class_id or r.get("class_id") == class_id) and 
               (not student_id or r.get("student_id") == student_id)
        ]
    else:
        rows = all_rows

    student_rows_map: Dict[int, List[Dict[str, Any]]] = {}
    for r in all_rows:
        sid = r.get("student_id")
        if sid is not None:
            student_rows_map.setdefault(sid, []).append(r)

    enriched_rankings = []
    for sr in raw_rankings:
        sid = sr.get("student_id")
        s_rows = student_rows_map.get(sid, [])

        vocab_scores = []
        grammar_scores = []
        hw_scores = []
        for r in s_rows:
            if r.get("status") in ("Vắng mặt", "Nghỉ học"):
                continue
            c1 = float(r.get("check_1") or 0)
            c2 = float(r.get("check_2") or 0)
            hw = float(r.get("homework") or 0)
            c1_s = str(r.get("check_1_skill") or "vocab").lower().strip()
            c2_s = str(r.get("check_2_skill") or "grammar").lower().strip()

            if c1 > 0:
                if c1_s in ("grammar", "ngữ pháp"):
                    grammar_scores.append(c1)
                else:
                    vocab_scores.append(c1)
            if c2 > 0:
                if c2_s in ("vocab", "từ vựng"):
                    vocab_scores.append(c2)
                else:
                    grammar_scores.append(c2)
            if hw > 0:
                hw_scores.append(hw)

        avg_vocab = trunc_1_dec(sum(vocab_scores) / len(vocab_scores)) if vocab_scores else 0.0
        avg_grammar = trunc_1_dec(sum(grammar_scores) / len(grammar_scores)) if grammar_scores else 0.0
        avg_hw = trunc_1_dec(sum(hw_scores) / len(hw_scores)) if hw_scores else 0.0

        sr["avg_vocab"] = avg_vocab
        sr["avg_grammar"] = avg_grammar
        sr["avg_homework"] = avg_hw
        sr["avg_check_1"] = avg_vocab
        sr["avg_check_2"] = avg_grammar

        if s_rows:
            s_analytics = calculate_performance_analytics(s_rows)
            sr["ema_level"] = s_analytics.get("ema_level", 0.0)
            sr["trend_slope"] = s_analytics.get("trend_slope", 0.0)
            sr["trend_label"] = s_analytics.get("trend_label", "Ổn định")
            sr["performance_index"] = s_analytics.get("performance_index", 0.0)
            sr["consistency_score"] = s_analytics.get("consistency_score", 100.0)
            sr["rating_label"] = s_analytics.get("rating_label", "Tốt")
            sr["predicted_next"] = s_analytics.get("predicted_next", 0.0)
            sr["std_dev"] = s_analytics.get("std_dev", 0.0)
        else:
            sr["ema_level"] = 0.0
            sr["trend_slope"] = 0.0
            sr["trend_label"] = "Chưa có dữ liệu"
            sr["performance_index"] = 0.0
            sr["consistency_score"] = 100.0
            sr["rating_label"] = "Chưa có dữ liệu"
            sr["predicted_next"] = 0.0
            sr["std_dev"] = 0.0
        enriched_rankings.append(sr)

    class_rows_map: Dict[int, List[Dict[str, Any]]] = {}
    for r in all_rows:
        cid = r.get("class_id")
        if cid is not None:
            class_rows_map.setdefault(cid, []).append(r)

    class_analytics_map: Dict[str, Dict[str, Any]] = {}
    for cid_k, c_rows in class_rows_map.items():
        class_analytics_map[str(cid_k)] = calculate_performance_analytics(c_rows)

    analytics_summary = calculate_performance_analytics(rows)

    return {
        "session_records": rows,
        "all_session_records": all_rows,
        "student_rankings": enriched_rankings,
        "analytics_summary": analytics_summary,
        "class_analytics_map": class_analytics_map
    }

def reset_student_grades(class_id: Optional[int] = None, student_id: Optional[int] = None, from_date: Optional[str] = None, to_date: Optional[str] = None) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "UPDATE class_attendance_grades SET check_1 = NULL, check_2 = NULL, homework = NULL, mock_test = NULL WHERE 1=1"
        params = []
        if class_id:
            query += " AND class_id = ?"
            params.append(class_id)
        if student_id:
            query += " AND student_id = ?"
            params.append(student_id)
        if from_date:
            query += " AND date >= ?"
            params.append(from_date)
        if to_date:
            query += " AND date <= ?"
            params.append(to_date)
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()

def get_custom_time_phases(class_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if class_id:
            cursor.execute("SELECT * FROM custom_time_phases WHERE class_id IS NULL OR class_id = ? ORDER BY from_date ASC", (class_id,))
        else:
            cursor.execute("SELECT * FROM custom_time_phases ORDER BY from_date ASC")
        rows = [dict(r) for r in cursor.fetchall()]
        return rows
    finally:
        conn.close()

def save_custom_time_phase(phase_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        phase_id = phase_data.get("id")
        phase_name = str(phase_data.get("phase_name", "")).strip()
        class_id = phase_data.get("class_id")
        if class_id is not None and str(class_id).strip() != "":
            try:
                class_id = int(class_id)
            except Exception:
                class_id = None
        else:
            class_id = None

        from_date = str(phase_data.get("from_date", "")).strip()
        to_date = str(phase_data.get("to_date", "")).strip()

        if phase_id:
            cursor.execute("""
                UPDATE custom_time_phases 
                SET phase_name = ?, class_id = ?, from_date = ?, to_date = ?
                WHERE id = ?
            """, (phase_name, class_id, from_date, to_date, phase_id))
        else:
            cursor.execute("""
                INSERT INTO custom_time_phases (phase_name, class_id, from_date, to_date)
                VALUES (?, ?, ?, ?)
            """, (phase_name, class_id, from_date, to_date))
            phase_id = cursor.lastrowid
        conn.commit()
        return {
            "id": phase_id,
            "phase_name": phase_name,
            "class_id": class_id,
            "from_date": from_date,
            "to_date": to_date
        }
    finally:
        conn.close()

def delete_custom_time_phase(phase_id: int) -> bool:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM custom_time_phases WHERE id = ?", (phase_id,))
        conn.commit()
        return True
    finally:
        conn.close()
