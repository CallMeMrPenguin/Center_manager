import os
import sys
import json
import subprocess
import shutil
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from config.settings import load_settings, save_settings, get_setting, BASE_DIR
try:
    from services.compiler import WordDocumentCompiler
except Exception:
    WordDocumentCompiler = None

router = APIRouter()

class CompileModel(BaseModel):
    exercises: List[Dict[str, Any]]
    settings: Optional[Dict[str, Any]] = None
    num_versions: Optional[int] = 1
    mix_options: Optional[bool] = True
    grade: Optional[str] = ''
    unit: Optional[str] = ''
    save_folder_id: Optional[str] = None

class CompileFileRequest(BaseModel):
    filename: str
    settings: Optional[Dict[str, Any]] = None

class MergeRequest(BaseModel):
    filenames: List[str]
    output_filename: str

class FormatVocabRequest(BaseModel):
    filename: str
    settings: Optional[Dict[str, Any]] = None

class ConvertCsvRequest(BaseModel):
    filename: str
    output_format: Optional[str] = 'json'

class ConvertDocxRequest(BaseModel):
    filename: str
    output_format: Optional[str] = 'json'

class ExportTestExcelCsvRequest(BaseModel):
    platform: str
    questions: List[Dict[str, Any]]
    default_time: Optional[int] = 30
    default_points: Optional[int] = 1
    test_title: Optional[str] = 'English Test'
    exam_code: Optional[str] = ''

def get_compiler():
    try:
        from services.compiler import WordDocumentCompiler
        return WordDocumentCompiler
    except Exception:
        return None

def get_format_vocabulary_file():
    try:
        from services.vocab_formatter import format_vocabulary_file
        return format_vocabulary_file
    except Exception:
        return None

def get_csv_parser():
    try:
        from services.csv_parser import parse_question_bank_csv
        return parse_question_bank_csv
    except Exception:
        return None

def get_docx_parser():
    try:
        from services.docx_parser import convert_docx_to_json
        return convert_docx_to_json
    except Exception:
        return None

def get_file_path(filename: str) -> Optional[str]:
    files_dir = get_setting('files_dir')
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(BASE_DIR, 'workspace_files')
    safe_base = os.path.abspath(files_dir)
    p = os.path.abspath(os.path.join(files_dir, filename))
    if not p.startswith(safe_base):
        return None
    if os.path.exists(p):
        return p
    fname = os.path.basename(filename)
    for root, _, files in os.walk(files_dir):
        if fname in files:
            return os.path.join(root, fname)
    return None

@router.post("/api/test/compile")
def api_compile_test(req: CompileModel):
    try:
        files_dir = get_setting("files_dir")
        if not files_dir or not os.path.exists(files_dir):
            files_dir = os.path.join(BASE_DIR, "workspace_files")
        os.makedirs(files_dir, exist_ok=True)

        target_dir = files_dir
        if req.save_folder_id:
            sub_dir = os.path.join(files_dir, req.save_folder_id)
            if os.path.exists(sub_dir):
                target_dir = sub_dir

        compiler_cls = get_compiler()
        if not compiler_cls:
            raise HTTPException(status_code=500, detail="WordDocumentCompiler not available")
        compiler = compiler_cls(req.settings)
        filename, filepath, files_list = compiler.compile_test_versions(
            req.exercises,
            num_versions=req.num_versions or 1,
            mix_options=req.mix_options if req.mix_options is not None else True,
            grade=req.grade or "",
            unit=req.unit or "",
            output_dir=target_dir
        )
        return {"success": True, "filename": filename, "filepath": filepath, "files": files_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/test/preview-pdf")
def api_preview_pdf(req: CompileModel):
    try:
        compiler_cls = get_compiler()
        if not compiler_cls:
            raise HTTPException(status_code=500, detail="WordDocumentCompiler not available")
        compiler = compiler_cls(req.settings)
        docx_filename, docx_path, _ = compiler.compile_test_versions(
            req.exercises,
            num_versions=1,
            mix_options=req.mix_options if req.mix_options is not None else True,
            grade=req.grade or "",
            unit=req.unit or ""
        )
        pdf_dir = os.path.join(BASE_DIR, "backend", "temp_pdf_previews")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_filename = os.path.splitext(docx_filename)[0] + ".pdf"
        pdf_path = os.path.join(pdf_dir, pdf_filename)
        success = compiler.convert_docx_to_pdf_soffice(docx_path, pdf_path)
        if not success or not os.path.exists(pdf_path):
            raise HTTPException(status_code=500, detail="Lỗi khi tạo PDF preview bằng LibreOffice")
        return {"success": True, "url": f"/pdf-previews/{pdf_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/settings")
def api_get_settings():
    try:
        from database.crud_settings import get_db_setting
        base_settings = load_settings()
        for k in ["grade_weights", "grade_types", "app_config"]:
            val = get_db_setting(k)
            if val is not None:
                base_settings[k] = val
        return base_settings
    except Exception:
        return load_settings()

@router.post("/api/settings")
def api_save_settings(settings: Dict[str, Any]):
    try:
        from database.crud_settings import save_db_setting
        save_settings(settings)
        for k, v in settings.items():
            save_db_setting(k, v)
        return {"success": True}
    except Exception as e:
        save_settings(settings)
        return {"success": True}

@router.get("/api/files")
def api_get_files():
    result = []
    files_dir = get_setting("files_dir")
    if os.path.exists(files_dir):
        for item in os.listdir(files_dir):
            item_path = os.path.join(files_dir, item)
            if os.path.isfile(item_path):
                stat = os.stat(item_path)
                result.append({"name": item, "path": item_path, "size": stat.st_size, "mtime": stat.st_mtime})
        json_dir = os.path.join(files_dir, "json")
        if os.path.exists(json_dir):
            for item in os.listdir(json_dir):
                item_path = os.path.join(json_dir, item)
                if os.path.isfile(item_path):
                    stat = os.stat(item_path)
                    result.append({"name": f"json/{item}", "path": item_path, "size": stat.st_size, "mtime": stat.st_mtime})
    return result

@router.post("/api/files/upload")
async def api_upload_file(file: UploadFile = File(...)):
    files_dir = get_setting("files_dir")
    filename = file.filename
    target_path = get_file_path(files_dir, filename)
    contents = await file.read()
    with open(target_path, "wb") as f:
        f.write(contents)
    return {"success": True, "filename": filename}

@router.delete("/api/files/{filename:path}")
def api_delete_file(filename: str):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"success": True}
    raise HTTPException(status_code=404, detail="File not found")

