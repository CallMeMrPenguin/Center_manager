import os
import sys
from typing import List, Dict, Any, Optional
from .common import cm_to_pt

def pywin32_add_test_header(self, meta: Dict[str, Any]):
    sel = self.word.Selection
    has_version = bool(version_code and str(version_code).strip() != "")
    
    # Add Student Header ("Họ và tên... Lớp...") ONLY if is_test is True
    if is_test:
        if has_version:
            left_margin_cm = self.settings.get("margin_left", 3.0)
            right_margin_cm = self.settings.get("margin_right", 1.5)
            printable_width_cm = 21.0 - left_margin_cm - right_margin_cm
            
            table = self.doc.Tables.Add(Range=sel.Range, NumRows=1, NumColumns=2)
            try:
                table.Rows.Alignment = 1 # Center
            except Exception:
                pass
            table.Columns(1).Width = cm_to_pt(printable_width_cm - 3.5)
            table.Columns(2).Width = cm_to_pt(3.5)
            
            cell_left = table.Cell(1, 1)
            cell_left.Range.ParagraphFormat.SpaceBefore = 0
            cell_left.Range.ParagraphFormat.SpaceAfter = 0
            cell_left.Range.ParagraphFormat.LineSpacingRule = 2
            cell_left.Range.Font.Name = "Times New Roman"
            cell_left.Range.Font.Size = 12
            cell_left.Range.Font.Bold = True
            cell_left.Range.Text = "Họ và tên: ....................................\rLớp: ...................."
            
            cell_right = table.Cell(1, 2)
            cell_right.Range.ParagraphFormat.SpaceBefore = 0
            cell_right.Range.ParagraphFormat.SpaceAfter = 0
            cell_right.Range.Text = ""
            
            try:
                v_num = int(version_code)
                if v_num >= 101:
                    v_num = v_num - 100
                ver_text = f"ĐỀ {v_num}"
            except ValueError:
                ver_text = f"ĐỀ {version_code}"
                
            nested_table = self.doc.Tables.Add(Range=cell_right.Range, NumRows=1, NumColumns=1)
            try:
                nested_table.Rows.Alignment = 2 # Right
            except Exception:
                pass
            nested_table.Columns(1).Width = cm_to_pt(2.5)
            nested_cell = nested_table.Cell(1, 1)
            nested_cell.VerticalAlignment = 1
            
            for border_id in [-1, -2, -3, -4]:
                try:
                    nested_cell.Borders(border_id).LineStyle = 1
                    nested_cell.Borders(border_id).LineWidth = 12
                except Exception:
                    pass
                    
            nested_p = nested_cell.Range
            nested_p.ParagraphFormat.Alignment = 1
            nested_p.ParagraphFormat.SpaceBefore = 6
            nested_p.ParagraphFormat.SpaceAfter = 6
            nested_p.Font.Name = "Times New Roman"
            nested_p.Font.Size = 12
            nested_p.Font.Bold = True
            nested_p.Text = ver_text
            
            sel.Start = table.Range.End
            sel.TypeParagraph()
        else:
            sel.ParagraphFormat.Alignment = 0
            sel.ParagraphFormat.SpaceBefore = 0
            sel.ParagraphFormat.SpaceAfter = 6
            self.write_run("Họ và tên: ....................................    Lớp: ....................", bold=True, font_size=12)
            sel.TypeParagraph()
        
    # Title header ONLY if unit or grade is provided
    unit_str = str(unit).strip() if unit else ""
    grade_str = str(grade).strip() if grade else ""
    
    title_text = ""
    if unit_str and unit_str != "0":
        unit_clean = unit_str.upper()
        if unit_clean.startswith("UNIT"):
            title_text = unit_clean
        else:
            unit_name = get_unit_name(grade_str, unit_str)
            if unit_name:
                title_text = f"UNIT {unit_clean}: {unit_name.upper()}"
            else:
                title_text = f"UNIT {unit_clean}"
    elif grade_str and grade_str != "0":
        title_text = f"GRADE {grade_str}"
        
    if title_text:
        sel.ParagraphFormat.Alignment = 1
        sel.ParagraphFormat.SpaceBefore = 18 if (is_test and has_version) else 6
        sel.ParagraphFormat.SpaceAfter = 12
        sel.ParagraphFormat.KeepWithNext = True
        self.write_run(title_text, bold=True, font_size=12)
        sel.TypeParagraph()

def pywin32_add_answer_key(self, answers: List[Dict[str, str]]):
    answers = []
    for ex in exercises:
        ex_type = ex.get("t", "mq")
        if ex_type in ["cz", "rd", "wb"]:
            for sub in ex.get("k", []):
                q_num = sub.get("q")
                ans = sub.get("a", "")
                if q_num and ans:
                    answers.append({"q": q_num, "a": ans})
        else:
            q_num = ex.get("q")
            ans = ex.get("a", "")
            if q_num and ans:
                answers.append({"q": q_num, "a": ans})
                
    if not answers:
        return
        
    def get_q_num(x):
        try:
            return int(x["q"])
        except ValueError:
            return 999
    answers.sort(key=get_q_num)
    
    sel = self.word.Selection
    sel.InsertBreak(7) # wdPageBreak = 7
    
    sel.ParagraphFormat.Alignment = 0
    sel.ParagraphFormat.SpaceBefore = 12
    sel.ParagraphFormat.SpaceAfter = 12
    sel.ParagraphFormat.KeepWithNext = True
    self.write_run("ANSWER KEY", bold=True, font_size=14)
    sel.TypeParagraph()
    
    N = len(answers)
    cols = 5
    rows = math.ceil(N / cols)
    
    table = self.doc.Tables.Add(Range=sel.Range, NumRows=rows, NumColumns=cols)
    try:
        table.Rows.Alignment = 1
    except Exception:
        pass
    
    for r in range(rows):
        for c in range(cols):
            idx = c * rows + r
            if idx < N:
                item = answers[idx]
                cell = table.Cell(r + 1, c + 1)
                cell.Range.ParagraphFormat.SpaceAfter = 4
                cell.Range.Font.Name = "Times New Roman"
                cell.Range.Font.Size = 11
                cell.Range.Font.Bold = True
                cell.Range.Text = f"{item['q']}. {item['a']}"
                
    sel.Start = table.Range.End
    sel.TypeParagraph()

