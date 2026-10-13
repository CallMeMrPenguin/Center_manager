import os
import sys
import json
import shutil
import time
import threading
import csv
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from config.settings import load_settings, save_settings, get_setting, BASE_DIR
def get_compiler():
    try:
        from services.compiler import WordDocumentCompiler
        return WordDocumentCompiler
    except Exception:
        return None

def get_process_grade():
    try:
        from services.combine_and_format import process_grade
        return process_grade
    except Exception:
        return None

def get_format_vocabulary_file():
    try:
        from services.format_vocabulary import format_vocabulary_file
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
def _resolve_cfg(filename: str) -> str:
    new_p = os.path.join(BASE_DIR, "configs", filename)
    if os.path.exists(new_p): return new_p
    old_p = os.path.join(BASE_DIR, filename)
    return old_p if os.path.exists(old_p) else new_p

CONFIG_PROFILES_FILE = _resolve_cfg("saved_configs.json")

UNIT_CONFIG_FILE = _resolve_cfg("unit_config.json")
EXERCISE_CONFIG_FILE = _resolve_cfg("exercise_config.json")
PROMPTS_FILE = _resolve_cfg("prompts.json")

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
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(BASE_DIR, "workspace_files")
    os.makedirs(files_dir, exist_ok=True)

    if filename.lower().endswith(".json") or filename.startswith("json/"):
        json_dir = os.path.join(files_dir, "json")
        os.makedirs(json_dir, exist_ok=True)
        clean_name = os.path.basename(filename[5:] if filename.startswith("json/") else filename)
        return os.path.join(json_dir, clean_name)

    clean_filename = os.path.basename(filename)
    direct_path = os.path.abspath(os.path.join(files_dir, clean_filename))
    if os.path.exists(direct_path):
        return direct_path

    fname = clean_filename
    for root, _, files in os.walk(files_dir):
        if fname in files:
            return os.path.join(root, fname)

    return direct_path

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
    git_rev = ""
    try:
        import subprocess
        git_rev = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=BASE_DIR, stderr=subprocess.DEVNULL).decode().strip()
    except Exception as e:
        git_rev = str(e)
    return {"boot_time": SERVER_BOOT_TIME, "git_rev": git_rev, "tag": "v_callmemrpenguin_autoheal"}

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


# Include system_compiler sub-router
from .system_compiler import router as compiler_router
router.include_router(compiler_router)

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
    from config.unit_config import load_unit_config
    return load_unit_config()

@router.post("/api/unit-config")
def api_save_unit_config(config: Dict[str, Any]):
    from config.unit_config import save_unit_config
    success = save_unit_config(config)
    return {"success": success}

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
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(BASE_DIR, "workspace_files")

    filepath = req.filename
    if not (os.path.isabs(filepath) and os.path.exists(filepath)):
        filepath = get_file_path(files_dir, req.filename)

    if os.path.exists(filepath):
        abs_path = os.path.abspath(filepath)
        try:
            os.startfile(abs_path)
            return {"success": True}
        except Exception:
            try:
                import subprocess
                subprocess.Popen(['start', '', abs_path], shell=True)
                return {"success": True}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to open file '{abs_path}': {e}")
    raise HTTPException(status_code=404, detail=f"File '{req.filename}' not found at '{filepath}'")

@router.post("/api/utils/open-folder")
def api_open_folder():
    files_dir = get_setting("files_dir")
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(BASE_DIR, "workspace_files")
    os.makedirs(files_dir, exist_ok=True)
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