@router.get("/api/files/download/{filename:path}")
def api_download_file(filename: str):
    fname = os.path.basename(filename)
    files_dir = get_setting("files_dir")
    
    candidates = [
        get_file_path(files_dir, filename),
        os.path.join(files_dir, fname) if files_dir else "",
        os.path.join(BASE_DIR, "temp_compiled", fname),
        os.path.join(os.getcwd(), "temp_compiled", fname),
        os.path.join(BASE_DIR, "backend", "temp_compiled", fname)
    ]

    import mimetypes
    media_type, _ = mimetypes.guess_type(fname)
    if not media_type:
        if fname.endswith(".xlsx"): media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif fname.endswith(".docx"): media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif fname.endswith(".png"): media_type = "image/png"
        else: media_type = "application/octet-stream"

    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return FileResponse(
                candidate, 
                filename=fname, 
                media_type=media_type
            )
        
    raise HTTPException(status_code=404, detail=f"File '{fname}' not found")

@router.get("/api/files/preview-pdf/{filename:path}")
def api_preview_pdf_file(filename: str):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    pdf_dir = os.path.join(BASE_DIR, "backend", "temp_pdf_previews")
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_filename = os.path.splitext(os.path.basename(filename))[0] + ".pdf"
    pdf_path = os.path.join(pdf_dir, pdf_filename)

    compiler_cls = get_compiler()
    if not compiler_cls:
        raise HTTPException(status_code=500, detail="WordDocumentCompiler not available")
    compiler = compiler_cls()
    success = compiler.convert_docx_to_pdf_soffice(filepath, pdf_path)
    if not success or not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Không thể tạo bản xem trước PDF")
    return FileResponse(pdf_path, media_type="application/pdf")

@router.post("/api/files/compile")
def api_compile_file(req: CompileFileRequest):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, req.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    exercises = data.get("exercises", [])
    
    profiles = load_profiles()
    settings = profiles.get(req.profile_name, profiles.get("Default Settings"))

    compiler_cls = get_compiler()
    if not compiler_cls:
        raise HTTPException(status_code=500, detail="WordDocumentCompiler not available")
    compiler = compiler_cls(settings)
    out_filename, out_filepath, _ = compiler.compile_test_versions(exercises, num_versions=1, mix_options=True)
    return {"success": True, "filename": out_filename, "filepath": out_filepath}

