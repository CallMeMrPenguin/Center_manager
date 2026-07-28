import os
import sys
import json
import shutil
import time
import threading
import csv
import tkinter as tk
from tkinter import filedialog
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from config.settings import load_settings, save_settings, get_setting, BASE_DIR
from services.compiler import WordDocumentCompiler
from services.combine_and_format import process_grade
from services.format_vocabulary import format_vocabulary_file
from services.csv_parser import parse_question_bank_csv
from services.docx_parser import convert_docx_to_json

# Import updater (lives at project root, BASE_DIR)
try:
    sys.path.insert(0, BASE_DIR)
    import updater as _updater
    _UPDATER_AVAILABLE = True
except Exception:
    _UPDATER_AVAILABLE = False
    _updater = None

router = APIRouter()

SERVER_BOOT_TIME = time.time()
CONFIG_PROFILES_FILE = os.path.join(BASE_DIR, "saved_configs.json")
FILES_DIR = get_setting("files_dir")
UNIT_CONFIG_FILE = os.path.join(BASE_DIR, "unit_config.json")
EXERCISE_CONFIG_FILE = os.path.join(BASE_DIR, "exercise_config.json")
PROMPTS_FILE = os.path.join(BASE_DIR, "prompts.json")

DEFAULT_LAYOUT_SETTINGS = {
    "margin_top": 2.0, "margin_bottom": 2.0, "margin_left": 3.0, "margin_right": 1.5,
    "font_name": "Times New Roman", "font_size": 12.0, "line_spacing": 1.15, "space_after": 6.0,
    "header_space_before": 14.0, "header_space_after": 8.0, "question_space_before": 6.0,
    "question_space_after": 4.0, "options_left_indent": 0.5, "options_space_before": 0.0,
    "options_space_after": 3.0, "passage_space_before": 4.0, "passage_space_after": 6.0,
    "passage_indent_first": 0.75, "reorder_space_before": 0.0, "reorder_space_after": 2.0,
    "reorder_left_indent": 1.0, "notice_space_before": 4.0, "notice_space_after": 6.0,
    "notice_left_indent": 1.0
}

def get_file_path(files_dir: str, filename: str) -> str:
    if filename.lower().endswith(".json") or filename.startswith("json/"):
        json_dir = os.path.join(files_dir, "json")
        os.makedirs(json_dir, exist_ok=True)
        clean_name = filename[5:] if filename.startswith("json/") else filename
        return os.path.join(json_dir, clean_name)
    return os.path.join(files_dir, filename)

def load_profiles() -> Dict[str, Any]:
    if os.path.exists(CONFIG_PROFILES_FILE):
        try:
            with open(CONFIG_PROFILES_FILE, "r", encoding="utf-8") as f:
                profiles = json.load(f)
                if isinstance(profiles, dict):
                    if "Default Settings" not in profiles:
                        profiles["Default Settings"] = DEFAULT_LAYOUT_SETTINGS.copy()
                    return profiles
        except Exception:
            pass
    return {"Default Settings": DEFAULT_LAYOUT_SETTINGS.copy()}

