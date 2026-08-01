import os
import time
import csv
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from config.settings import get_setting
from services.csv_parser import parse_question_bank_csv
from services.docx_parser import convert_docx_to_json
from database.db_manager import (
    get_questions, insert_questions, delete_questions, clear_questions,
    increment_question_frequency, reset_question_frequency, update_question,
    get_active_grades
)

router = APIRouter()

class DeleteMultipleRequest(BaseModel):
    ids: List[int]

class ExportQuestionsRequest(BaseModel):
    format: str
    grade: Optional[str] = None
    unit: Optional[str] = None
    difficulty: Optional[str] = None
    qtype: Optional[str] = None
    search: Optional[str] = None
    ids: Optional[List[int]] = None
    default_time: Optional[int] = 30

class UpdateQuestionRequest(BaseModel):
    grade: Optional[str] = ""
    unit: Optional[str] = ""
    test_type: Optional[str] = ""
    x: Optional[str] = ""
    t: Optional[str] = ""
    o: Optional[List[str]] = []
    a: Optional[str] = ""
    level: Optional[str] = ""
    frequency: Optional[str] = ""

class ConfirmQuestionsImportRequest(BaseModel):
    questions: List[Dict[str, Any]]

def flatten_docx_to_questions(raw_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    flat = []
    idx = 1
    for item in raw_list:
        inst = item.get("instruction") or ""
        prefix_inst = f"[Yêu cầu: {inst}]\n" if inst else ""
        if "k" in item and isinstance(item["k"], list):
            passage_paragraphs = item.get("b", [])
            passage_text = "\n".join(passage_paragraphs) if passage_paragraphs else ""
            for sub in item["k"]:
                sub_inst = sub.get("instruction") or inst
                sub_prefix = f"[Yêu cầu: {sub_inst}]\n" if sub_inst else ""
                q_text = sub.get("x", "")
                full_text = f"{sub_prefix}[{item.get('t', 'passage').upper()}]\n{passage_text}\n\n{q_text}" if passage_text else f"{sub_prefix}{q_text}"
                flat.append({
                    "t": item.get("t", "mq"),
                    "q": sub.get("q", idx),
                    "x": full_text,
                    "o": sub.get("o", []),
                    "a": sub.get("a", ""),
                    "level": sub.get("level", ""),
                    "frequency": str(sub.get("frequency", "0")),
                    "test_type": item.get("t", "")
                })
                idx += 1
        else:
            q_text = item.get("x", "")
            full_text = f"{prefix_inst}{q_text}" if prefix_inst else q_text
            flat.append({
                "t": item.get("t", "mq"),
                "q": item.get("q", idx),
                "x": full_text,
                "o": item.get("o", []),
                "a": item.get("a", ""),
                "level": item.get("level", ""),
                "frequency": str(item.get("frequency", "0")),
                "test_type": item.get("t", "")
            })
            idx += 1
    return flat

@router.get("/api/db/questions")
def api_get_db_questions(grade: Optional[str] = None, unit: Optional[str] = None, qtype: Optional[str] = None, level: Optional[str] = None, search: Optional[str] = None):
    questions = get_questions(grade=grade, unit=unit, qtype=qtype, level=level, search=search)
    return {"success": True, "questions": questions}

@router.post("/api/db/questions/export")
def api_export_db_questions(req: ExportQuestionsRequest):
    files_dir = get_setting("files_dir")
    questions = get_questions(grade=req.grade, unit=req.unit, qtype=req.qtype, search=req.search)
    if req.ids:
        ids_set = set(req.ids)
        questions = [q for q in questions if q["id"] in ids_set]

    filename = f"exported_questions_{int(time.time())}.{req.format}"
    filepath = os.path.join(files_dir, filename)

    if req.format == "csv":
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["Khối", "Bài", "Dạng đề", "Câu hỏi", "Loại câu", "Phương án 1", "Phương án 2", "Phương án 3", "Phương án 4", "Đáp án", "Mức độ", "Tần suất"])
            for q in questions:
                opts = q.get("o") or []
                opt1 = opts[0] if len(opts) > 0 else ""
                opt2 = opts[1] if len(opts) > 1 else ""
                opt3 = opts[2] if len(opts) > 2 else ""
                opt4 = opts[3] if len(opts) > 3 else ""
                writer.writerow([q.get("grade", ""), q.get("unit", ""), q.get("test_type", ""), q.get("x", ""), q.get("t", ""), opt1, opt2, opt3, opt4, q.get("a", ""), q.get("level", ""), q.get("frequency", "")])
    return {"success": True, "filename": filename, "filepath": filepath}

