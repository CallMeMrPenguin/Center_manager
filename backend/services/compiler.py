import os
import sys
import json
import math
from typing import List, Dict, Any

# python-docx imports
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_TAB_ALIGNMENT, WD_COLOR_INDEX
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# Local instruction mapping dictionary
INSTRUCTION_MAP_MCQ = {
    "pr": "Mark the letter A, B, C, or D on your answer sheet to indicate the word whose underlined part differs from the other three in pronunciation in each of the following questions.",
    "st": "Mark the letter A, B, C, or D on your answer sheet to indicate the word that differs from the other three in the position of primary stress in each of the following questions.",
    "sy": "Mark the letter A, B, C, or D on your answer sheet to indicate the word(s) CLOSEST in meaning to the underlined word(s) in each of the following questions.",
    "an": "Mark the letter A, B, C, or D on your answer sheet to indicate the word(s) OPPOSITE in meaning to the underlined word(s) in each of the following questions.",
    "sg": "Mark the letter A, B, C, or D on your answer sheet to indicate the correct meaning of the sign in each of the following questions.",
    "nt": "Mark the letter A, B, C, or D on your answer sheet to indicate the correct meaning of the notice in each of the following questions.",
    "cz": "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the word or phrase that best fits each of the numbered blanks.",
    "ro": "Mark the letter A, B, C, or D on your answer sheet to indicate the answer that best fits each of the following questions.",
    "rd": "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate the answer that best fits each of the following questions.",
    "er": "Mark the letter A, B, C, or D on your answer sheet to indicate the underlined part that needs correction in each of the following questions.",
    "fb": "Mark the letter A, B, C, or D on your answer sheet to indicate the word or phrase that best fits each blank in the following questions.",
    "rw": "Mark the letter A, B, C, or D on your answer sheet to indicate the sentence that is closest in meaning to each of the following questions.",
    "mq": "Mark the letter A, B, C, or D on your answer sheet to indicate the answer that best fits each of the following questions."
}

INSTRUCTION_MAP_NON_MCQ = {
    "pr": "Write the word with the underlined sound for each of the following questions.",
    "st": "Write the position of primary stress for each of the following words.",
    "sy": "Provide a word or phrase closest in meaning to the underlined part in each of the following sentences.",
    "an": "Provide a word or phrase opposite in meaning to the underlined part in each of the following sentences.",
    "sg": "State the meaning of each of the following signs.",
    "nt": "State the meaning of each of the following notices.",
    "cz": "Read the following passage and fill in each numbered blank with ONE suitable word.",
    "ro": "Rearrange the given words or phrases to make complete, meaningful sentences.",
    "rd": "Read the following passage and answer the questions that follow.",
    "er": "Identify and correct the mistake in each of the following sentences.",
    "fb": "Complete each of the following sentences with the correct form of the word in brackets or a suitable word.",
    "rw": "Rewrite each of the following sentences so that it has a similar meaning to the original sentence.",
    "mq": "Complete each of the following questions."
}

def get_instruction_map():
    config_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "exercise_config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                custom_map = json.load(f)
                return {**INSTRUCTION_MAP_MCQ, **custom_map}
        except Exception:
            pass
    return INSTRUCTION_MAP_MCQ

def get_instruction_text(ex_type: str, is_mcq: bool = True) -> str:
    config_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "exercise_config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                custom_map = json.load(f)
                specific_key = f"{ex_type}_mcq" if is_mcq else f"{ex_type}_non_mcq"
                if specific_key in custom_map:
                    return custom_map[specific_key]
                if ex_type in custom_map:
                    return custom_map[ex_type]
        except Exception:
            pass
    if is_mcq:
        return INSTRUCTION_MAP_MCQ.get(ex_type, "Mark the letter A, B, C, or D on your answer sheet to indicate the answer that best fits each of the following questions.")
    else:
        return INSTRUCTION_MAP_NON_MCQ.get(ex_type, "Answer each of the following questions.")


