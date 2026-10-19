import os
import re
import json
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.formatting.rule import FormulaRule, CellIsRule

from config.settings import get_setting
from database.db_manager import get_classes, get_class_attendance_grades
from database.utils import trunc_1_dec
try:
    from services.export_docx_service import export_class_docx as _export_class_docx_impl
except ImportError:
    from backend.services.export_docx_service import export_class_docx as _export_class_docx_impl
try:
    from services.export_excel_service import export_class_excel as _export_class_excel_impl
except ImportError:
    from backend.services.export_excel_service import export_class_excel as _export_class_excel_impl

def get_session_test_config(class_id: int, date_str: str) -> Optional[Dict[str, Any]]:
    try:
        from database.connection import get_connection
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT test_config_json FROM class_sessions WHERE class_id = ? AND date = ?",
                (class_id, date_str)
            )
            row = cursor.fetchone()
            if row:
                raw = row[0] if isinstance(row, (tuple, list)) else (row.get("test_config_json") if hasattr(row, "get") else row["test_config_json"])
                if raw:
                    if isinstance(raw, dict):
                        return raw
                    return json.loads(raw)
        finally:
            conn.close()
    except Exception:
        pass
    return None

def format_check_content(cfg: Optional[Dict[str, Any]]) -> str:
    if not cfg or not isinstance(cfg, dict):
        return ""
    skill = cfg.get("skill", "")
    units = cfg.get("units", [])
    if isinstance(units, str):
        units = [units]
    units_str = ", ".join([str(u).strip() for u in units if str(u).strip()])

    skill_labels = {
        "vocab": "Từ vựng",
        "grammar": "Ngữ pháp",
        "mixed": "Tổng hợp",
        "mock_test": "Luyện đề",
        "reading": "Đọc hiểu",
        "listening": "Nghe",
        "speaking": "Nói",
        "writing": "Viết",
    }
    skill_name = skill_labels.get(skill, skill.capitalize() if skill else "")

    topic = (cfg.get("topic") or "").strip().replace("|", "-")
    grammar_topic = (cfg.get("grammar_topic") or "").strip().replace("|", "-")

    detail_parts = []
    if units_str:
        detail_parts.append(units_str)

    if skill == "vocab":
        if topic:
            detail_parts.append(topic)
        elif grammar_topic:
            detail_parts.append(grammar_topic)
    elif skill == "grammar":
        if grammar_topic:
            detail_parts.append(grammar_topic)
        elif topic:
            detail_parts.append(topic)
    else:
        items = [x for x in (topic, grammar_topic) if x and x not in detail_parts]
        if items:
            detail_parts.append(" - ".join(items))

    details = " - ".join(detail_parts) if detail_parts else ""
    if skill_name and details:
        return f"{skill_name}: {details}"
    elif details:
        return details
    elif skill_name:
        return skill_name
    return ""

def clean_num(val: Any) -> float:
    if val is None:
        return 0.0
    val_str = str(val).strip()
    if not val_str or "không" in val_str.lower():
        return 0.0
    match = re.search(r"[-+]?\d*\.\d+|\d+", val_str)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return 0.0
    return 0.0

def export_class_excel(
    class_id: int,
    date_str: Optional[str] = None,
    records: Optional[List[Dict[str, Any]]] = None,
    thresholds: Optional[Dict[str, Any]] = None,
    test_config: Optional[Dict[str, Any]] = None,
    visible_columns: Optional[List[str]] = None,
) -> Dict[str, Any]:
    return _export_class_excel_impl(
        class_id=class_id,
        date_str=date_str,
        records=records,
        thresholds=thresholds,
        test_config=test_config,
        visible_columns=visible_columns,
        format_check_content_fn=format_check_content,
        get_session_test_config_fn=get_session_test_config,
        clean_num_fn=clean_num,
    )

def save_export_png(class_id: int, date_str: str, image_base64: str) -> Dict[str, Any]:
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")

    cls_list = get_classes()
    cls_info = next((c for c in cls_list if c["id"] == class_id), None)
    class_name = cls_info["class_name"] if cls_info else f"Class_{class_id}"

    files_dir = get_setting("files_dir")
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "workspace_files")
    os.makedirs(files_dir, exist_ok=True)

    ts = datetime.now().strftime("%S-%M-%H -%d=%m-%y")
    ext = "png" if "image/png" in image_base64 else "jpg"
    filename = f"ClassReport_{class_name}_{date_str}_{ts}.{ext}"
    filepath = os.path.join(files_dir, filename)

    # Strip data URL header if present
    raw_b64 = image_base64
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    img_bytes = base64.b64decode(raw_b64)
    with open(filepath, "wb") as f:
        f.write(img_bytes)

    return {"status": "success", "filename": filename, "filepath": filepath}

def export_class_docx(class_id: int, date_str: Optional[str] = None, records: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    return _export_class_docx_impl(
        class_id=class_id,
        date_str=date_str,
        records=records,
        format_check_content_fn=format_check_content,
        get_session_test_config_fn=get_session_test_config,
        clean_num_fn=clean_num,
    )
