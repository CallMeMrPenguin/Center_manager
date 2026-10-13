import os
import sys
import json
import math
import copy
import time
import random
from typing import List, Dict, Any, Optional

# pywin32 imports
try:
    import pythoncom
    import win32com.client
    win32com_available = True
except Exception:
    win32com_available = False

# python-docx imports (fallback & parser support)
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
    "mq": "Mark the letter A, B, C, or D on your answer sheet to indicate the answer that best fits each of the following questions.",
    "wb": "Complete each blank with ONE suitable word from the box.",
    "wq": "Write questions for the underlined parts in each of the following sentences.",
    "mt": "Match each item in the left column with the appropriate item in the right column.",
    "tf": "Decide whether the following statements are True (T) or False (F).",
    "pc": "Look at the pictures and name the activities or objects.",
    "cl": "Put the words into the correct column depending on their category."
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
    "mq": "Complete each of the following questions.",
    "wb": "Complete each blank with ONE suitable word from the box.",
    "wq": "Write questions for the underlined parts in each of the following sentences.",
    "mt": "Match each item in the left column with the appropriate item in the right column.",
    "tf": "Decide whether the following statements are True (T) or False (F).",
    "pc": "Look at the pictures and name the activities or objects.",
    "cl": "Put the words into the correct column depending on their category."
}


def cm_to_pt(cm: float) -> float:
    return float(cm) * 28.346456692913385

def _find_root_config(filename: str) -> str:
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    new_p = os.path.join(root, "configs", filename)
    if os.path.exists(new_p): return new_p
    old_p = os.path.join(root, filename)
    return old_p if os.path.exists(old_p) else new_p

def get_instruction_map():
    config_file = _find_root_config("exercise_config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                custom_map = json.load(f)
                return {**INSTRUCTION_MAP_MCQ, **custom_map}
        except Exception:
            pass
    return INSTRUCTION_MAP_MCQ

def get_instruction_text(ex_type: str, is_mcq: bool = True) -> str:
    config_file = _find_root_config("exercise_config.json")
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

def normalize_input_exercises(exercises: Any) -> List[Dict[str, Any]]:
    """
    Normalizes any input JSON format (dict with 'data'/'questions'/'exercises'/'list', 
    nested section objects with 'k' containing sub-questions for non-passage types, or flat lists)
    into a standardized list of exercise objects for the compiler.
    """
    if isinstance(exercises, dict):
        for key in ["data", "exercises", "questions", "list"]:
            if key in exercises and isinstance(exercises[key], list):
                exercises = exercises[key]
                break
        else:
            if "t" in exercises or "q" in exercises:
                exercises = [exercises]
            else:
                return []

    if not isinstance(exercises, list):
        return []

    normalized = []
    for ex in exercises:
        if not isinstance(ex, dict):
            continue
        
        ex_type = ex.get("t", "mq")
        k_list = ex.get("k", [])

        if isinstance(k_list, list) and len(k_list) > 0 and ex_type not in ["cz", "rd", "wb"]:
            title_prefix = ex.get("title_prefix") or ex.get("prefix") or ex.get("title_num")
            custom_inst = ex.get("instruction") or ex.get("title") or ex.get("x")
            
            for sub in k_list:
                if isinstance(sub, dict):
                    item = {
                        "t": ex_type,
                        "title_prefix": title_prefix,
                        "instruction": custom_inst,
                        "q": sub.get("q"),
                        "x": sub.get("x", ""),
                        "o": sub.get("o", []),
                        "a": sub.get("a", "")
                    }
                    if "fmt" in ex and "fmt" not in item:
                        item["fmt"] = ex["fmt"]
                    normalized.append(item)
        else:
            normalized.append(ex)

    return normalized

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

def clean_option_text(opt: Any) -> str:
    """Strips leading option prefixes like A., B., C., D., A), B), A:, B:, or repeated A. B. from option text."""
    import re
    if opt is None:
        return ""
    if not isinstance(opt, str):
        opt = str(opt)
    opt = opt.strip()
    return re.sub(r'^(\s*(?:\*\*)?\s*[A-Ea-e]\s*[\.\:\)]\s*(?:\*\*)?\s*)+', '', opt).strip()


def set_cell_border(cell, **kwargs):
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
    config_path = _find_root_config("unit_config.json")
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