def pywin32_add_word_box(self, words: List[str]):
    if not words:
        return
    sel = self.word.Selection
    
    left_margin_cm = self.settings.get("margin_left", 3.0)
    right_margin_cm = self.settings.get("margin_right", 1.5)
    printable_width_cm = 21.0 - left_margin_cm - right_margin_cm
    printable_width_pt = cm_to_pt(printable_width_cm)
    
    N = len(words)
    if N <= 5:
        cols = N
    elif N <= 9:
        cols = 4
    else:
        cols = 5
        
    # Calculate optimal column width for cols 1..4 so Word NEVER skips a tab stop
    max_len_all = max(len(str(w)) for w in words) if words else 8
    char_w_pt = 6.0 # Average character width in 12pt bold font
    col_width_pt = (max_len_all * char_w_pt) + 10.0
    
    # Measure character width of the last column (col 5)
    last_col_words = [words[i] for i in range(cols - 1, N, cols)] if N >= cols else [words[-1]]
    last_col_max_len = max(len(str(w)) for w in last_col_words) if last_col_words else 8
    last_col_text_w_pt = last_col_max_len * char_w_pt
    
    text_group_width_pt = ((cols - 1) * col_width_pt) + last_col_text_w_pt
    left_offset_pt = max(0.0, (printable_width_pt - text_group_width_pt) / 2.0)
    
    # Configure paragraph indent and tab stops for centered multi-column word box
    sel.ParagraphFormat.SpaceBefore = 3
    sel.ParagraphFormat.SpaceAfter = 0
    sel.ParagraphFormat.LineSpacingRule = 0 # Standard single line spacing for first rows
    sel.ParagraphFormat.Alignment = 0 # Left align inside tab stop
    sel.ParagraphFormat.LeftIndent = left_offset_pt
    sel.ParagraphFormat.TabStops.ClearAll()
    for c in range(1, cols):
        tab_pos = left_offset_pt + (col_width_pt * c)
        sel.ParagraphFormat.TabStops.Add(Position=tab_pos, Alignment=0)
        
    p_start = sel.Range.Start
    
    lines = []
    for i in range(0, N, cols):
        chunk = words[i:i + cols]
        lines.append(chunk)
        
    num_rows = len(lines)
    for idx_line, chunk in enumerate(lines):
        if idx_line == num_rows - 1:
            sel.ParagraphFormat.LineSpacingRule = 2 # Double line spacing on last row!
            sel.ParagraphFormat.SpaceAfter = 0
        else:
            sel.ParagraphFormat.LineSpacingRule = 0
            sel.ParagraphFormat.SpaceAfter = 0
            
        for idx_w, word in enumerate(chunk):
            self.write_run(word, bold=True)
            if idx_w < len(chunk) - 1:
                self.write_run("\t", bold=False)
        sel.TypeParagraph()
        
    p_end = sel.Range.Start
    box_range = self.doc.Range(p_start, p_end)
    
    # Draw Rounded Rectangle Shape (msoShapeRoundedRectangle = 5) tightly anchored around centered word box
    try:
        padding_pt = 6.0 # Equal top, bottom, left, right padding (~2.1mm)
        box_width_pt = text_group_width_pt + (padding_pt * 2)
        # Row 1 (single) = 16pt, Row 2 (double) = 28pt
        text_height_pt = ((num_rows - 1) * 16.0) + 28.0
        box_height_pt = text_height_pt
        
        shape = self.doc.Shapes.AddShape(
            5, # msoShapeRoundedRectangle = 5
            0,
            0,
            box_width_pt,
            box_height_pt,
            Anchor=box_range
        )
        shape.RelativeHorizontalPosition = 0 # wdRelativeHorizontalPositionMargin = 0
        shape.RelativeVerticalPosition = 2 # wdRelativeVerticalPositionParagraph = 2
        shape.Left = left_offset_pt - padding_pt # Tight & symmetrical left/right borders around text
        shape.Top = -padding_pt # Equal top & bottom distance
        
        shape.Fill.Visible = False # Transparent background so words show directly in document
        shape.Line.Weight = 1.0 # 1pt border
        shape.Line.ForeColor.RGB = 0 # Black line
        try:
            shape.ZOrder(1) # Send behind text
        except Exception:
            pass
    except Exception as e:
        print(f"  [PyWin32] Warning drawing rounded shape around word box: {e}")
        
    # Reset selection formatting for paragraphs after word box
    sel.ParagraphFormat.SpaceBefore = 6
    sel.ParagraphFormat.SpaceAfter = 4
    sel.ParagraphFormat.LineSpacingRule = 0
    sel.ParagraphFormat.LeftIndent = 0
    sel.ParagraphFormat.TabStops.ClearAll()

