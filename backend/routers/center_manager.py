import os
import re
import json
import time
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from config.settings import get_setting, BASE_DIR
try:
    from services.csv_parser import parse_question_bank_csv
    from services.docx_parser import convert_docx_to_json
    from services.export_service import export_class_excel, export_class_docx
    from routers.questions import flatten_docx_to_questions
except Exception as _e:
    parse_question_bank_csv = None
    convert_docx_to_json = None
    export_class_excel = None
    export_class_docx = None
    flatten_docx_to_questions = None
from database.db_manager import (
    get_connection,
    get_students, create_student, update_student, delete_student,
    get_teachers_cm, create_teacher_cm, update_teacher_cm, delete_teacher_cm,
    get_classes, create_class, update_class, delete_class,
    get_class_students, enroll_student_to_class, unenroll_student_from_class, update_class_student_groups,
    get_class_weekly_schedule, add_class_weekly_slot, delete_class_weekly_slot,
    get_class_sessions, add_class_session, update_class_session, delete_class_session,
    get_courses, create_course, update_course, delete_course,
    get_student_scores, upsert_student_score, delete_student_score,
    get_class_attendance_grades, upsert_class_attendance_grades,
    get_analytics_reports, reset_student_grades, get_class_student_predictions,
    get_custom_time_phases, save_custom_time_phase, delete_custom_time_phase
)

router = APIRouter()

class StudentPayload(BaseModel):
    full_name: str
    nickname: Optional[str] = ""
    gender: Optional[str] = "Nam"
    grade: Optional[str] = "Lớp 6"
    date_of_birth: Optional[str] = None
    enroll_date: Optional[str] = None
    school: Optional[str] = None
    status: Optional[str] = "Đang học"
    father_name: Optional[str] = None
    father_phone: Optional[str] = None
    mother_name: Optional[str] = None
    mother_phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class TeacherCMPayload(BaseModel):
    full_name: str
    role: Optional[str] = "Giáo viên"
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class ClassPayload(BaseModel):
    class_name: str
    teacher_id: Optional[int] = None
    grade: Optional[str] = "Lớp 6"
    subject: Optional[str] = None
    room: Optional[str] = None
    status: Optional[str] = "Đang hoạt động"
    color: Optional[str] = "#7c3aed"
    notes: Optional[str] = None

class EnrollPayload(BaseModel):
    student_id: int
    seat_color: Optional[str] = None
    grade_group: Optional[str] = None

class WeeklySlotPayload(BaseModel):
    day_of_week: str
    start_time: str
    duration: int
    notes: Optional[str] = None

class ClassSessionPayload(BaseModel):
    class_id: Optional[int] = None
    date: str
    start_time: str
    duration: int
    status: Optional[str] = "Sắp diễn ra"
    teacher_id: Optional[int] = None
    notes: Optional[str] = ""
    color: Optional[str] = None

class CoursePayload(BaseModel):
    course_name: str
    description: Optional[str] = None
    price: Optional[float] = 0
    duration_weeks: Optional[int] = None
    status: Optional[str] = "Đang mở"

class ScorePayload(BaseModel):
    student_id: int
    class_id: int
    test_title: Optional[str] = None
    test_date: Optional[str] = None
    score_type: str
    score: float
    max_score: Optional[float] = 10
    notes: Optional[str] = None

@router.get("/api/students")
def api_get_students(search: str = "", status: str = ""):
    return get_students(search, status)

@router.post("/api/students")
def api_create_student(payload: StudentPayload):
    try:
        sid = create_student(payload.dict())
        return {"id": sid, "status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/api/students/{student_id}")
def api_update_student(student_id: int, payload: StudentPayload):
    update_student(student_id, payload.dict())
    return {"status": "success"}

@router.delete("/api/students/{student_id}")
def api_delete_student(student_id: int):
    delete_student(student_id)
    return {"status": "success"}

@router.get("/api/teachers_cm")
def api_get_teachers_cm(search: str = "", role: str = ""):
    return get_teachers_cm(search, role)

@router.post("/api/teachers_cm")
def api_create_teacher_cm(payload: TeacherCMPayload):
    tid = create_teacher_cm(payload.dict())
    return {"id": tid, "status": "success"}

@router.put("/api/teachers_cm/{teacher_id}")
def api_update_teacher_cm(teacher_id: int, payload: TeacherCMPayload):
    update_teacher_cm(teacher_id, payload.dict())
    return {"status": "success"}

