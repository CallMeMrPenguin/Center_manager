import os
import time
import csv
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from config.settings import get_setting
from services.csv_parser import parse_vocabulary_csv, generate_vocab_docx_from_parsed
from database.db_manager import (
    get_vocabulary, insert_vocabulary, delete_vocabulary, clear_vocabulary, update_vocabulary
)

router = APIRouter()

class DeleteMultipleRequest(BaseModel):
    ids: List[int]

class ExportVocabRequest(BaseModel):
    grade: Optional[int] = None
    unit: Optional[str] = None
    difficulty: Optional[str] = None
    pos: Optional[str] = None
    search: Optional[str] = None
    save_to_documents: Optional[bool] = False
    save_folder_id: Optional[str] = None

class UpdateVocabRequest(BaseModel):
    no: Optional[str] = ""
    grade: Optional[str] = ""
    unit: Optional[str] = ""
    vocabulary: Optional[str] = ""
    pos: Optional[str] = ""
    ipa: Optional[str] = ""
    meaning: Optional[str] = ""
    difficulty: Optional[str] = ""
    root_word: Optional[str] = ""

class ConfirmVocabImportRequest(BaseModel):
    vocab: List[Dict[str, Any]]

@router.get("/api/db/vocab")
def api_get_db_vocab(grade: Optional[str] = None, unit: Optional[str] = None, difficulty: Optional[str] = None, pos: Optional[str] = None, search: Optional[str] = None):
    vocab = get_vocabulary(grade=grade, unit=unit, difficulty=difficulty, pos=pos, search=search)
    return {"success": True, "vocab": vocab}

@router.post("/api/db/vocab/import")
async def api_import_db_vocab(file: UploadFile = File(...)):
    files_dir = get_setting("files_dir")
    temp_path = os.path.join(files_dir, f"temp_import_v_{int(time.time())}.csv")
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)

    vocab = parse_vocabulary_csv(temp_path)
    count = insert_vocabulary(vocab)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    return {"success": True, "count": count}

@router.post("/api/db/vocab/validate")
async def api_validate_db_vocab(file: UploadFile = File(...)):
    files_dir = get_setting("files_dir")
    temp_path = os.path.join(files_dir, f"temp_val_v_{int(time.time())}.csv")
    contents = await file.read()
    with open(temp_path, "wb") as f:
        f.write(contents)

    vocab = parse_vocabulary_csv(temp_path)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    return {"success": True, "items": vocab}

@router.post("/api/db/vocab/confirm-import")
def api_confirm_db_vocab(req: ConfirmVocabImportRequest):
    count = insert_vocabulary(req.vocab)
    return {"success": True, "count": count}

@router.post("/api/db/vocab/delete-multiple")
def api_delete_db_vocab(req: DeleteMultipleRequest):
    count = delete_vocabulary(req.ids)
    return {"success": True, "count": count}

@router.delete("/api/db/vocab/clear")
def api_clear_db_vocab(grade: Optional[str] = None, unit: Optional[str] = None):
    clear_vocabulary(grade, unit)
    return {"success": True}

@router.post("/api/db/vocab/export")
def api_export_db_vocab_docx(req: ExportVocabRequest):
    files_dir = get_setting("files_dir")
    vocab = get_vocabulary(grade=req.grade, unit=req.unit, difficulty=req.difficulty, pos=req.pos, search=req.search)
    filename = f"vocab_export_{int(time.time())}.docx"
    filepath = os.path.join(files_dir, filename)
    generate_vocab_docx_from_parsed(vocab, filepath)
    return {"success": True, "filename": filename, "filepath": filepath}

@router.post("/api/db/vocab/export-csv")
def api_export_db_vocab_csv(req: ExportVocabRequest):
    files_dir = get_setting("files_dir")
    vocab = get_vocabulary(grade=req.grade, unit=req.unit, difficulty=req.difficulty, pos=req.pos, search=req.search)
    filename = f"vocab_export_{int(time.time())}.csv"
    filepath = os.path.join(files_dir, filename)
    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["STT", "Khối", "Bài", "Từ vựng", "Từ loại", "Phát âm (IPA)", "Nghĩa tiếng Việt", "Độ khó", "Từ gốc"])
        for v in vocab:
            writer.writerow([v.get("no", ""), v.get("grade", ""), v.get("unit", ""), v.get("vocabulary", ""), v.get("pos", ""), v.get("ipa", ""), v.get("meaning", ""), v.get("difficulty", ""), v.get("root_word", "")])
    return {"success": True, "filename": filename, "filepath": filepath}

@router.post("/api/db/vocab/{id}/edit")
def api_edit_db_vocab(id: int, req: UpdateVocabRequest):
    success = update_vocabulary(id, req.dict())
    return {"success": success}