@router.post("/api/files/merge-vocabulary")
def api_merge_vocabulary(req: MergeRequest):
    files_dir = get_setting("files_dir")
    process_func = get_process_grade()
    if not process_func:
        raise HTTPException(status_code=500, detail="process_grade service not available")
    try:
        filename, filepath = process_func(req.grade, files_dir)
        return {"success": True, "filename": filename, "filepath": filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/files/format-vocabulary")
def api_format_vocabulary(req: FormatVocabRequest):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, req.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    format_func = get_format_vocabulary_file()
    if not format_func:
        raise HTTPException(status_code=500, detail="format_vocabulary service not available")
    try:
        out_filename, out_filepath = format_func(filepath, files_dir)
        return {"success": True, "filename": out_filename, "filepath": out_filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/files/convert-csv")
def api_convert_csv(req: ConvertCsvRequest):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, req.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    parse_csv = get_csv_parser()
    if not parse_csv:
        raise HTTPException(status_code=500, detail="parse_question_bank_csv service not available")
    try:
        q = parse_csv(filepath)
        out_filename = os.path.splitext(req.filename)[0] + ".json"
        out_filepath = get_file_path(files_dir, out_filename)
        with open(out_filepath, "w", encoding="utf-8") as f:
            json.dump({"exercises": q}, f, indent=4, ensure_ascii=False)
        return {"success": True, "filename": out_filename, "filepath": out_filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/files/convert-docx")
def api_convert_docx(req: ConvertDocxRequest):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, req.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    convert_docx = get_docx_parser()
    if not convert_docx:
        raise HTTPException(status_code=500, detail="convert_docx_to_json service not available")
    try:
        result = convert_docx(filepath)
        out_filename = os.path.splitext(req.filename)[0] + ".json"
        out_filepath = get_file_path(files_dir, out_filename)
        with open(out_filepath, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=4, ensure_ascii=False)
        return {
            "success": True,
            "filename": out_filename,
            "filepath": out_filepath,
            "exercises": result,
            "questions": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/files/system-check")
def api_system_check():
    libreoffice = shutil.which("soffice") or shutil.which("libreoffice") or os.path.exists(r"C:\Program Files\LibreOffice\program\soffice.exe") or os.path.exists(r"C:\Program Files (x86)\LibreOffice\program\soffice.exe")
    word_installed = False
    try:
        import win32com.client
        word_installed = True
    except Exception:
        word_installed = libreoffice is not None

    py_ver = f"Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    return {
        "word_installed": word_installed,
        "win32_com_error": None,
        "python_version": py_ver,
        "docx_library_present": True,
        "libreoffice_installed": libreoffice is not None,
        "libreoffice_path": shutil.which("soffice") or shutil.which("libreoffice")
    }

@router.post("/api/test/export-excel-csv")
def api_export_test_excel_csv(req: ExportTestExcelCsvRequest):
    import copy
    import random
    import re
    files_dir = get_setting("files_dir")
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(BASE_DIR, "workspace_files")
    os.makedirs(files_dir, exist_ok=True)

    filename = f"exported_test_{int(time.time())}.{req.format}"
    filepath = os.path.join(files_dir, filename)

    exercises = copy.deepcopy(req.exercises or [])

    if req.mix_options:
        def _mix_item(item: Dict[str, Any]):
            opts = item.get("o", [])
            raw_ans = str(item.get("a", "")).strip()
            if opts and len(opts) > 1 and raw_ans:
                match = re.search(r'\b([A-Ea-e])\b', raw_ans)
                if match:
                    correct_letter = match.group(1).upper()
                    ans_idx = ord(correct_letter) - ord("A")
                    if 0 <= ans_idx < len(opts):
                        correct_val = opts[ans_idx]
                        shuffled_opts = list(opts)
                        random.shuffle(shuffled_opts)
                        new_ans_idx = shuffled_opts.index(correct_val)
                        item["o"] = shuffled_opts
                        item["a"] = chr(ord("A") + new_ans_idx)

        for ex in exercises:
            _mix_item(ex)
            for sub_key in ["k", "questions"]:
                sub_list = ex.get(sub_key)
                if isinstance(sub_list, list):
                    for sub in sub_list:
                        if isinstance(sub, dict):
                            _mix_item(sub)

    # Flatten questions list
    flattened_rows = []
    idx = 1
    for ex in exercises:
        ex_title = ex.get("title") or ex.get("instruction") or ex.get("x") or ex.get("t", "")
        ex_type = ex.get("t", "")

        sub_items = []
        for sub_key in ["k", "questions"]:
            if isinstance(ex.get(sub_key), list) and len(ex[sub_key]) > 0:
                sub_items = ex[sub_key]
                break

        if sub_items:
            for sub in sub_items:
                if not isinstance(sub, dict):
                    continue
                opts = sub.get("o") or []
                o1 = opts[0] if len(opts) > 0 else ""
                o2 = opts[1] if len(opts) > 1 else ""
                o3 = opts[2] if len(opts) > 2 else ""
                o4 = opts[3] if len(opts) > 3 else ""
                q_text = sub.get("x", "")
                q_ans = sub.get("a", "")
                flattened_rows.append([idx, ex_title, q_text, ex_type, o1, o2, o3, o4, q_ans])
                idx += 1
        else:
            opts = ex.get("o") or []
            o1 = opts[0] if len(opts) > 0 else ""
            o2 = opts[1] if len(opts) > 1 else ""
            o3 = opts[2] if len(opts) > 2 else ""
            o4 = opts[3] if len(opts) > 3 else ""
            q_text = ex.get("x", "")
            q_ans = ex.get("a", "")
            flattened_rows.append([idx, ex_title, q_text, ex_type, o1, o2, o3, o4, q_ans])
            idx += 1

    headers = ["STT", "Dạng bài", "Nội dung câu hỏi", "Loại câu", "Phương án 1", "Phương án 2", "Phương án 3", "Phương án 4", "Đáp án"]

    if req.format == "xlsx":
        try:
            import pandas as pd
            df = pd.DataFrame(flattened_rows, columns=headers)
            df.to_excel(filepath, index=False)
        except Exception:
            # Fallback to CSV if pandas/openpyxl is unavailable
            with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                writer.writerows(flattened_rows)
    else:
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(flattened_rows)

    return {"success": True, "filename": filename, "filepath": filepath}