@router.delete("/api/teachers_cm/{teacher_id}")
def api_delete_teacher_cm(teacher_id: int):
    delete_teacher_cm(teacher_id)
    return {"status": "success"}

@router.get("/api/classes")
def api_get_classes(search: str = ""):
    return get_classes(search)

@router.post("/api/classes")
def api_create_class(payload: ClassPayload):
    cid = create_class(payload.dict())
    return {"id": cid, "status": "success"}

@router.put("/api/classes/{class_id}")
def api_update_class(class_id: int, payload: ClassPayload):
    update_class(class_id, payload.dict())
    return {"status": "success"}

@router.delete("/api/classes/{class_id}")
def api_delete_class(class_id: int):
    delete_class(class_id)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/students")
def api_get_class_students(class_id: int):
    return get_class_students(class_id)

@router.post("/api/classes/{class_id}/students")
def api_enroll_student(class_id: int, payload: EnrollPayload):
    enroll_student_to_class(class_id, payload.student_id, payload.seat_color, payload.grade_group)
    return {"status": "success"}

@router.delete("/api/classes/{class_id}/students/{student_id}")
def api_unenroll_student(class_id: int, student_id: int):
    unenroll_student_from_class(class_id, student_id)
    return {"status": "success"}

@router.put("/api/classes/{class_id}/students/{student_id}/groups")
def api_update_student_groups(class_id: int, student_id: int, payload: EnrollPayload):
    update_class_student_groups(class_id, student_id, payload.seat_color, payload.grade_group)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/schedule/weekly")
def api_get_weekly(class_id: int):
    return get_class_weekly_schedule(class_id)

@router.post("/api/classes/{class_id}/schedule/weekly")
def api_add_weekly(class_id: int, payload: WeeklySlotPayload):
    sid = add_class_weekly_slot(class_id, payload.day_of_week, payload.start_time, payload.duration, payload.notes or "")
    return {"id": sid, "status": "success"}

@router.post("/api/classes/{class_id}/schedule/weekly/replace")
def api_replace_weekly_slots(class_id: int, payload: List[WeeklySlotPayload]):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM class_schedule_weekly WHERE class_id = ?", (class_id,))
        for slot in payload:
            cursor.execute("""
                INSERT INTO class_schedule_weekly (class_id, day_of_week, start_time, duration, notes)
                VALUES (?, ?, ?, ?, ?)
            """, (class_id, slot.day_of_week, slot.start_time, slot.duration, slot.notes or ""))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

@router.delete("/api/classes/{class_id}/schedule/weekly/{slot_id}")
def api_delete_weekly(slot_id: int):
    delete_class_weekly_slot(slot_id)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/schedule/sessions")
def api_get_sessions(class_id: int, month: str = ""):
    return get_class_sessions(class_id, month)

@router.post("/api/classes/{class_id}/schedule/sessions")
def api_add_session(class_id: int, payload: ClassSessionPayload):
    target_cid = class_id if class_id > 0 else (payload.class_id or 1)
    sid = add_class_session(target_cid, payload.date, payload.start_time, payload.duration, payload.status or "Sắp diễn ra", payload.teacher_id, payload.notes or "", payload.color)
    return {"id": sid, "status": "success"}

@router.put("/api/classes/{class_id}/schedule/sessions/{session_id}")
def api_update_session(class_id: int, session_id: int, payload: ClassSessionPayload):
    update_class_session(session_id, payload.dict(), class_id=class_id)
    return {"status": "success"}

@router.delete("/api/classes/{class_id}/schedule/sessions/{session_id}")
def api_delete_session(session_id: int):
    delete_class_session(session_id)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/attendance")