def save_profiles(profiles: Dict[str, Any]):
    try:
        with open(CONFIG_PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profiles: {e}")

class ProfileModel(BaseModel):
    name: str
    settings: Dict[str, Any]

class CompileModel(BaseModel):
    exercises: List[Dict[str, Any]]
    settings: Dict[str, Any]
    num_versions: Optional[int] = 1
    mix_options: Optional[bool] = True
    grade: Optional[str] = ""
    unit: Optional[str] = ""
    save_to_documents: Optional[bool] = False
    save_folder_id: Optional[str] = None

class CompileFileRequest(BaseModel):
    filename: str
    profile_name: str

class MergeRequest(BaseModel):
    grade: int

class FormatVocabRequest(BaseModel):
    filename: str

class ConvertCsvRequest(BaseModel):
    filename: str

class ConvertDocxRequest(BaseModel):
    filename: str

class ExportTestExcelCsvRequest(BaseModel):
    exercises: List[Dict[str, Any]]
    format: str
    default_time: Optional[int] = 30
    num_versions: Optional[int] = 1
    mix_options: Optional[bool] = True
    grade: Optional[str] = ""
    unit: Optional[str] = ""

class OpenFileRequest(BaseModel):
    filename: str

@router.get("/api/system/version")
def api_get_system_version():
    return {"boot_time": SERVER_BOOT_TIME}

@router.get("/api/profiles")
def api_get_profiles():
    return load_profiles()

@router.post("/api/profiles")
def api_save_profile(profile: ProfileModel):
    name = profile.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Profile name cannot be empty")
    if name == "Default Settings":
        raise HTTPException(status_code=400, detail="Cannot overwrite Default Settings")
    profiles = load_profiles()
    profiles[name] = profile.settings
    save_profiles(profiles)
    return {"success": True, "profiles": profiles}

@router.delete("/api/profiles/{name}")
def api_delete_profile(name: str):
    if name == "Default Settings":
        raise HTTPException(status_code=400, detail="Cannot delete Default Settings")
    profiles = load_profiles()
    if name in profiles:
        del profiles[name]
        save_profiles(profiles)
        return {"success": True, "profiles": profiles}
    raise HTTPException(status_code=404, detail="Profile not found")

@router.post("/api/test/compile")
def api_compile_test(req: CompileModel):
    try:
        compiler = WordDocumentCompiler(req.settings)
        filename, filepath, files_list = compiler.compile_test_versions(
            req.exercises,
            num_versions=req.num_versions or 1,
            mix_options=req.mix_options if req.mix_options is not None else True,
            grade=req.grade or "",
            unit=req.unit or ""
        )
        return {"success": True, "filename": filename, "filepath": filepath, "files": files_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/test/preview-pdf")
def api_preview_pdf(req: CompileModel):
    try:
        compiler = WordDocumentCompiler(req.settings)
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
    return load_settings()

@router.post("/api/settings")
def api_save_settings(settings: Dict[str, Any]):
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
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, filename)
    if os.path.exists(filepath):
        return FileResponse(filepath, filename=os.path.basename(filename), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    
    temp_path = os.path.join(os.getcwd(), "temp_compiled", filename)
    if os.path.exists(temp_path):
        return FileResponse(temp_path, filename=os.path.basename(filename), media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        
    raise HTTPException(status_code=404, detail="File not found")

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

    compiler = WordDocumentCompiler()
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

    compiler = WordDocumentCompiler(settings)
    out_filename, out_filepath = compiler.compile_test_versions(exercises, num_versions=1, mix_options=True)
    return {"success": True, "filename": out_filename, "filepath": out_filepath}

@router.post("/api/files/merge-vocabulary")
def api_merge_vocabulary(req: MergeRequest):
    files_dir = get_setting("files_dir")
    try:
        filename, filepath = process_grade(req.grade, files_dir)
        return {"success": True, "filename": filename, "filepath": filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/files/format-vocabulary")
def api_format_vocabulary(req: FormatVocabRequest):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, req.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        out_filename, out_filepath = format_vocabulary_file(filepath, files_dir)
        return {"success": True, "filename": out_filename, "filepath": out_filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/files/convert-csv")
def api_convert_csv(req: ConvertCsvRequest):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, req.filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        q = parse_question_bank_csv(filepath)
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
    try:
        result = convert_docx_to_json(filepath)
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
    files_dir = get_setting("files_dir")
    filename = f"exported_test_{int(time.time())}.{req.format}"
    filepath = os.path.join(files_dir, filename)
    if req.format == "csv":
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["STT", "Dạng bài", "Nội dung câu hỏi", "Loại câu", "Phương án 1", "Phương án 2", "Phương án 3", "Phương án 4", "Đáp án"])
            idx = 1
            for ex in req.exercises:
                for q in ex.get("questions", []):
                    opts = q.get("o") or []
                    o1 = opts[0] if len(opts) > 0 else ""
                    o2 = opts[1] if len(opts) > 1 else ""
                    o3 = opts[2] if len(opts) > 2 else ""
                    o4 = opts[3] if len(opts) > 3 else ""
                    writer.writerow([idx, ex.get("title", ""), q.get("x", ""), q.get("t", ""), o1, o2, o3, o4, q.get("a", "")])
                    idx += 1
    return {"success": True, "filename": filename, "filepath": filepath}

@router.post("/api/system/select-directory")
def api_select_directory():
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        folder = filedialog.askdirectory()
        root.destroy()
        return {"success": True, "directory": folder if folder else None}
    except Exception:
        return {"success": False, "directory": None}

@router.get("/api/prompts/{storageKey}")
def api_get_prompts(storageKey: str):
    if os.path.exists(PROMPTS_FILE):
        try:
            with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get(storageKey, [])
        except Exception:
            pass
    return []

@router.post("/api/prompts/{storageKey}")
def api_save_prompts(storageKey: str, payload: Dict[str, Any]):
    data = {}
    if os.path.exists(PROMPTS_FILE):
        try:
            with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            pass
    data[storageKey] = payload.get("prompts", [])
    with open(PROMPTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return {"success": True}

@router.get("/api/unit-config")
def api_get_unit_config():
    if os.path.exists(UNIT_CONFIG_FILE):
        try:
            with open(UNIT_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

@router.post("/api/unit-config")
def api_save_unit_config(config: Dict[str, Any]):
    with open(UNIT_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    return {"success": True}

@router.get("/api/exercise-config")
def api_get_exercise_config():
    if os.path.exists(EXERCISE_CONFIG_FILE):
        try:
            with open(EXERCISE_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

@router.post("/api/exercise-config")
def api_save_exercise_config(config: Dict[str, Any]):
    with open(EXERCISE_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    return {"success": True}

@router.post("/api/utils/open-file")
def api_open_file(req: OpenFileRequest):
    files_dir = get_setting("files_dir")
    filepath = get_file_path(files_dir, req.filename)
    if os.path.exists(filepath):
        os.startfile(filepath)
        return {"success": True}
    raise HTTPException(status_code=404, detail="File not found")

@router.post("/api/utils/open-folder")
def api_open_folder():
    files_dir = get_setting("files_dir")
    if os.path.exists(files_dir):
        os.startfile(files_dir)
        return {"success": True}
    raise HTTPException(status_code=404, detail="Folder not found")


# ─────────────────────────────────────────────
# UPDATE ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/api/system/update-check")
def api_update_check():
    """Check GitHub for a newer release. Returns update state immediately;
    if a check is in progress it returns the current cached state."""
    if not _UPDATER_AVAILABLE:
        return {"error": "Updater module not available", "has_update": False, "current_version": "unknown"}
    # Non-blocking: spawn background check if not already running
    if not _updater._update_state["checking"]:
        threading.Thread(target=_updater.check_for_update, daemon=True).start()
    return _updater.get_update_state()


@router.post("/api/system/update-apply")
def api_update_apply():
    """Download and apply latest update in background. Server will restart after."""
    if not _UPDATER_AVAILABLE:
        raise HTTPException(status_code=503, detail="Updater module not available")
    state = _updater.get_update_state()
    if not state.get("has_update"):
        raise HTTPException(status_code=400, detail="Không có bản cập nhật nào để cài đặt")
    if state.get("applying"):
        return {"success": False, "message": "Đang cập nhật, vui lòng đợi..."}

    def _do_apply():
        success = _updater.apply_update()
        if success:
            _updater.schedule_restart(delay_seconds=3.0)

    threading.Thread(target=_do_apply, daemon=True).start()
    return {"success": True, "message": "Đang tải xuống và cài đặt bản cập nhật..."}


@router.get("/api/system/update-status")
def api_update_status():
    """Poll current update progress state (for frontend polling)."""
    if not _UPDATER_AVAILABLE:
        return {"error": "Updater module not available", "has_update": False, "current_version": "unknown"}
    return _updater.get_update_state()