@router.post("/api/db/questions/import")
async def api_import_db_questions(file: UploadFile = File(...)):
    files_dir = get_setting("files_dir")
    ext = os.path.splitext(file.filename)[1].lower()
    temp_path = os.path.join(files_dir, f"temp_import_q_{int(time.time())}{ext}")
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)

    if ext == ".docx":
        raw_qs = convert_docx_to_json(temp_path)
        questions = flatten_docx_to_questions(raw_qs)
    else:
        questions = parse_question_bank_csv(temp_path)

    count = insert_questions(questions)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    return {"success": True, "count": count}

@router.post("/api/db/questions/validate")
async def api_validate_db_questions(file: UploadFile = File(...)):
    files_dir = get_setting("files_dir")
    ext = os.path.splitext(file.filename)[1].lower()
    temp_path = os.path.join(files_dir, f"temp_val_q_{int(time.time())}{ext}")
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)

    if ext == ".docx":
        raw_qs = convert_docx_to_json(temp_path)
        questions = flatten_docx_to_questions(raw_qs)
    else:
        questions = parse_question_bank_csv(temp_path)

    if os.path.exists(temp_path):
        os.remove(temp_path)

    # Validate duplicates and similarity against existing DB questions and within batch
    import difflib, re
    existing_db = get_questions()
    existing_texts = [re.sub(r'\s+', ' ', q.get("x", "")).strip().lower() for q in existing_db if q.get("x")]
    existing_set = set(existing_texts)

    seen_batch = set()
    for q in questions:
        raw_x = q.get("x", "")
        clean_x = re.sub(r'\s+', ' ', raw_x).strip().lower()
        if not clean_x:
            q["is_duplicate"] = False
            q["is_similar"] = False
            continue

        if clean_x in existing_set or clean_x in seen_batch:
            q["is_duplicate"] = True
            q["is_similar"] = False
            q["duplicate_reason"] = "Trùng lặp hoàn toàn với câu hỏi đã có trong CSDL"
        else:
            q["is_duplicate"] = False
            high_similarity = 0.0
            for ex_t in existing_texts[:500]:
                if abs(len(clean_x) - len(ex_t)) > len(clean_x) * 0.4:
                    continue
                ratio = difflib.SequenceMatcher(None, clean_x, ex_t).quick_ratio()
                if ratio > 0.70 and ratio > high_similarity:
                    high_similarity = ratio
                    if high_similarity >= 0.95:
                        break
            if high_similarity > 0.70:
                q["is_similar"] = True
                q["similarity_ratio"] = round(high_similarity, 2)
                q["duplicate_reason"] = f"Tương đồng {int(high_similarity * 100)}% với câu hỏi trong CSDL"
            else:
                q["is_similar"] = False

            seen_batch.add(clean_x)

    return {"success": True, "items": questions}

@router.post("/api/db/questions/confirm-import")
def api_confirm_db_questions(req: ConfirmQuestionsImportRequest):
    count = insert_questions(req.questions)
    return {"success": True, "count": count}

@router.post("/api/db/questions/delete-multiple")
def api_delete_db_questions(req: DeleteMultipleRequest):
    count = delete_questions(req.ids)
    return {"success": True, "count": count}

@router.delete("/api/db/questions/clear")
def api_clear_db_questions(grade: Optional[str] = None, unit: Optional[str] = None):
    clear_questions(grade, unit)
    return {"success": True}

@router.post("/api/db/questions/increment-frequency")
def api_increment_db_questions_freq(req: DeleteMultipleRequest):
    count = increment_question_frequency(req.ids)
    return {"success": True, "count": count}

@router.post("/api/db/questions/reset-frequency")
def api_reset_db_questions_freq(req: DeleteMultipleRequest):
    count = reset_question_frequency(req.ids)
    return {"success": True, "count": count}

@router.post("/api/db/questions/{id}/edit")
def api_edit_db_question(id: int, req: UpdateQuestionRequest):
    success = update_question(id, req.dict())
    return {"success": success}

@router.get("/api/db/active-grades")
def api_get_active_grades():
    grades = get_active_grades()
    return {"success": True, "grades": grades}
