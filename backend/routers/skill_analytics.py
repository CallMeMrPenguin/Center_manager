import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from database.db_manager import get_connection
from services.skill_mastery_service import init_skill_mastery_db, parse_test_config
from services.skill_report_service import get_skill_breakdown_report

router = APIRouter(tags=["Skill Analytics"])


class TestConfigItem(BaseModel):
    skill: Optional[str] = "vocab"
    units: Optional[List[str]] = []
    topic: Optional[str] = ""
    grammar_topic: Optional[str] = ""


class SessionTestConfigPayload(BaseModel):
    date: str
    class_id: int
    session_id: Optional[int] = None
    mode: Optional[str] = "two_separate"
    check_1: Optional[TestConfigItem] = None
    check_2: Optional[TestConfigItem] = None
    notes: Optional[str] = ""


@router.get("/api/reports/skill-breakdown")
def api_get_skill_breakdown(
    class_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None)
):
    """Returns pedagogical skill breakdown, unit mastery, and heatmap analysis."""
    conn = get_connection()
    try:
        report = get_skill_breakdown_report(conn, class_id=class_id, student_id=student_id)
        return report
    finally:
        conn.close()


@router.get("/api/classes/{class_id}/sessions/test-config")
def api_get_session_test_config(class_id: int, date: str):
    """Fetches test config metadata for a specific class session date."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, class_id, date, test_config_json FROM class_sessions WHERE class_id = ? AND date = ?",
            (class_id, date)
        )
        row = cursor.fetchone()
        if not row:
            return {"configured": False, "test_config": None, "session_id": None}
        
        r = dict(row)
        cfg = parse_test_config(r.get("test_config_json"))
        return {
            "configured": bool(cfg),
            "test_config": cfg,
            "session_id": r["id"]
        }
    finally:
        conn.close()


@router.post("/api/classes/{class_id}/sessions/test-config")
def api_save_session_test_config(class_id: int, payload: SessionTestConfigPayload):
    """Saves or updates test config metadata for a class session date."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        config_dict = {
            "mode": payload.mode or "two_separate",
            "check_1": payload.check_1.dict() if payload.check_1 else {},
            "check_2": payload.check_2.dict() if payload.check_2 else {},
            "notes": payload.notes or ""
        }
        json_str = json.dumps(config_dict, ensure_ascii=False)

        # Check if session exists for this class and date
        cursor.execute(
            "SELECT id FROM class_sessions WHERE class_id = ? AND date = ?",
            (class_id, payload.date)
        )
        row = cursor.fetchone()

        if row:
            session_id = row["id"]
            cursor.execute(
                "UPDATE class_sessions SET test_config_json = ? WHERE id = ?",
                (json_str, session_id)
            )
        else:
            # Create a session record for this date
            cursor.execute("""
                INSERT INTO class_sessions (class_id, date, start_time, duration, status, test_config_json)
                VALUES (?, ?, '18:00', 90, 'Sắp diễn ra', ?)
            """, (class_id, payload.date, json_str))
            session_id = cursor.lastrowid

        conn.commit()
        return {"status": "success", "session_id": session_id, "test_config": config_dict}
    finally:
        conn.close()


import re

@router.get("/api/suggestions/units")
def api_get_unit_suggestions(grade: Optional[str] = None):
    """Returns list of unit and topic suggestions from unit_config, vocabulary_list and question_bank."""
    from config.unit_config import load_unit_config
    unit_cfg_all = load_unit_config()

    clean_grade = "6"
    if grade:
        m = re.search(r'\b(1[0-2]|[6-9])\b', str(grade))
        if not m:
            m = re.search(r'(1[0-2]|[6-9])', str(grade))
        if m:
            clean_grade = m.group(1)

    grade_units = unit_cfg_all.get(clean_grade, unit_cfg_all.get("6", {}))

    units_list = []
    unit_grammar_map = {}
    unit_name_map = {}

    for u_num, u_data in grade_units.items():
        ukey = f"Unit {u_num}"
        uname = u_data.get("name", "") if isinstance(u_data, dict) else str(u_data)
        ugrammar = u_data.get("grammar", "") if isinstance(u_data, dict) else ""
        units_list.append({
            "unit": ukey,
            "unit_num": u_num,
            "name": uname,
            "grammar": ugrammar,
            "label": f"{ukey}: {uname}" if uname else ukey
        })
        unit_grammar_map[ukey] = ugrammar
        unit_name_map[ukey] = uname

    units_list.sort(key=lambda x: int(x["unit_num"]) if x["unit_num"].isdigit() else 999)

    grammar_topics = [
        "Present Simple", "Present Continuous", "Past Simple", "Past Continuous",
        "Present Perfect", "Future Simple (Will / Be going to)", "Comparatives & Superlatives",
        "Modal Verbs (Can/Could/Must/Should)", "Passive Voice", "Conditionals (Type 1 & 2)",
        "Relative Clauses", "Reported Speech", "Prepositions of Time & Place", "Articles (A/An/The)"
    ]

    return {
        "units": [u["unit"] for u in units_list],
        "units_detailed": units_list,
        "unit_grammar_map": unit_grammar_map,
        "unit_name_map": unit_name_map,
        "grammar_topics": grammar_topics
    }