def api_get_attendance(class_id: int, date: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                s.id as student_id,
                s.full_name as student_name,
                s.nickname,
                ag.id as id,
                COALESCE(ag.status, 'Có mặt') as status,
                ag.check_1,
                ag.check_2,
                ag.homework,
                ag.mock_test,
                COALESCE(ag.notes, '') as notes,
                COALESCE(ag.date, ?) as date
            FROM class_students cs
            JOIN students s ON cs.student_id = s.id
            LEFT JOIN class_attendance_grades ag ON ag.class_id = cs.class_id AND ag.student_id = s.id AND ag.date = ?
            WHERE cs.class_id = ?
            ORDER BY s.full_name ASC
        """, (date, date, class_id))
        rows = [dict(r) for r in cursor.fetchall()]
        return {"date": date, "records": rows}
    finally:
        conn.close()

@router.post("/api/classes/{class_id}/attendance")
def api_save_attendance(class_id: int, payload: Dict[str, Any]):
    date_str = payload.get("date")
    records = payload.get("records", [])
    if not date_str:
        raise HTTPException(status_code=400, detail="Thiếu ngày điểm danh")
    upsert_class_attendance_grades(class_id, date_str, records)
    return {"status": "success"}

@router.post("/api/classes/{class_id}/export/excel")
def api_export_class_excel(class_id: int, payload: Dict[str, Any]):
    date_str = payload.get("date")
    records = payload.get("records")
    return export_class_excel(class_id, date_str, records)

@router.post("/api/classes/{class_id}/export/docx")
def api_export_class_docx(class_id: int, payload: Dict[str, Any]):
    date_str = payload.get("date")
    records = payload.get("records")
    return export_class_docx(class_id, date_str, records)

@router.get("/api/courses")
def api_get_courses(search: str = "", status: str = ""):
    return get_courses(search, status)

@router.post("/api/courses")
def api_create_course(payload: CoursePayload):
    cid = create_course(payload.dict())
    return {"id": cid, "status": "success"}

@router.put("/api/courses/{course_id}")
def api_update_course(course_id: int, payload: CoursePayload):
    update_course(course_id, payload.dict())
    return {"status": "success"}

@router.delete("/api/courses/{course_id}")
def api_delete_course(course_id: int):
    delete_course(course_id)
    return {"status": "success"}

@router.get("/api/scores")
def api_get_scores(class_id: Optional[int] = None, student_id: Optional[int] = None):
    return get_student_scores(class_id, student_id)

@router.post("/api/scores")
def api_upsert_score(payload: ScorePayload):
    sid = upsert_student_score(payload.dict())
    return {"id": sid, "status": "success"}

@router.delete("/api/scores/{score_id}")
def api_delete_score(score_id: int):
    delete_student_score(score_id)
    return {"status": "success"}

def _clean_opt_prefix(val: Any) -> str:
    if not isinstance(val, str):
        return str(val or "")
    s = val.strip()
    cleaned = re.sub(r'^[A-Da-d0-9][.\):\-]\s*', '', s).strip()
    return cleaned if cleaned else s

@router.post("/api/kiemtra/parse")
async def api_parse_kiemtra(file: UploadFile = File(None), raw_json: Optional[str] = Form(None)):
    files_dir = get_setting("files_dir")
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(BASE_DIR, "workspace_files")
    os.makedirs(files_dir, exist_ok=True)

    if file:
        filename = file.filename.lower()
        content = await file.read()
        if filename.endswith(".json"):
            try:
                data = json.loads(content.decode("utf-8"))
                if isinstance(data, list):
                    data = {"title": file.filename, "questions": data}
                elif isinstance(data, dict) and "questions" not in data:
                    raw_qs = data.get("exercises", []) or data.get("data", [])
                    data = {"title": file.filename, "questions": raw_qs}
                
                top_inst = data.get("instruction") or data.get("guide") or ""
                normalized_qs = []
                for idx, q in enumerate(data.get("questions", []), 1):
                    raw_x = q.get("x") or q.get("question")
                    if isinstance(raw_x, list):
                        q_text = "\n".join([str(item) for item in raw_x if item])
                    elif isinstance(raw_x, str):
                        q_text = raw_x
                    elif q.get("sentence") and q.get("prompt"):
                        prompt_str = str(q["prompt"]).strip()
                        if not prompt_str.startswith("("):
                            prompt_str = f"({prompt_str})"
                        q_text = f"{str(q['sentence']).strip()}\n{prompt_str}"
                    else:
                        q_text = q.get("sentence") or q.get("passage") or q.get("content") or f"Câu {idx}"

                    opts = q.get("options") or q.get("o") or []
                    cleaned_opts = [_clean_opt_prefix(o) for o in opts] if isinstance(opts, list) else []
                    ans = str(q.get("answer") or q.get("a") or "").strip()
                    if ans.upper() in ["A", "B", "C", "D", "E"] and cleaned_opts:
                        let_idx = ord(ans.upper()) - 65
                        if 0 <= let_idx < len(cleaned_opts):
                            ans = cleaned_opts[let_idx]
                    q_type = q.get("type") or ("mcq" if cleaned_opts else "fill")
                    inst = q.get("instruction") or top_inst
                    normalized_qs.append({
                        "id": q.get("id") or q.get("number") or idx,
                        "question": q_text,
                        "instruction": inst,
                        "type": q_type,
                        "options": cleaned_opts,
                        "answer": str(ans),
                        "explanation": q.get("explanation", "")
                    })
                data["questions"] = normalized_qs
                return data
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON file: {e}")
        elif filename.endswith(".docx"):
            temp_path = os.path.join(files_dir, f"temp_kt_{int(time.time())}_{file.filename}")
            with open(temp_path, "wb") as f:
                f.write(content)
            try:
                parsed_ex = convert_docx_to_json(temp_path)
                flat_qs = flatten_docx_to_questions(parsed_ex)
                questions = []
                for idx, q in enumerate(flat_qs, 1):
                    opts = q.get("o", [])
                    cleaned_opts = [_clean_opt_prefix(o) for o in opts] if isinstance(opts, list) else []
                    q_raw_text = q.get("x", "")
                    instruction = q.get("instruction", "")
                    if not instruction and q_raw_text.startswith("[Yêu cầu: "):
                        parts = q_raw_text.split("]\n", 1)
                        if len(parts) == 2:
                            instruction = parts[0].replace("[Yêu cầu: ", "").strip()
                            q_raw_text = parts[1]
                    ans = str(q.get("a", "")).strip()
                    if ans.upper() in ["A", "B", "C", "D", "E"] and cleaned_opts:
                        let_idx = ord(ans.upper()) - 65
                        if 0 <= let_idx < len(cleaned_opts):
                            ans = cleaned_opts[let_idx]
                    questions.append({
                        "id": idx,
                        "question": q_raw_text,
                        "instruction": instruction,
                        "type": "mcq" if cleaned_opts else "fill",
                        "options": cleaned_opts,
                        "answer": ans,
                        "explanation": ""
                    })
                return {"title": file.filename, "questions": questions}
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Lỗi đọc file Word DOCX: {e}")
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        elif filename.endswith(".csv"):
            temp_path = os.path.join(files_dir, f"temp_kt_{int(time.time())}_{file.filename}")
            with open(temp_path, "wb") as f:
                f.write(content)
            try:
                parsed_q = parse_question_bank_csv(temp_path)
                questions = []
                for idx, q in enumerate(parsed_q, 1):
                    opts = q.get("o", [])
                    cleaned_opts = [_clean_opt_prefix(o) for o in opts] if isinstance(opts, list) else []
                    questions.append({
                        "id": idx,
                        "question": q.get("x", ""),
                        "type": "mcq" if cleaned_opts else "fill",
                        "options": cleaned_opts,
                        "answer": q.get("a", ""),
                        "explanation": ""
                    })
                return {"title": file.filename, "questions": questions}
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Lỗi đọc file CSV: {e}")
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        else:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file .docx, .json hoặc .csv")
    elif raw_json:
        try:
            return json.loads(raw_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid raw JSON: {e}")
    else:
        raise HTTPException(status_code=400, detail="No file or JSON content provided")

@router.get("/api/reports/grade-analytics")
def api_get_grade_analytics(class_id: Optional[int] = None, student_id: Optional[int] = None):
    return get_analytics_reports(class_id, student_id)

class ResetGradesPayload(BaseModel):
    class_id: Optional[int] = None
    student_id: Optional[int] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None

@router.post("/api/reports/reset-grades")
def api_reset_grades(payload: ResetGradesPayload):
    count = reset_student_grades(payload.class_id, payload.student_id, payload.from_date, payload.to_date)
    return {"status": "success", "reset_count": count}

class TimePhasePayload(BaseModel):
    id: Optional[int] = None
    phase_name: str
    class_id: Optional[int] = None
    from_date: str
    to_date: str

@router.get("/api/reports/time-phases")
def api_get_time_phases(class_id: Optional[int] = None):
    return get_custom_time_phases(class_id)

@router.post("/api/reports/time-phases")
def api_save_time_phase(payload: TimePhasePayload):
    return save_custom_time_phase(payload.dict())

@router.delete("/api/reports/time-phases/{phase_id}")
def api_delete_time_phase(phase_id: int):
    success = delete_custom_time_phase(phase_id)
    return {"status": "success", "deleted": success}