def parse_text_formatting(text: str) -> List[Dict[str, Any]]:
    import re
    if not text:
        return []
        
    pattern = re.compile(
        r'(?P<err>\[(?P<err_txt>[^\]]+)\]\((?P<err_let>[A-D])\))|'
        r'(?P<bold_under1>\*\*\[(?P<bu_txt1>[^\]]+)\]\*\*)|'
        r'(?P<bold_under2>\[\*\*(?P<bu_txt2>[^*]+)\*\*\])|'
        r'(?P<bold>\*\*(?P<b_txt>[^*]+)\*\*)|'
        r'(?P<italic>\*(?P<i_txt>[^*]+)\*)|'
        r'(?P<under>\[(?P<u_txt>[^\]]+)\])'
    )
    
    segments = []
    last_idx = 0
    for match in pattern.finditer(text):
        start, end = match.span()
        if start > last_idx:
            segments.append({
                "text": text[last_idx:start],
                "bold": False,
                "italic": False,
                "underline": False
            })
        
        gd = match.groupdict()
        if gd['err']:
            segments.append({"text": gd['err_txt'], "bold": False, "italic": False, "underline": True})
            segments.append({"text": f" ({gd['err_let']})", "bold": True, "italic": False, "underline": False})
        elif gd['bold_under1'] or gd['bold_under2']:
            txt = gd['bu_txt1'] if gd['bold_under1'] else gd['bu_txt2']
            segments.append({"text": txt, "bold": True, "italic": False, "underline": True})
        elif gd['bold']:
            segments.append({"text": gd['b_txt'], "bold": True, "italic": False, "underline": False})
        elif gd['italic']:
            segments.append({"text": gd['i_txt'], "bold": False, "italic": True, "underline": False})
        elif gd['under']:
            segments.append({"text": gd['u_txt'], "bold": False, "italic": False, "underline": True})
            
        last_idx = end
        
    if last_idx < len(text):
        segments.append({
            "text": text[last_idx:],
            "bold": False,
            "italic": False,
            "underline": False
        })
        
    return segments


def set_cell_border(cell, **kwargs):
    """
    Set cell's border
    """
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = tcPr.first_child_found_in("w:tcBorders")
    if tcBorders is None:
        tcBorders = OxmlElement('w:tcBorders')
        tcPr.append(tcBorders)
    
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = 'w:{}'.format(edge)
            element = tcBorders.find(qn(tag))
            if element is None:
                element = OxmlElement(tag)
                tcBorders.append(element)
            for key, val in edge_data.items():
                element.set(qn('w:{}'.format(key)), str(val))


