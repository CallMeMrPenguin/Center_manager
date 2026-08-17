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


@router.get("/api/suggestions/units")
def api_get_unit_suggestions(grade: Optional[str] = None):
    """Returns list of unit and topic suggestions from vocabulary_list and question_bank."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        units_set = set()

        # From vocabulary_list
        v_query = "SELECT DISTINCT unit FROM vocabulary_list WHERE unit IS NOT NULL AND TRIM(unit) != ''"
        v_params = []
        if grade:
            v_query += " AND grade = ?"
            v_params.append(grade)
        cursor.execute(v_query, v_params)
        for r in cursor.fetchall():
            u = r["unit"].strip()
            if u:
                units_set.add(u)

        # From question_bank
        q_query = "SELECT DISTINCT unit FROM question_bank WHERE unit IS NOT NULL AND TRIM(unit) != ''"
        q_params = []
        if grade:
            q_query += " AND grade = ?"
            q_params.append(grade)
        cursor.execute(q_query, q_params)
        for r in cursor.fetchall():
            u = r["unit"].strip()
            if u:
                units_set.add(u)

        # Add common default units if empty
        if not units_set:
            units_set = {f"Unit {i}" for i in range(1, 13)}

        sorted_units = sorted(list(units_set), key=lambda x: (
            int(''.join(filter(str.isdigit, x))) if any(c.isdigit() for c in x) else 999,
            x
        ))

        grammar_topics = [
            "Present Simple", "Present Continuous", "Past Simple", "Past Continuous",
            "Present Perfect", "Future Simple (Will / Be going to)", "Comparatives & Superlatives",
            "Modal Verbs (Can/Could/Must/Should)", "Passive Voice", "Conditionals (Type 1 & 2)",
            "Relative Clauses", "Reported Speech", "Prepositions of Time & Place", "Articles (A/An/The)"
        ]

        return {
            "units": sorted_units,
            "grammar_topics": grammar_topics
        }
    finally:
        conn.close()
