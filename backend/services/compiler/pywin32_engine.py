import os
import sys
import json
import math
import copy
import time
import random
from typing import List, Dict, Any, Optional
try:
    import pythoncom
    import win32com.client
    win32com_available = True
except Exception:
    win32com_available = False
from .pywin32_layout import pywin32_add_test_header, pywin32_add_answer_key, pywin32_add_word_box
from .common import (
    INSTRUCTION_MAP_MCQ, INSTRUCTION_MAP_NON_MCQ, cm_to_pt,
    get_instruction_map, get_instruction_text, normalize_input_exercises,
    parse_text_formatting, clean_option_text, set_cell_border, get_unit_name
)

class WordDocumentCompilerPyWin32:
    """Real-time MS Word COM Document Compiler using pywin32."""
    def __init__(self, settings: Dict[str, Any] = None):
        self.settings = settings or {}
        self.is_answer_key = False
        self.word = None
        self.doc = None

    def _init_word(self):
        try:
            pythoncom.CoInitialize()
        except Exception:
            pass
            
        self.word = win32com.client.Dispatch("Word.Application")
        self.word.Visible = True  # Real-time visual output in MS Word window
        self.word.DisplayAlerts = 0  # wdAlertsNone
        self.doc = self.word.Documents.Add()
        
        self._configure_page()
        self._add_page_numbering()

    def _configure_page(self):
        top_cm = self.settings.get("margin_top", 2.0)
        bottom_cm = self.settings.get("margin_bottom", 2.0)
        left_cm = self.settings.get("margin_left", 3.0)
        right_cm = self.settings.get("margin_right", 1.5)
        
        ps = self.doc.PageSetup
        ps.PageWidth = cm_to_pt(21.0)
        ps.PageHeight = cm_to_pt(29.7)
        ps.TopMargin = cm_to_pt(top_cm)
        ps.BottomMargin = cm_to_pt(bottom_cm)
        ps.LeftMargin = cm_to_pt(left_cm)
        ps.RightMargin = cm_to_pt(right_cm)

    def _add_page_numbering(self):
        font_name = self.settings.get("font_name", "Times New Roman")
        font_size = self.settings.get("font_size", 12.0)
        
        for section in self.doc.Sections:
            footer = section.Footers(1) # wdHeaderFooterPrimary = 1
            footer.Range.ParagraphFormat.Alignment = 1 # Center
            footer.Range.Font.Name = font_name
            footer.Range.Font.Size = font_size
            footer.Range.Text = ""
            
            sel_range = footer.Range
            self.doc.Fields.Add(Range=sel_range, Type=-1, Text="PAGE")
            footer.Range.InsertAfter("/")
            end_range = footer.Range
            end_range.Collapse(0) # wdCollapseEnd = 0
            self.doc.Fields.Add(Range=end_range, Type=-1, Text="NUMPAGES")

    def write_run(self, text: str, bold: bool = False, italic: bool = False, underline: bool = False, font_name: str = "Times New Roman", font_size: float = 12.0, color_rgb: int = None, highlight_index: int = None):
        sel = self.word.Selection
        sel.Font.Name = font_name
        sel.Font.Size = font_size
        sel.Font.Bold = bool(bold)
        sel.Font.Italic = bool(italic)
        sel.Font.Underline = 1 if underline else 0
        if color_rgb is not None:
            try:
                sel.Font.Color = color_rgb
            except Exception:
                pass
        if highlight_index is not None:
            try:
                sel.Font.HighlightColorIndex = highlight_index
            except Exception:
                pass
            
        sel.TypeText(text)

    def add_instruction_header(self, text: str):
        space_before = self.settings.get("header_space_before", 14.0)
        space_after = self.settings.get("header_space_after", 8.0)
        font_size = self.settings.get("font_size", 12.0)
        
        sel = self.word.Selection
        sel.ParagraphFormat.SpaceBefore = space_before
        sel.ParagraphFormat.SpaceAfter = space_after
        sel.ParagraphFormat.KeepWithNext = True
        sel.ParagraphFormat.LeftIndent = 0
        sel.ParagraphFormat.Alignment = 0 # Left
        
        self.write_run(text, bold=True, font_size=font_size)
        sel.TypeParagraph()

    def add_question(self, q_num: Any, q_text: str):
        space_before = self.settings.get("question_space_before", 6.0)
        space_after = self.settings.get("question_space_after", 4.0)
        font_size = self.settings.get("font_size", 12.0)
        
        sel = self.word.Selection
        sel.ParagraphFormat.SpaceBefore = space_before
        sel.ParagraphFormat.SpaceAfter = space_after
        sel.ParagraphFormat.KeepWithNext = True
        sel.ParagraphFormat.LeftIndent = 0
        sel.ParagraphFormat.Alignment = 0
        
        self.write_run(f"Question {q_num}: ", bold=True, font_size=font_size)
        
        segments = parse_text_formatting(q_text)
        for seg in segments:
            self.write_run(seg["text"], bold=seg["bold"], italic=seg["italic"], underline=seg["underline"], font_size=font_size)
            
        sel.TypeParagraph()

    def add_options_grid(self, options: List[str], exercise_type: str, correct_ans: Any = None):
        if not options:
            return
        options = [clean_option_text(opt) for opt in options]
            
        correct_idx = -1
        if correct_ans:
            c_str = str(correct_ans).strip().upper()
            if len(c_str) == 1 and 'A' <= c_str <= 'E':
                correct_idx = ord(c_str) - ord('A')
            elif c_str in ['1', '2', '3', '4', '5']:
                correct_idx = int(c_str) - 1

        max_len = max(len(str(opt)) for opt in options) if options else 0
        if exercise_type in ["sg", "nt"]:
            cols = 1
        elif exercise_type in ["pr", "st"] or max_len < 15:
            cols = 4
        elif max_len < 35:
            cols = 2
        else:
            cols = 1

        left_indent_cm = self.settings.get("options_left_indent", 0.5)
        space_before = self.settings.get("options_space_before", 0.0)
        space_after = self.settings.get("options_space_after", 3.0)
        font_size = self.settings.get("font_size", 12.0)
        
        left_margin_cm = self.settings.get("margin_left", 3.0)
        right_margin_cm = self.settings.get("margin_right", 1.5)
        printable_width_cm = 21.0 - left_margin_cm - right_margin_cm
        remaining_width_cm = printable_width_cm - left_indent_cm
        
        sel = self.word.Selection
        
        if cols == 1:
            for idx, opt in enumerate(options):
                prefix = chr(65 + idx)
                sel.ParagraphFormat.LeftIndent = cm_to_pt(left_indent_cm)
                sel.ParagraphFormat.SpaceBefore = space_before
                sel.ParagraphFormat.SpaceAfter = space_after
                sel.ParagraphFormat.TabStops.ClearAll()
                
                is_correct = (idx == correct_idx and self.is_answer_key)
                color_rgb = 255 if is_correct else None
                highlight_idx = 7 if is_correct else None
                
                self.write_run(f"{prefix}. ", bold=True, font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                for seg in parse_text_formatting(opt):
                    self.write_run(seg["text"], bold=seg["bold"], italic=seg["italic"], underline=seg["underline"], font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                sel.TypeParagraph()

        elif cols == 2:
            col_width = remaining_width_cm / 2
            tab_pos = left_indent_cm + col_width
            
            for row in range(2):
                sel.ParagraphFormat.LeftIndent = cm_to_pt(left_indent_cm)
                sel.ParagraphFormat.SpaceBefore = space_before
                sel.ParagraphFormat.SpaceAfter = space_after
                sel.ParagraphFormat.TabStops.ClearAll()
                sel.ParagraphFormat.TabStops.Add(Position=cm_to_pt(tab_pos), Alignment=0) # Left
                
                idx1 = row * 2
                if idx1 < len(options):
                    prefix = chr(65 + idx1)
                    is_correct = (idx1 == correct_idx and self.is_answer_key)
                    color_rgb = 255 if is_correct else None
                    highlight_idx = 7 if is_correct else None
                    
                    self.write_run(f"{prefix}. ", bold=True, font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                    for seg in parse_text_formatting(options[idx1]):
                        self.write_run(seg["text"], bold=seg["bold"], italic=seg["italic"], underline=seg["underline"], font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                
                self.write_run("\t", bold=False, italic=False, underline=False, font_size=font_size)
                
                idx2 = row * 2 + 1
                if idx2 < len(options):
                    prefix = chr(65 + idx2)
                    is_correct = (idx2 == correct_idx and self.is_answer_key)
                    color_rgb = 255 if is_correct else None
                    highlight_idx = 7 if is_correct else None
                    
                    self.write_run(f"{prefix}. ", bold=True, font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                    for seg in parse_text_formatting(options[idx2]):
                        self.write_run(seg["text"], bold=seg["bold"], italic=seg["italic"], underline=seg["underline"], font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                
                sel.TypeParagraph()

        elif cols == 4:
            col_width = remaining_width_cm / 4
            tab1 = left_indent_cm + col_width
            tab2 = left_indent_cm + (col_width * 2)
            tab3 = left_indent_cm + (col_width * 3)
            
            sel.ParagraphFormat.LeftIndent = cm_to_pt(left_indent_cm)
            sel.ParagraphFormat.SpaceBefore = space_before
            sel.ParagraphFormat.SpaceAfter = space_after
            sel.ParagraphFormat.TabStops.ClearAll()
            sel.ParagraphFormat.TabStops.Add(Position=cm_to_pt(tab1), Alignment=0)
            sel.ParagraphFormat.TabStops.Add(Position=cm_to_pt(tab2), Alignment=0)
            sel.ParagraphFormat.TabStops.Add(Position=cm_to_pt(tab3), Alignment=0)
            
            for idx in range(4):
                if idx < len(options):
                    prefix = chr(65 + idx)
                    is_correct = (idx == correct_idx and self.is_answer_key)
                    color_rgb = 255 if is_correct else None
                    highlight_idx = 7 if is_correct else None
                    
                    self.write_run(f"{prefix}. ", bold=True, font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                    for seg in parse_text_formatting(options[idx]):
                        self.write_run(seg["text"], bold=seg["bold"], italic=seg["italic"], underline=seg["underline"], font_size=font_size, color_rgb=color_rgb, highlight_index=highlight_idx)
                
                if idx < 3:
                    self.write_run("\t", bold=False, italic=False, underline=False, font_size=font_size)
            sel.TypeParagraph()
        
        try:
            sel.Font.Underline = 0
        except Exception:
            pass
        try:
            sel.Font.ColorIndex = 0
        except Exception:
            pass

    def add_test_header(self, meta: Dict[str, Any]):
        return pywin32_add_test_header(self, meta)

    def add_answer_key(self, answers: List[Dict[str, str]]):
        return pywin32_add_answer_key(self, answers)

    def add_word_box(self, words: List[str]):
        return pywin32_add_word_box(self, words)

    def compile(self, exercises: List[Dict[str, Any]], output_filepath: Any, grade: str = "", unit: str = "", version_code: str = "", include_answer_key: bool = True, is_answer_key: bool = False, is_test: bool = False):
        self.is_answer_key = is_answer_key
        exercises = normalize_input_exercises(exercises)
        try:
            self._init_word()
            
            if grade or unit or version_code or is_test:
                self.add_test_header(grade=grade, unit=unit, version_code=version_code, is_test=is_test)

            current_block_key = None
            for ex in exercises:
                ex_type = ex.get("t", "mq")
                options = ex.get("o", [])
                if not isinstance(options, list):
                    options = []
                is_mcq = len(options) >= 2
                
                title_prefix = ex.get("title_prefix") or ex.get("prefix") or ex.get("title_num")
                custom_inst = ex.get("instruction") or ex.get("title")
                
                block_key = (ex_type, is_mcq, title_prefix, custom_inst)
                if block_key != current_block_key:
                    current_block_key = block_key
                    inst_body = custom_inst if custom_inst else get_instruction_text(ex_type, is_mcq)
                    if inst_body:
                        if title_prefix and str(title_prefix).strip():
                            final_header = f"{str(title_prefix).strip()} {inst_body}"
                        else:
                            final_header = inst_body
                        self.add_instruction_header(final_header)
                
                if ex_type == "wb":
                    words = ex.get("w", [])
                    if words:
                        self.add_word_box(words)
                    space_before = self.settings.get("passage_space_before", 4.0)
                    space_after = self.settings.get("passage_space_after", 6.0)
                    indent_first = self.settings.get("passage_indent_first", 0.75)
                    
                    sel = self.word.Selection
                    for paragraph_text in ex.get("b", []):
                        sel.ParagraphFormat.SpaceBefore = space_before
                        sel.ParagraphFormat.SpaceAfter = space_after
                        sel.ParagraphFormat.FirstLineIndent = cm_to_pt(indent_first)
                        sel.ParagraphFormat.LeftIndent = 0
                        sel.ParagraphFormat.Alignment = 0
                        segments = parse_text_formatting(paragraph_text)
                        for seg in segments:
                            self.write_run(seg["text"], bold=seg["bold"], italic=seg["italic"], underline=seg["underline"])
                        sel.TypeParagraph()
                        
                    for sub in ex.get("k", []):
                        sub_q = sub.get("q")
                        sub_x = sub.get("x", "")
                        sub_o = sub.get("o", [])
                        sub_a = sub.get("a", "")
                        if sub_q and (sub_x.strip() != "" or sub_o):
                            self.add_question(sub_q, sub_x)
                            if sub_o:
                                self.add_options_grid(sub_o, ex_type, correct_ans=sub_a)

                elif ex_type in ["cz", "rd"]:
                    space_before = self.settings.get("passage_space_before", 4.0)
                    space_after = self.settings.get("passage_space_after", 6.0)
                    indent_first = self.settings.get("passage_indent_first", 0.75)
                    
                    sel = self.word.Selection
                    for paragraph_text in ex.get("b", []):
                        sel.ParagraphFormat.SpaceBefore = space_before
                        sel.ParagraphFormat.SpaceAfter = space_after
                        sel.ParagraphFormat.FirstLineIndent = cm_to_pt(indent_first)
                        sel.ParagraphFormat.LeftIndent = 0
                        sel.ParagraphFormat.Alignment = 0
                        
                        segments = parse_text_formatting(paragraph_text)
                        for seg in segments:
                            self.write_run(seg["text"], bold=seg["bold"], italic=seg["italic"], underline=seg["underline"])
                        sel.TypeParagraph()
                    
                    for sub in ex.get("k", []):
                        sub_q = sub.get("q")
                        sub_x = sub.get("x", "")
                        sub_o = sub.get("o", [])
                        sub_a = sub.get("a", "")
                        
                        self.add_question(sub_q, sub_x)
                        self.add_options_grid(sub_o, ex_type, correct_ans=sub_a)
                        
                else:
                    q_num = ex.get("q")
                    q_text = ex.get("x", "")
                    options = ex.get("o", [])
                    ans = ex.get("a", "")
                    
                    self.add_question(q_num, q_text)
                    self.add_options_grid(options, ex_type, correct_ans=ans)

            if include_answer_key:
                self.add_answer_key(exercises)

            abs_path = os.path.abspath(output_filepath)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            self.doc.SaveAs2(abs_path, FileFormat=16)
        finally:
            if self.doc:
                try: self.doc.Close(False)
                except Exception: pass
            if self.word:
                try: self.word.Quit()
                except Exception: pass
            try:
                if pythoncom: pythoncom.CoUninitialize()
            except Exception: pass