def get_unit_name(grade: str, unit: str) -> str:
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "unit_config.json")
    if not os.path.exists(config_path):
        config_path = os.path.join(os.getcwd(), "unit_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                g_key = str(grade).strip()
                u_key = str(unit).strip()
                if g_key in data and u_key in data[g_key]:
                    return data[g_key][u_key]
        except Exception:
            pass
    return ""


class WordDocumentCompiler:
    def __init__(self, settings: Dict[str, Any] = None):
        self.settings = settings or {}
        self.doc = Document()
        self.is_answer_key = False
        self._configure_page()
        self._configure_styles()
        self._add_page_numbering()

    def _add_page_numbering(self):
        font_name = self.settings.get("font_name", "Times New Roman")
        font_size = self.settings.get("font_size", 12.0)
        
        for section in self.doc.sections:
            footer = section.footer
            p = footer.paragraphs[0]
            p.alignment = 1 # Center
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(0)
            p.text = ""
            
            def add_field(p_elem, field_name):
                fldSimple = OxmlElement('w:fldSimple')
                fldSimple.set(qn('w:instr'), field_name)
                
                r = OxmlElement('w:r')
                rPr = OxmlElement('w:rPr')
                
                rFonts = OxmlElement('w:rFonts')
                rFonts.set(qn('w:ascii'), font_name)
                rFonts.set(qn('w:hAnsi'), font_name)
                rPr.append(rFonts)
                
                sz = OxmlElement('w:sz')
                sz.set(qn('w:val'), str(int(font_size * 2)))
                rPr.append(sz)
                
                r.append(rPr)
                
                t = OxmlElement('w:t')
                t.text = "1"
                r.append(t)
                
                fldSimple.append(r)
                p_elem._p.append(fldSimple)
                
            add_field(p, 'PAGE')
            
            r_sep = p.add_run("/")
            r_sep.font.name = font_name
            r_sep.font.size = Pt(font_size)
            
            add_field(p, 'NUMPAGES')

    def _configure_page(self):
        top_cm = self.settings.get("margin_top", 2.0)
        bottom_cm = self.settings.get("margin_bottom", 2.0)
        left_cm = self.settings.get("margin_left", 3.0)
        right_cm = self.settings.get("margin_right", 1.5)
        
        for section in self.doc.sections:
            section.page_width = Cm(21)
            section.page_height = Cm(29.7)
            section.top_margin = Cm(top_cm)
            section.bottom_margin = Cm(bottom_cm)
            section.left_margin = Cm(left_cm)
            section.right_margin = Cm(right_cm)

    def _configure_styles(self):
        font_name = self.settings.get("font_name", "Times New Roman")
        font_size = self.settings.get("font_size", 12.0)
        line_spacing = self.settings.get("line_spacing", 1.15)
        space_after = self.settings.get("space_after", 6.0)
        
        style = self.doc.styles['Normal']
        font = style.font
        font.name = font_name
        font.size = Pt(font_size)
        
        p_format = style.paragraph_format
        p_format.space_before = Pt(0)
        p_format.space_after = Pt(space_after)
        p_format.line_spacing = line_spacing

    def add_instruction_header(self, text: str):
        space_before = self.settings.get("header_space_before", 14.0)
        space_after = self.settings.get("header_space_after", 8.0)
        font_size = self.settings.get("font_size", 12.0)
        
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.keep_with_next = True
        
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(font_size)

    def add_question(self, q_num: Any, q_text: str):
        space_before = self.settings.get("question_space_before", 6.0)
        space_after = self.settings.get("question_space_after", 4.0)
        
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.keep_with_next = True
        
        run_q = p.add_run(f"Question {q_num}: ")
        run_q.bold = True
        
        segments = parse_text_formatting(q_text)
        for seg in segments:
            run = p.add_run(seg["text"])
            if seg["bold"]:
                run.bold = True
            if seg["italic"]:
                run.italic = True
            if seg["underline"]:
                run.underline = True

    def add_options_grid(self, options: List[str], exercise_type: str, correct_ans: Any = None):
        if not options:
            return
            
        correct_idx = -1
        if correct_ans:
            c_str = str(correct_ans).strip().upper()
            if len(c_str) == 1 and 'A' <= c_str <= 'E':
                correct_idx = ord(c_str) - ord('A')
            elif c_str in ['1', '2', '3', '4', '5']:
                correct_idx = int(c_str) - 1

        max_len = max(len(str(opt)) for opt in options) if options else 0
        
        if exercise_type in ["pr", "st"] or max_len < 15:
            cols = 4
        elif max_len < 35:
            cols = 2
        else:
            cols = 1

        left_indent_cm = self.settings.get("options_left_indent", 0.5)
        space_before = self.settings.get("options_space_before", 0.0)
        space_after = self.settings.get("options_space_after", 3.0)
        
        left_margin_cm = self.settings.get("margin_left", 3.0)
        right_margin_cm = self.settings.get("margin_right", 1.5)
        printable_width_cm = 21.0 - left_margin_cm - right_margin_cm
        remaining_width_cm = printable_width_cm - left_indent_cm

        if cols == 1:
            for idx, opt in enumerate(options):
                prefix = chr(65 + idx)
                p = self.doc.add_paragraph()
                p.paragraph_format.left_indent = Cm(left_indent_cm)
                p.paragraph_format.space_before = Pt(space_before)
                p.paragraph_format.space_after = Pt(space_after)
                
                run_prefix = p.add_run(f"{prefix}. ")
                run_prefix.bold = True
                if idx == correct_idx and self.is_answer_key:
                    run_prefix.font.color.rgb = RGBColor(255, 0, 0)
                    run_prefix.font.highlight_color = WD_COLOR_INDEX.YELLOW
                
                segments = parse_text_formatting(opt)
                for seg in segments:
                    run = p.add_run(seg["text"])
                    if seg["bold"]: run.bold = True
                    if seg["italic"]: run.italic = True
                    if seg["underline"]: run.underline = True
                    if idx == correct_idx and self.is_answer_key:
                        run.font.color.rgb = RGBColor(255, 0, 0)
                        run.font.highlight_color = WD_COLOR_INDEX.YELLOW
                    
        elif cols == 2:
            col_width = remaining_width_cm / 2
            tab_pos = left_indent_cm + col_width
            
            for row in range(2):
                p = self.doc.add_paragraph()
                p.paragraph_format.left_indent = Cm(left_indent_cm)
                p.paragraph_format.space_before = Pt(space_before)
                p.paragraph_format.space_after = Pt(space_after)
                p.paragraph_format.tab_stops.add_tab_stop(Cm(tab_pos), WD_TAB_ALIGNMENT.LEFT)
                
                idx1 = row * 2
                if idx1 < len(options):
                    prefix = chr(65 + idx1)
                    run_prefix = p.add_run(f"{prefix}. ")
                    run_prefix.bold = True
                    if idx1 == correct_idx and self.is_answer_key:
                        run_prefix.font.color.rgb = RGBColor(255, 0, 0)
                        run_prefix.font.highlight_color = WD_COLOR_INDEX.YELLOW
                    for seg in parse_text_formatting(options[idx1]):
                        run = p.add_run(seg["text"])
                        if seg["bold"]: run.bold = True
                        if seg["italic"]: run.italic = True
                        if seg["underline"]: run.underline = True
                        if idx1 == correct_idx and self.is_answer_key:
                            run.font.color.rgb = RGBColor(255, 0, 0)
                            run.font.highlight_color = WD_COLOR_INDEX.YELLOW
                        
                p.add_run("\t")
                
                idx2 = row * 2 + 1
                if idx2 < len(options):
                    prefix = chr(65 + idx2)
                    run_prefix = p.add_run(f"{prefix}. ")
                    run_prefix.bold = True
                    if idx2 == correct_idx and self.is_answer_key:
                        run_prefix.font.color.rgb = RGBColor(255, 0, 0)
                        run_prefix.font.highlight_color = WD_COLOR_INDEX.YELLOW
                    for seg in parse_text_formatting(options[idx2]):
                        run = p.add_run(seg["text"])
                        if seg["bold"]: run.bold = True
                        if seg["italic"]: run.italic = True
                        if seg["underline"]: run.underline = True
                        if idx2 == correct_idx and self.is_answer_key:
                            run.font.color.rgb = RGBColor(255, 0, 0)
                            run.font.highlight_color = WD_COLOR_INDEX.YELLOW
                        
        elif cols == 4:
            col_width = remaining_width_cm / 4
            tab1 = left_indent_cm + col_width
            tab2 = left_indent_cm + (col_width * 2)
            tab3 = left_indent_cm + (col_width * 3)
            
            p = self.doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(left_indent_cm)
            p.paragraph_format.space_before = Pt(space_before)
            p.paragraph_format.space_after = Pt(space_after)
            p.paragraph_format.tab_stops.add_tab_stop(Cm(tab1), WD_TAB_ALIGNMENT.LEFT)
            p.paragraph_format.tab_stops.add_tab_stop(Cm(tab2), WD_TAB_ALIGNMENT.LEFT)
            p.paragraph_format.tab_stops.add_tab_stop(Cm(tab3), WD_TAB_ALIGNMENT.LEFT)
            
            for idx in range(4):
                if idx < len(options):
                    prefix = chr(65 + idx)
                    run_prefix = p.add_run(f"{prefix}. ")
                    run_prefix.bold = True
                    if idx == correct_idx and self.is_answer_key:
                        run_prefix.font.color.rgb = RGBColor(255, 0, 0)
                        run_prefix.font.highlight_color = WD_COLOR_INDEX.YELLOW
                    for seg in parse_text_formatting(options[idx]):
                        run = p.add_run(seg["text"])
                        if seg["bold"]: run.bold = True
                        if seg["italic"]: run.italic = True
                        if seg["underline"]: run.underline = True
                        if idx == correct_idx and self.is_answer_key:
                            run.font.color.rgb = RGBColor(255, 0, 0)
                            run.font.highlight_color = WD_COLOR_INDEX.YELLOW
                
                if idx < 3:
                    p.add_run("\t")

    def add_test_header(self, grade: str, unit: str, version_code: str):
        # 1. Table for Name/Class on Left, Version box on Right
        table = self.doc.add_table(rows=1, cols=2)
        table.alignment = 1  # Center alignment for the outer table
        table.autofit = False
        
        # Total printable width is 21.0 - left - right margin. 
        # Default margins are Left: 3cm, Right: 1.5cm, so printable is 16.5cm.
        left_margin_cm = self.settings.get("margin_left", 3.0)
        right_margin_cm = self.settings.get("margin_right", 1.5)
        printable_width_cm = 21.0 - left_margin_cm - right_margin_cm
        
        table.columns[0].width = Cm(printable_width_cm - 3.5)
        table.columns[1].width = Cm(3.5)
        
        # Left cell
        cell_left = table.cell(0, 0)
        p_left = cell_left.paragraphs[0]
        p_left.paragraph_format.space_before = Pt(0)
        p_left.paragraph_format.space_after = Pt(0)
        p_left.paragraph_format.line_spacing = 2.0  # Double line spacing
        
        run_name = p_left.add_run("Họ và tên: ....................................\nLớp: ....................")
        run_name.bold = True
        run_name.font.size = Pt(12)  # Double font size 12
        
        # Right cell
        cell_right = table.cell(0, 1)
        # Clear default paragraph
        p_outer = cell_right.paragraphs[0]
        p_outer.paragraph_format.space_before = Pt(0)
        p_outer.paragraph_format.space_after = Pt(0)
        
        # Convert version code to a nice integer if possible
        try:
            v_num = int(version_code)
            if v_num >= 101:
                v_num = v_num - 100
            ver_text = f"ĐỀ {v_num}"
        except ValueError:
            ver_text = f"ĐỀ {version_code}"
            
        # Create a nested 1x1 table for the letter box
        nested_table = cell_right.add_table(rows=1, cols=1)
        nested_table.alignment = 2  # Align table to the right
        nested_table.autofit = False
        nested_table.columns[0].width = Cm(2.5)
        
        nested_cell = nested_table.cell(0, 0)
        nested_cell.width = Cm(2.5)
        # Vertical alignment center
        nested_cell.vertical_alignment = 1  # 1 is Center vertical alignment
        
        p_nested = nested_cell.paragraphs[0]
        p_nested.alignment = 1  # Center aligned text
        p_nested.paragraph_format.space_before = Pt(6)
        p_nested.paragraph_format.space_after = Pt(6)
        
        run_ver = p_nested.add_run(ver_text)
        run_ver.bold = True
        run_ver.font.size = Pt(12)
        
        # Set border around the nested cell
        border_spec = {"sz": 12, "val": "single", "color": "000000", "space": "0"}
        set_cell_border(
            nested_cell,
            top=border_spec,
            bottom=border_spec,
            left=border_spec,
            right=border_spec
        )
        
        # 2. Add Unit Name Centered below
        unit_clean = str(unit).strip().upper()
        if unit_clean.startswith("UNIT"):
            unit_text = unit_clean
        else:
            unit_name = get_unit_name(grade, unit)
            if unit_name:
                unit_text = f"UNIT {unit_clean}: {unit_name.upper()}"
            else:
                unit_text = f"UNIT {unit_clean}" if unit_clean else "UNIT"
                
        p_unit = self.doc.add_paragraph()
        p_unit.alignment = 1  # Center aligned
        p_unit.paragraph_format.space_before = Pt(18)
        p_unit.paragraph_format.space_after = Pt(12)
        p_unit.paragraph_format.keep_with_next = True
        
        run_unit = p_unit.add_run(unit_text)
        run_unit.bold = True
        run_unit.font.size = Pt(12)

    def collect_answers(self, exercises: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        answers = []
        for ex in exercises:
            ex_type = ex.get("t")
            if ex_type in ["cz", "rd"]:
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
        
        def get_q_num(x):
            try:
                return int(x["q"])
            except ValueError:
                return 999
        answers.sort(key=get_q_num)
        return answers

    def add_answer_key(self, exercises: List[Dict[str, Any]]):
        answers = self.collect_answers(exercises)
        if not answers:
            return
            
        self.doc.add_page_break()
        
        p_head = self.doc.add_paragraph()
        p_head.paragraph_format.space_before = Pt(12)
        p_head.paragraph_format.space_after = Pt(12)
        p_head.paragraph_format.keep_with_next = True
        run_head = p_head.add_run("ANSWER KEY")
        run_head.bold = True
        run_head.font.size = Pt(14)
        
        N = len(answers)
        cols = 5
        rows = math.ceil(N / cols)
        
        table = self.doc.add_table(rows=rows, cols=cols)
        table.alignment = 1  # Center alignment
        
        for r in range(rows):
            for c in range(cols):
                idx = c * rows + r
                if idx < N:
                    item = answers[idx]
                    cell = table.cell(r, c)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(4)
                    run = p.add_run(f"{item['q']}. {item['a']}")
                    run.bold = True
                    run.font.size = Pt(11)

    def compile_exercises(self, exercises: List[Dict[str, Any]], grade: str = "", unit: str = "", version_code: str = "", include_answer_key: bool = True):
        if isinstance(exercises, dict):
            for key in ["data", "exercises", "questions", "list"]:
                if key in exercises and isinstance(exercises[key], list):
                    exercises = exercises[key]
                    break
            else:
                if "t" in exercises or "q" in exercises:
                    exercises = [exercises]
                else:
                    raise ValueError("JSON dictionary does not contain a list of exercises.")

        if grade or unit or version_code:
            self.add_test_header(grade, unit, version_code)

        current_block_key = None
        for ex in exercises:
            ex_type = ex.get("t", "mq")
            options = ex.get("o", [])
            if not isinstance(options, list):
                options = []
            is_mcq = len(options) >= 2
            
            block_key = (ex_type, is_mcq)
            if block_key != current_block_key:
                current_block_key = block_key
                instruction_text = get_instruction_text(ex_type, is_mcq)
                if instruction_text:
                    self.add_instruction_header(instruction_text)
            
            if ex_type in ["cz", "rd"]:
                space_before = self.settings.get("passage_space_before", 4.0)
                space_after = self.settings.get("passage_space_after", 6.0)
                indent_first = self.settings.get("passage_indent_first", 0.75)
                
                for paragraph_text in ex.get("b", []):
                    p_passage = self.doc.add_paragraph()
                    p_passage.paragraph_format.space_before = Pt(space_before)
                    p_passage.paragraph_format.space_after = Pt(space_after)
                    p_passage.paragraph_format.first_line_indent = Cm(indent_first)
                    
                    segments = parse_text_formatting(paragraph_text)
                    for seg in segments:
                        run = p_passage.add_run(seg["text"])
                        if seg["bold"]: run.bold = True
                        if seg["italic"]: run.italic = True
                        if seg["underline"]: run.underline = True
                
                for sub in ex.get("k", []):
                    sub_q = sub.get("q")
                    sub_x = sub.get("x", "")
                    sub_o = sub.get("o", [])
                    sub_a = sub.get("a", "")
                    
                    self.add_question(sub_q, sub_x)
                    self.add_options_grid(sub_o, ex_type, correct_ans=sub_a)
                    
            elif ex_type == "ro":
                q_num = ex.get("q")
                q_text = ex.get("x", "Choose the best arrangement of the sentences:")
                self.add_question(q_num, q_text)
                
                space_before = self.settings.get("reorder_space_before", 0.0)
                space_after = self.settings.get("reorder_space_after", 2.0)
                left_indent = self.settings.get("reorder_left_indent", 1.0)
                
                for item in ex.get("i", []):
                    p_item = self.doc.add_paragraph()
                    p_item.paragraph_format.left_indent = Cm(left_indent)
                    p_item.paragraph_format.space_before = Pt(space_before)
                    p_item.paragraph_format.space_after = Pt(space_after)
                    
                    segments = parse_text_formatting(item)
                    for seg in segments:
                        run = p_item.add_run(seg["text"])
                        if seg["bold"]: run.bold = True
                        if seg["italic"]: run.italic = True
                        if seg["underline"]: run.underline = True
                
                self.add_options_grid(ex.get("o", []), ex_type, correct_ans=ex.get("a", ""))
                
            elif ex_type == "nt":
                q_num = ex.get("q")
                q_text = ex.get("x", "")
                self.doc.add_paragraph() # spacing
                self.add_question(q_num, q_text)
                
                space_before = self.settings.get("notice_space_before", 4.0)
                space_after = self.settings.get("notice_space_after", 6.0)
                left_indent = self.settings.get("notice_left_indent", 1.0)
                
                p_body = self.doc.add_paragraph()
                p_body.paragraph_format.left_indent = Cm(left_indent)
                p_body.paragraph_format.space_before = Pt(space_before)
                p_body.paragraph_format.space_after = Pt(space_after)
                
                segments = parse_text_formatting(ex.get("b", ""))
                for seg in segments:
                    run = p_body.add_run(seg["text"])
                    run.italic = True
                    if seg["bold"]: run.bold = True
                    if seg["underline"]: run.underline = True
                
                self.add_options_grid(ex.get("o", []), ex_type, correct_ans=ex.get("a", ""))
                
            else:
                q_num = ex.get("q")
                q_text = ex.get("x", "")
                options = ex.get("o", [])
                ans = ex.get("a", "")
                
                self.add_question(q_num, q_text)
                self.add_options_grid(options, ex_type, correct_ans=ans)

        if include_answer_key:
            self.add_answer_key(exercises)

    def compile(self, exercises: List[Dict[str, Any]], output_filepath: Any, grade: str = "", unit: str = "", version_code: str = "", include_answer_key: bool = True, is_answer_key: bool = False):
        self.is_answer_key = is_answer_key
        self.compile_exercises(exercises, grade=grade, unit=unit, version_code=version_code, include_answer_key=include_answer_key)
        self.doc.save(output_filepath)

    def compile_test_versions(self, exercises: List[Dict[str, Any]], num_versions: int = 1, mix_options: bool = True, grade: str = "", unit: str = ""):
        import time
        import random
        import copy
        try:
            from backend.config.settings import get_setting
        except ImportError:
            from config.settings import get_setting

        files_dir = get_setting("files_dir")
        os.makedirs(files_dir, exist_ok=True)

        timestamp = int(time.time())
        clean_grade = grade.replace(" ", "_") if grade else "Test"
        clean_unit = unit.replace(" ", "_") if unit else "Unit"
        
        last_filename = ""
        last_filepath = ""
        base_version = 101

        for i in range(num_versions):
            version_code = str(base_version + i)
            filename = f"De_thi_{clean_grade}_{clean_unit}_MDT{version_code}_{timestamp}.docx"
            filepath = os.path.join(files_dir, filename)

            ex_copy = copy.deepcopy(exercises)
            if mix_options:
                for ex in ex_copy:
                    opts = ex.get("o", [])
                    correct_ans = ex.get("a", "")
                    if opts and len(opts) > 1 and correct_ans in ["A", "B", "C", "D"]:
                        ans_idx = ord(correct_ans) - ord("A")
                        if 0 <= ans_idx < len(opts):
                            correct_val = opts[ans_idx]
                            shuffled_opts = list(opts)
                            random.shuffle(shuffled_opts)
                            new_ans_idx = shuffled_opts.index(correct_val)
                            ex["o"] = shuffled_opts
                            ex["a"] = chr(ord("A") + new_ans_idx)

            compiler_inst = WordDocumentCompiler(self.settings)
            compiler_inst.compile(ex_copy, filepath, grade=grade, unit=unit, version_code=version_code, include_answer_key=True)
            
            last_filename = filename
            last_filepath = filepath

        return last_filename, last_filepath

    def convert_docx_to_pdf_soffice(self, docx_path: str, pdf_path: str) -> bool:
        out_dir = os.path.dirname(pdf_path)
        os.makedirs(out_dir, exist_ok=True)
        abs_docx = os.path.abspath(docx_path)
        abs_pdf = os.path.abspath(pdf_path)

        # 1. Try Microsoft Word COM API (Fast & accurate on Windows)
        try:
            import win32com.client
            pythoncom = None
            try:
                import pythoncom
                pythoncom.CoInitialize()
            except Exception:
                pass

            word = win32com.client.Dispatch("Word.Application")
            word.Visible = False
            doc = word.Documents.Open(abs_docx)
            doc.SaveAs(abs_pdf, FileFormat=17)  # 17 = wdFormatPDF
            doc.Close(False)
            word.Quit()
            if pythoncom:
                try: pythoncom.CoUninitialize()
                except Exception: pass
            if os.path.exists(abs_pdf):
                return True
        except Exception as e:
            print(f"MS Word COM PDF conversion failed: {e}")

        # 2. Fallback to LibreOffice soffice
        import shutil
        import subprocess
        soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if not soffice:
            possible_paths = [
                r"C:\Program Files\LibreOffice\program\soffice.exe",
                r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    soffice = p
                    break
        
        if soffice:
            try:
                cmd = [soffice, "--headless", "--convert-to", "pdf", "--outdir", out_dir, abs_docx]
                subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
                
                gen_pdf = os.path.join(out_dir, os.path.splitext(os.path.basename(abs_docx))[0] + ".pdf")
                if os.path.exists(gen_pdf):
                    if gen_pdf != abs_pdf:
                        if os.path.exists(abs_pdf):
                            os.remove(abs_pdf)
                        os.rename(gen_pdf, abs_pdf)
                    return True
            except Exception as e:
                print(f"Error converting docx to pdf with soffice: {e}")

        return False



MOCK_PAYLOAD = [
    {
        "t": "pr",
        "q": 1,
        "x": "",
        "o": ["pass[ed]", "plann[ed]", "hopp[ed]", "play[ed]"],
        "a": "D"
    },
    {
        "t": "st",
        "q": 2,
        "x": "",
        "o": ["teacher", "student", "decide", "member"],
        "a": "C"
    },
    {
        "t": "mq",
        "q": 3,
        "x": "We have English lessons _______ Tuesday and Friday.",
        "o": ["on", "up", "at", "in"],
        "a": "A"
    },
    {
        "t": "er",
        "q": 4,
        "x": "Because of [his](A) illness, he [could not](B) go to school, [so](C) he was [sadly](D).",
        "o": ["his", "could not", "so", "sadly"],
        "a": "D"
    }
]
