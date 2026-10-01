import os
import re
import json
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.formatting.rule import FormulaRule

from config.settings import get_setting
from database.db_manager import get_classes, get_class_attendance_grades
from database.utils import trunc_1_dec
from backend.services.export_docx_service import export_class_docx as _export_class_docx_impl

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
    test_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")

    cls_list = get_classes()
    cls_info = next((c for c in cls_list if c["id"] == class_id), None)
    class_name = cls_info["class_name"] if cls_info else f"Class_{class_id}"

    attendance = records if records is not None else get_class_attendance_grades(class_id, date_str)

    session_cfg = test_config if test_config else get_session_test_config(class_id, date_str)
    c1_content = format_check_content(session_cfg.get("check_1") if session_cfg else None)
    c2_content = format_check_content(session_cfg.get("check_2") if session_cfg else None)

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "DiemDanh"

    # Row 1: Master Header
    ws.merge_cells("A1:J1")
    ws["A1"] = f"BÁO CÁO ĐIỂM DANH & ĐIỂM BÀI HỌC - {class_name.upper()} ({date_str})"
    ws["A1"].font = Font(name="Times New Roman", size=14, bold=True, color="FFFFFF")
    ws["A1"].fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid")
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 38

    # Row 2: Topic subtitle strip
    info_parts = []
    if c1_content:
        info_parts.append(f"Check 1: {c1_content}")
    if c2_content:
        info_parts.append(f"Check 2: {c2_content}")

    if info_parts:
        ws.merge_cells("A2:J2")
        ws["A2"] = "Nội dung kiểm tra: " + "   —   ".join(info_parts)
        ws["A2"].font = Font(name="Times New Roman", size=11, bold=True, color="312E81")
        ws["A2"].fill = PatternFill(start_color="EEF2FF", end_color="EEF2FF", fill_type="solid")
        ws["A2"].alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[2].height = 26
    else:
        ws.cell(row=2, column=1, value="")

    # Row 3: Headers (Exact 10 columns preserved)
    c1_hdr = f"Check 1\n({c1_content})" if c1_content else "Check 1"
    c2_hdr = f"Check 2\n({c2_content})" if c2_content else "Check 2"
    headers = [
        "STT",
        "Họ và Tên",
        "Điểm Danh",
        c1_hdr,
        c2_hdr,
        "BTVN 1",
        "BTVN 2",
        "Luyện Đề",
        "Độ Lệch",
        "Cần Cố Gắng (Dưới TB)"
    ]
    ws.row_dimensions[3].height = 52 if (c1_content or c2_content) else 30

    header_fill = PatternFill(start_color="312E81", end_color="312E81", fill_type="solid")
    header_font = Font(name="Times New Roman", color="FFFFFF", bold=True, size=12)
    data_font = Font(name="Times New Roman", size=12)
    name_font = Font(name="Times New Roman", size=12, bold=True, color="0F172A")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=3, column=col_idx, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border

    start_row = 4
    end_row = start_row + len(attendance) - 1 if len(attendance) > 0 else start_row
    avg_row_idx = end_row + 1

    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

    for idx, r in enumerate(attendance, 1):
        curr_row = start_row + idx - 1
        st_name = str(r.get("student_name", ""))
        status_val = str(r.get("status", "Có mặt"))
        c1 = clean_num(r.get("check_1"))
        c2 = clean_num(r.get("check_2"))
        hw1 = clean_num(r.get("homework"))
        hw2 = clean_num(r.get("homework_2"))
        mt = clean_num(r.get("mock_test"))

        ws.cell(row=curr_row, column=1, value=f"=ROW()-3")
        c2_c = ws.cell(row=curr_row, column=2, value=st_name)
        c2_c.font = name_font
        ws.cell(row=curr_row, column=3, value=status_val)

        c1_cell = ws.cell(row=curr_row, column=4, value=c1 if c1 > 0 else "-")
        c2_cell = ws.cell(row=curr_row, column=5, value=c2 if c2 > 0 else "-")
        hw1_cell = ws.cell(row=curr_row, column=6, value=hw1 if hw1 > 0 else "-")
        hw2_cell = ws.cell(row=curr_row, column=7, value=hw2 if hw2 > 0 else "-")
        mt_cell = ws.cell(row=curr_row, column=8, value=mt if mt > 0 else "-")

        if c1 > 0: c1_cell.number_format = '0.0'
        if c2 > 0: c2_cell.number_format = '0.0'
        if hw1 > 0: hw1_cell.number_format = '0.0'
        if hw2 > 0: hw2_cell.number_format = '0.0'
        if mt > 0: mt_cell.number_format = '0.0'

        # Formula: |BTVN - Average(Check 1, Check 2)|
        c9_cell = ws.cell(
            row=curr_row,
            column=9,
            value=(
                f'=IF(AND(ISNUMBER(F{curr_row}), F{curr_row}>0), '
                f'IF(AND(ISNUMBER(D{curr_row}), D{curr_row}>0, ISNUMBER(E{curr_row}), E{curr_row}>0), ROUND(ABS(F{curr_row}-AVERAGE(D{curr_row},E{curr_row})), 1), '
                f'IF(AND(ISNUMBER(D{curr_row}), D{curr_row}>0), ROUND(ABS(F{curr_row}-D{curr_row}), 1), '
                f'IF(AND(ISNUMBER(E{curr_row}), E{curr_row}>0), ROUND(ABS(F{curr_row}-E{curr_row}), 1), "-"))), "-")'
            )
        )
        c9_cell.number_format = '0.0'

        # Formula: Below threshold check comparing dynamically against D$avg_row_idx, E$avg_row_idx...
        ws.cell(
            row=curr_row,
            column=10,
            value=(
                f'=IF(C{curr_row}="Vắng mặt", "Vắng mặt", '
                f'IF(_xlfn.TEXTJOIN(", ", TRUE, '
                f'IF(AND(ISNUMBER(D{curr_row}), D{curr_row}>0, ISNUMBER(D${avg_row_idx}), D{curr_row}<D${avg_row_idx}), "Check 1", ""), '
                f'IF(AND(ISNUMBER(E{curr_row}), E{curr_row}>0, ISNUMBER(E${avg_row_idx}), E{curr_row}<E${avg_row_idx}), "Check 2", ""), '
                f'IF(AND(ISNUMBER(F{curr_row}), F{curr_row}>0, ISNUMBER(F${avg_row_idx}), F{curr_row}<F${avg_row_idx}), "BTVN 1", ""), '
                f'IF(AND(ISNUMBER(G{curr_row}), G{curr_row}>0, ISNUMBER(G${avg_row_idx}), G{curr_row}<G${avg_row_idx}), "BTVN 2", ""), '
                f'IF(AND(ISNUMBER(H{curr_row}), H{curr_row}>0, ISNUMBER(H${avg_row_idx}), H{curr_row}<H${avg_row_idx}), "Luyện Đề", "")'
                f')="", "Đạt yêu cầu", '
                f'"Cần cố gắng (" & _xlfn.TEXTJOIN(", ", TRUE, '
                f'IF(AND(ISNUMBER(D{curr_row}), D{curr_row}>0, ISNUMBER(D${avg_row_idx}), D{curr_row}<D${avg_row_idx}), "Check 1", ""), '
                f'IF(AND(ISNUMBER(E{curr_row}), E{curr_row}>0, ISNUMBER(E${avg_row_idx}), E{curr_row}<E${avg_row_idx}), "Check 2", ""), '
                f'IF(AND(ISNUMBER(F{curr_row}), F{curr_row}>0, ISNUMBER(F${avg_row_idx}), F{curr_row}<F${avg_row_idx}), "BTVN 1", ""), '
                f'IF(AND(ISNUMBER(G{curr_row}), G{curr_row}>0, ISNUMBER(G${avg_row_idx}), G{curr_row}<G${avg_row_idx}), "BTVN 2", ""), '
                f'IF(AND(ISNUMBER(H{curr_row}), H{curr_row}>0, ISNUMBER(H${avg_row_idx}), H{curr_row}<H${avg_row_idx}), "Luyện Đề", "")'
                f') & ")"))'
            )
        )

        row_fill = white_fill if (idx % 2 == 1) else zebra_fill
        ws.row_dimensions[curr_row].height = 24
        for col_num in range(1, 11):
            c_cell = ws.cell(row=curr_row, column=col_num)
            if col_num != 2:
                c_cell.font = data_font
            c_cell.fill = row_fill
            c_cell.border = thin_border
            c_cell.alignment = Alignment(horizontal="center", vertical="center")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    if len(attendance) > 0:
        table_ref = f"A3:J{end_row}"
        tab = Table(displayName=f"ClassTable_{ts}", ref=table_ref)
        tab.tableStyleInfo = TableStyleInfo(
            name="TableStyleMedium9",
            showFirstColumn=False,
            showLastColumn=False,
            showRowStripes=True,
            showColumnStripes=False
        )
        ws.add_table(tab)

        red_font = Font(name="Times New Roman", size=12, color="B91C1C", bold=True)
        green_font = Font(name="Times New Roman", size=12, color="15803D", bold=True)
        grey_font = Font(name="Times New Roman", size=12, color="64748B", bold=True)

        ws.conditional_formatting.add(f"J4:J{end_row}", FormulaRule(formula=['NOT(ISERROR(SEARCH("Cần cố gắng", J4)))'], font=red_font))
        ws.conditional_formatting.add(f"J4:J{end_row}", FormulaRule(formula=['NOT(ISERROR(SEARCH("Đạt yêu cầu", J4)))'], font=green_font))
        ws.conditional_formatting.add(f"J4:J{end_row}", FormulaRule(formula=['NOT(ISERROR(SEARCH("Vắng mặt", J4)))'], font=grey_font))

    # Average / Threshold Row
    ws.cell(row=avg_row_idx, column=1, value="")
    ws.cell(row=avg_row_idx, column=2, value="Điểm trung bình (Average)")
    ws.cell(row=avg_row_idx, column=3, value="")

    c1_vals = [clean_num(r.get("check_1")) for r in attendance if clean_num(r.get("check_1")) > 0 and str(r.get("status")) != "Vắng mặt"]
    c2_vals = [clean_num(r.get("check_2")) for r in attendance if clean_num(r.get("check_2")) > 0 and str(r.get("status")) != "Vắng mặt"]
    hw1_vals = [clean_num(r.get("homework")) for r in attendance if clean_num(r.get("homework")) > 0 and str(r.get("status")) != "Vắng mặt"]
    hw2_vals = [clean_num(r.get("homework_2")) for r in attendance if clean_num(r.get("homework_2")) > 0 and str(r.get("status")) != "Vắng mặt"]
    mt_vals = [clean_num(r.get("mock_test")) for r in attendance if clean_num(r.get("mock_test")) > 0 and str(r.get("status")) != "Vắng mặt"]

    calc_avg_1 = trunc_1_dec(sum(c1_vals) / len(c1_vals)) if c1_vals else 0.0
    calc_avg_2 = trunc_1_dec(sum(c2_vals) / len(c2_vals)) if c2_vals else 0.0
    calc_avg_hw1 = trunc_1_dec(sum(hw1_vals) / len(hw1_vals)) if hw1_vals else 0.0
    calc_avg_hw2 = trunc_1_dec(sum(hw2_vals) / len(hw2_vals)) if hw2_vals else 0.0
    calc_avg_mt = trunc_1_dec(sum(mt_vals) / len(mt_vals)) if mt_vals else 0.0

    # Prioritize preset thresholds passed from UI if available
    th = thresholds or {}
    def _pick_thresh(key: str, calc_val: float) -> float:
        if key in th and th[key] is not None and str(th[key]).strip() != '':
            try:
                v = float(th[key])
                if v > 0:
                    return trunc_1_dec(v)
            except (ValueError, TypeError):
                pass
        return calc_val

    t_c1 = _pick_thresh("check_1", calc_avg_1)
    t_c2 = _pick_thresh("check_2", calc_avg_2)
    t_hw1 = _pick_thresh("homework", calc_avg_hw1)
    t_hw2 = _pick_thresh("homework_2", calc_avg_hw2)
    t_mt = _pick_thresh("mock_test", calc_avg_mt)

    c1_avg_cell = ws.cell(row=avg_row_idx, column=4, value=t_c1 if t_c1 > 0 else "-")
    c2_avg_cell = ws.cell(row=avg_row_idx, column=5, value=t_c2 if t_c2 > 0 else "-")
    hw1_avg_cell = ws.cell(row=avg_row_idx, column=6, value=t_hw1 if t_hw1 > 0 else "-")
    hw2_avg_cell = ws.cell(row=avg_row_idx, column=7, value=t_hw2 if t_hw2 > 0 else "-")
    mt_avg_cell = ws.cell(row=avg_row_idx, column=8, value=t_mt if t_mt > 0 else "-")

    if t_c1 > 0: c1_avg_cell.number_format = '0.0'
    if t_c2 > 0: c2_avg_cell.number_format = '0.0'
    if t_hw1 > 0: hw1_avg_cell.number_format = '0.0'
    if t_hw2 > 0: hw2_avg_cell.number_format = '0.0'
    if t_mt > 0: mt_avg_cell.number_format = '0.0'

    check_avgs = [a for a in (t_c1, t_c2) if a > 0]
    check_combined = sum(check_avgs) / len(check_avgs) if check_avgs else 0.0
    diff_val = trunc_1_dec(abs(t_hw1 - check_combined)) if (t_hw1 > 0 and check_combined > 0) else 0.0

    c9_avg_cell = ws.cell(row=avg_row_idx, column=9, value=diff_val if diff_val > 0 else "-")
    if diff_val > 0: c9_avg_cell.number_format = '0.0'
    ws.cell(row=avg_row_idx, column=10, value="Đã tính TB lớp")

    avg_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    avg_font = Font(name="Times New Roman", bold=True, size=12, color="92400E")
    ws.row_dimensions[avg_row_idx].height = 26
    for col_num in range(1, 11):
        c_cell = ws.cell(row=avg_row_idx, column=col_num)
        c_cell.font = avg_font
        c_cell.fill = avg_fill
        c_cell.border = thin_border
        c_cell.alignment = Alignment(horizontal="center", vertical="center")

    # Blank spacing row
    ws.row_dimensions[avg_row_idx + 1].height = 12

    # Summary rows (Below Average Lists) - concise labels (Check 1, Check 2, BTVN)
    candidate_labels = [
        ("Check 1", 4, "D", t_c1),
        ("Check 2", 5, "E", t_c2),
        ("BTVN", 6, "F", t_hw1),
    ]
    if t_hw2 > 0 or len(hw2_vals) > 0:
        candidate_labels.append(("BTVN 2", 7, "G", t_hw2))
    if t_mt > 0 or len(mt_vals) > 0:
        candidate_labels.append(("Luyện Đề", 8, "H", t_mt))

    for idx, (m_label, col_num, col_let, thresh_val) in enumerate(candidate_labels):
        r_idx = avg_row_idx + 2 + idx
        ws.row_dimensions[r_idx].height = 28
        ws.merge_cells(f"A{r_idx}:B{r_idx}")

        m_label_clean = m_label.replace('"', '""')
        sum_title = ws.cell(
            row=r_idx,
            column=1,
            value=f'=IF(AND(ISNUMBER({col_let}${avg_row_idx}), {col_let}${avg_row_idx}>0), "{m_label_clean} dưới TB (< " & TEXT({col_let}${avg_row_idx}, "0.0") & ")", "{m_label_clean}")'
        )
        sum_title.font = Font(name="Times New Roman", bold=True, color="7F1D1D", size=12)
        sum_title.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        sum_title.border = thin_border
        ws.cell(row=r_idx, column=2).border = thin_border

        ws.merge_cells(f"C{r_idx}:J{r_idx}")
        val_cell = ws.cell(
            row=r_idx,
            column=3,
            value=f'=_xlfn.TEXTJOIN(", ", TRUE, _xlfn.FILTER(B{start_row}:B{end_row}, (ISNUMBER({col_let}{start_row}:{col_let}{end_row}))*({col_let}{start_row}:{col_let}{end_row}>0)*({col_let}{start_row}:{col_let}{end_row}<{col_let}${avg_row_idx})*(C{start_row}:C{end_row}<>"Vắng mặt"), "Không có (Tất cả đạt)"))' if len(attendance) > 0 else "Không có (Tất cả đạt)"
        )
        val_cell.font = Font(name="Times New Roman", bold=True, color="1E1E2F", size=12)
        val_cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        for cn in range(3, 11):
            ws.cell(row=r_idx, column=cn).border = thin_border

    # Optimized column widths
    col_widths = {
        1: 8,   # STT
        2: 24,  # Họ và Tên
        3: 14,  # Điểm Danh
        4: 28,  # Check 1
        5: 28,  # Check 2
        6: 12,  # BTVN 1
        7: 12,  # BTVN 2
        8: 12,  # Luyện Đề
        9: 14,  # Độ Lệch
        10: 38, # Cần Cố Gắng
    }
    for col_idx, width in col_widths.items():
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width

    files_dir = get_setting("files_dir")
    if not files_dir or not os.path.exists(files_dir):
        files_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "workspace_files")
    os.makedirs(files_dir, exist_ok=True)
    filename = f"ClassReport_{class_name}_{date_str}_{ts}.xlsx"
    filepath = os.path.join(files_dir, filename)
    wb.save(filepath)
    return {"status": "success", "filename": filename, "filepath": filepath}

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

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ClassReport_{class_name}_{date_str}_{ts}.png"
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
