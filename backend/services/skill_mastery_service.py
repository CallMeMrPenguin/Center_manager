import json
import math
from typing import Dict, Any, List, Optional
from datetime import datetime


def init_skill_mastery_db(conn):
    """Initializes skill mastery database schema and ensures test_config_json column on class_sessions."""
    cursor = conn.cursor()

    # 1. Ensure test_config_json column exists on class_sessions
    try:
        cursor.execute("ALTER TABLE class_sessions ADD COLUMN test_config_json TEXT DEFAULT NULL")
    except Exception:
        pass

    # 2. Create skill_mastery table for persistent mastery tracking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skill_mastery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        class_id   INTEGER REFERENCES classes(id)  ON DELETE CASCADE,
        skill      TEXT NOT NULL,
        unit_key   TEXT NOT NULL,
        ema_score  REAL,
        last_score REAL,
        test_count INTEGER DEFAULT 0,
        mastery_status TEXT,
        last_tested TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, class_id, skill, unit_key)
    )
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_skill_mastery_class_student ON skill_mastery(class_id, student_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_skill_mastery_unit ON skill_mastery(skill, unit_key);")
    conn.commit()


def parse_test_config(raw_config: Any) -> Optional[Dict[str, Any]]:
    """Safely parse test_config_json into a normalized dictionary."""
    if not raw_config:
        return None
    if isinstance(raw_config, dict):
        return raw_config
    if isinstance(raw_config, str):
        try:
            parsed = json.loads(raw_config)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return None
    return None


def calculate_ema(scores: List[float], alpha: float = 0.45) -> float:
    """Calculates exponential moving average on chronological score list."""
    if not scores:
        return 0.0
    ema = scores[0]
    for s in scores[1:]:
        ema = alpha * s + (1.0 - alpha) * ema
    return round(ema, 1)


def evaluate_mastery_status(ema_score: float, test_count: int, last_score: float) -> str:
    """
    Evaluates mastery status based on Bloom's Mastery Threshold (8.0/10) and EMA:
    - 'mastered': EMA >= 8.0 AND test_count >= 2 AND last_score >= 6.8
    - 'regressed': test_count >= 3 AND ema_score >= 7.2 AND last_score < 6.0 (needs refresh)
    - 'partial': ema_score >= 6.5 OR (test_count == 1 AND last_score >= 7.0)
    - 'not_yet': ema_score < 6.5 (needs reinforcement)
    """
    if test_count >= 2 and ema_score >= 8.0 and last_score >= 6.8:
        return "mastered"
    if test_count >= 3 and ema_score >= 7.2 and last_score < 6.0:
        return "regressed"
    if ema_score >= 6.5 or (test_count == 1 and last_score >= 7.0):
        return "partial"
    return "not_yet"


def compute_skill_mastery_from_records(conn, class_id: Optional[int] = None, student_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Scans class_sessions with test_config_json and matching attendance grades
    to compute and persist mastery records in the skill_mastery table.
    """
    cursor = conn.cursor()

    # Query sessions that have test_config_json
    session_query = """
        SELECT id, class_id, date, test_config_json
        FROM class_sessions
        WHERE test_config_json IS NOT NULL AND TRIM(test_config_json) != ''
    """
    params = []
    if class_id:
        session_query += " AND class_id = ?"
        params.append(class_id)
    session_query += " ORDER BY date ASC"

    cursor.execute(session_query, params)
    sessions = [dict(r) for r in cursor.fetchall()]

    if not sessions:
        return []

    # Map (class_id, date) -> test_config
    session_config_map: Dict[tuple, Dict[str, Any]] = {}
    for s in sessions:
        cfg = parse_test_config(s.get("test_config_json"))
        if cfg:
            session_config_map[(s["class_id"], s["date"])] = cfg

    # Fetch attendance grades for these sessions
    grade_query = """
        SELECT ag.class_id, ag.student_id, ag.date, ag.check_1, ag.check_2, ag.homework, ag.status,
               s.full_name as student_name, s.nickname, c.class_name
        FROM class_attendance_grades ag
        JOIN students s ON ag.student_id = s.id
        JOIN classes c ON ag.class_id = c.id
        WHERE ag.status = 'Có mặt'
    """
    grade_params = []
    if class_id:
        grade_query += " AND ag.class_id = ?"
        grade_params.append(class_id)
    if student_id:
        grade_query += " AND ag.student_id = ?"
        grade_params.append(student_id)
    grade_query += " ORDER BY ag.date ASC"

    cursor.execute(grade_query, grade_params)
    grades = [dict(r) for r in cursor.fetchall()]

    # Collect chronological scores per (student_id, class_id, skill, unit_key)
    # structure: { (student_id, class_id, skill, unit_key): [ (date, score), ... ] }
    student_unit_series: Dict[tuple, List[tuple]] = {}

    for g in grades:
        cid = g["class_id"]
        sid = g["student_id"]
        dt = g["date"]
        cfg = session_config_map.get((cid, dt))
        if not cfg:
            continue

        c1_score = float(g.get("check_1") or 0.0)
        c2_score = float(g.get("check_2") or 0.0)

        # Check 1 processing
        c1_cfg = cfg.get("check_1") or {}
        if c1_score > 0 and c1_cfg:
            skill = c1_cfg.get("skill") or "vocab"
            units = c1_cfg.get("units") or []
            topic = c1_cfg.get("topic") or c1_cfg.get("grammar_topic") or ""

            target_keys = []
            if units:
                target_keys.extend(units)
            elif topic:
                target_keys.append(topic)
            else:
                target_keys.append("Chung")

            for ukey in target_keys:
                clean_key = str(ukey).strip()
                if clean_key:
                    k = (sid, cid, skill, clean_key)
                    student_unit_series.setdefault(k, []).append((dt, c1_score))

        # Check 2 processing
        c2_cfg = cfg.get("check_2") or {}
        if c2_score > 0 and c2_cfg:
            skill = c2_cfg.get("skill") or "grammar"
            units = c2_cfg.get("units") or []
            topic = c2_cfg.get("topic") or c2_cfg.get("grammar_topic") or ""

            target_keys = []
            if units:
                target_keys.extend(units)
            elif topic:
                target_keys.append(topic)
            else:
                target_keys.append("Chung")

            for ukey in target_keys:
                clean_key = str(ukey).strip()
                if clean_key:
                    k = (sid, cid, skill, clean_key)
                    student_unit_series.setdefault(k, []).append((dt, c2_score))

    # Compute and persist in skill_mastery table
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mastery_records = []

    for (sid, cid, skill, unit_key), series in student_unit_series.items():
        series.sort(key=lambda x: x[0])
        scores = [item[1] for item in series]
        last_date = series[-1][0]
        last_score = round(scores[-1], 1)
        ema = calculate_ema(scores)
        test_cnt = len(scores)
        status = evaluate_mastery_status(ema, test_cnt, last_score)

        cursor.execute("""
            INSERT INTO skill_mastery (
                student_id, class_id, skill, unit_key, ema_score, last_score, test_count, mastery_status, last_tested, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(student_id, class_id, skill, unit_key) DO UPDATE SET
                ema_score = excluded.ema_score,
                last_score = excluded.last_score,
                test_count = excluded.test_count,
                mastery_status = excluded.mastery_status,
                last_tested = excluded.last_tested,
                updated_at = excluded.updated_at
        """, (sid, cid, skill, unit_key, ema, last_score, test_cnt, status, last_date, now_str))

        mastery_records.append({
            "student_id": sid,
            "class_id": cid,
            "skill": skill,
            "unit_key": unit_key,
            "ema_score": ema,
            "last_score": last_score,
            "test_count": test_cnt,
            "mastery_status": status,
            "last_tested": last_date
        })

    conn.commit()
    return mastery_records
