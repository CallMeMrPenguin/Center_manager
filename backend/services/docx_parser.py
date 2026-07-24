import os
import re
import json
from typing import List, Dict, Any
from docx import Document
from docx.shared import RGBColor
from docx.enum.text import WD_COLOR_INDEX
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from docx.table import Table

from services.compiler import get_instruction_map

OPTION_PREFIX_RE = re.compile(r'^\s*(?:\*\*)?\s*([A-E])\s*(?:\.(?:\*\*)?|(?:\*\*)?\.)\s*(.*)', re.DOTALL)
QUESTION_RE = re.compile(r'^\s*(?:\*\*)?Question\s+(\d+)\s*(?::)?\s*(?:\*\*)?\s*(?::)?\s*(.*)', re.IGNORECASE | re.DOTALL)

def normalize_q_key(q_val):
    try:
        return int(q_val)
    except (ValueError, TypeError):
        import re
        match = re.search(r'\d+', str(q_val))
        if match:
            return int(match.group(0))
    return str(q_val)

def split_paragraph_runs_by_tab(paragraph):
    options_runs = []
    current_runs = []
    for run in paragraph.runs:
        if '\t' in run.text:
            parts = run.text.split('\t')
            if parts[0]:
                current_runs.append({
                    'text': parts[0],
                    'bold': run.bold,
                    'italic': run.italic,
                    'underline': run.underline,
                    'highlight': run.font.highlight_color,
                    'color_rgb': run.font.color.rgb if run.font.color else None
                })
            options_runs.append(current_runs)
            
            for part in parts[1:-1]:
                options_runs.append([{
                    'text': part,
                    'bold': run.bold,
                    'italic': run.italic,
                    'underline': run.underline,
                    'highlight': run.font.highlight_color,
                    'color_rgb': run.font.color.rgb if run.font.color else None
                }] if part else [])
                
            current_runs = []
            if parts[-1]:
                current_runs.append({
                    'text': parts[-1],
                    'bold': run.bold,
                    'italic': run.italic,
                    'underline': run.underline,
                    'highlight': run.font.highlight_color,
                    'color_rgb': run.font.color.rgb if run.font.color else None
                })
        else:
            current_runs.append({
                'text': run.text,
                'bold': run.bold,
                'italic': run.italic,
                'underline': run.underline,
                'highlight': run.font.highlight_color,
                'color_rgb': run.font.color.rgb if run.font.color else None
            })
    if current_runs:
        options_runs.append(current_runs)
    return options_runs

def run_dicts_to_markdown(run_dicts):
    md_parts = []
    i = 0
    while i < len(run_dicts):
        run = run_dicts[i]
        text = run['text']
        if not text:
            i += 1
            continue
        
        # Check if underlined and next is bold '(A)' or similar
        if run['underline'] and (i + 1 < len(run_dicts)):
            next_run = run_dicts[i + 1]
            if next_run['bold'] and next_run['text'].strip() in ['(A)', '(B)', '(C)', '(D)']:
                let = next_run['text'].strip().replace('(', '').replace(')', '')
                clean_text = text.strip()
                leading = text[:len(text)-len(text.lstrip())]
                trailing = text[len(text.rstrip()):]
                md_parts.append(f"{leading}[{clean_text}]({let}){trailing}")
                i += 2
                continue
                
        bold = run['bold']
        italic = run['italic']
        underline = run['underline']
        
        clean_text = text.strip()
        if not clean_text:
            md_parts.append(text)
            i += 1
            continue
            
        leading = text[:len(text)-len(text.lstrip())]
        trailing = text[len(text.rstrip()):]
        
        formatted = clean_text
        if underline:
            formatted = f"[{formatted}]"
        if bold:
            formatted = f"**{formatted}**"
        if italic:
            formatted = f"*{formatted}*"
            
        md_parts.append(f"{leading}{formatted}{trailing}")
        i += 1
    return "".join(md_parts)

def parse_runs_to_markdown(paragraph) -> str:
    run_dicts = []
    for run in paragraph.runs:
        run_dicts.append({
            'text': run.text,
            'bold': run.bold,
            'italic': run.italic,
            'underline': run.underline,
            'highlight': run.font.highlight_color,
            'color_rgb': run.font.color.rgb if run.font.color else None
        })
    return run_dicts_to_markdown(run_dicts)

def parse_answer_key_table(doc) -> Dict[int, str]:
    answers = {}
    for table in reversed(doc.tables):
        is_answer_table = False
        temp_answers = {}
        for row in table.rows:
            for cell in row.cells:
                text = cell.text.strip()
                if not text:
                    continue
                match = re.match(r'^(\d+)\.\s*([A-E])$', text)
                if match:
                    is_answer_table = True
                    q_num = int(match.group(1))
                    ans = match.group(2)
                    temp_answers[q_num] = ans
        if is_answer_table:
            answers.update(temp_answers)
            break
    return answers

def match_instruction(text: str) -> str:
    text_lower = text.lower()
    inst_map = get_instruction_map()
    
    for k, v in inst_map.items():
        if text.strip() == v.strip():
            return k
            
    if "pronunciation" in text_lower and "differ" in text_lower:
        return "pr"
    if "stress" in text_lower and "differ" in text_lower:
        return "st"
    if "closest in meaning" in text_lower:
        return "sy"
    if "opposite in meaning" in text_lower:
        return "an"
    if "meaning of the sign" in text_lower:
        return "sg"
    if "meaning of the notice" in text_lower:
        return "nt"
    if "fits each of the numbered blanks" in text_lower:
        return "cz"
    if "arrangement of the sentences" in text_lower:
        return "ro"
    if "read the following passage" in text_lower:
        return "rd"
    if "needs correction" in text_lower or "needs-correction" in text_lower or "underlined part that needs correction" in text_lower:
        return "er"
    if "correct answer" in text_lower:
        return "mq"
        
    return None

def iter_blocks(doc):
    for child in doc.element.body:
        if child.tag == qn('w:p'):
            yield Paragraph(child, doc)
        elif child.tag == qn('w:tbl'):
            yield Table(child, doc)

def convert_docx_to_json(filepath: str) -> List[Dict[str, Any]]:
    doc = Document(filepath)
    answers_map = parse_answer_key_table(doc)
    
    exercises = []
    active_type = None
    
    passage_paragraphs = []
    reorder_sentences = []
    notice_body = ""
    current_question = None
    current_sub_question = None
    last_block_was_question_or_option = False
    
    parent_exercise = None
    is_first_table = True
    
    for block in iter_blocks(doc):
        if isinstance(block, Table):
            if is_first_table:
                is_first_table = False
                continue
            continue
            
        p_text = block.text.strip()
        if not p_text:
            continue
            
        inst_type = match_instruction(p_text)
        if inst_type:
            active_type = inst_type
            current_instruction = p_text
            passage_paragraphs = []
            reorder_sentences = []
            notice_body = ""
            current_question = None
            current_sub_question = None
            parent_exercise = None
            last_block_was_question_or_option = False
            continue
            
        if p_text.upper().startswith("UNIT") and active_type is None:
            continue
            
        p_markdown = parse_runs_to_markdown(block)
        
        q_match = QUESTION_RE.match(p_markdown)
        if q_match:
            q_num = int(q_match.group(1))
            q_text = q_match.group(2).strip()
            
            last_block_was_question_or_option = True
            
            if active_type in ["cz", "rd"]:
                if parent_exercise is None or passage_paragraphs:
                    parent_exercise = {
                        "t": active_type,
                        "instruction": current_instruction if 'current_instruction' in locals() else "",
                        "b": passage_paragraphs.copy(),
                        "k": []
                    }
                    exercises.append(parent_exercise)
                    passage_paragraphs.clear()
                    
                current_sub_question = {
                    "q": q_num,
                    "x": q_text,
                    "instruction": current_instruction if 'current_instruction' in locals() else "",
                    "o": [],
                    "a": ""
                }
                parent_exercise["k"].append(current_sub_question)
                current_question = None
                
            elif active_type == "ro":
                current_question = {
                    "t": "ro",
                    "q": q_num,
                    "x": q_text,
                    "instruction": current_instruction if 'current_instruction' in locals() else "",
                    "i": reorder_sentences.copy(),
                    "o": [],
                    "a": ""
                }
                exercises.append(current_question)
                reorder_sentences.clear()
                current_sub_question = None
                
            elif active_type == "nt":
                current_question = {
                    "t": "nt",
                    "q": q_num,
                    "x": q_text,
                    "instruction": current_instruction if 'current_instruction' in locals() else "",
                    "b": "",
                    "o": [],
                    "a": ""
                }
                exercises.append(current_question)
                current_sub_question = None
                
            else:
                current_question = {
                    "t": active_type or "mq",
                    "q": q_num,
                    "x": q_text,
                    "instruction": current_instruction if 'current_instruction' in locals() else "",
                    "o": [],
                    "a": ""
                }
                exercises.append(current_question)
                current_sub_question = None
                
            continue
            
        options_split_runs = split_paragraph_runs_by_tab(block)
        is_option_paragraph = False
        parsed_options = []
        
        for option_runs in options_split_runs:
            opt_md = run_dicts_to_markdown(option_runs)
            opt_match = OPTION_PREFIX_RE.match(opt_md)
            if opt_match:
                is_option_paragraph = True
                opt_letter = opt_match.group(1)
                opt_val = opt_match.group(2).strip()
                
                is_correct = False
                for r in option_runs:
                    if r['highlight'] is not None:
                        is_correct = True
                    elif r['color_rgb'] == RGBColor(255, 0, 0):
                        is_correct = True
                        
                parsed_options.append((opt_letter, opt_val, is_correct))
                
        if is_option_paragraph:
            last_block_was_question_or_option = True
            target = current_sub_question if active_type in ["cz", "rd"] else current_question
            
            if target:
                for letter, val, is_correct in parsed_options:
                    target["o"].append(val)
                    if is_correct:
                        target["a"] = letter
            continue
            
        if active_type == "nt" and current_question and not current_question["b"]:
            notice_txt = p_markdown.strip()
            if notice_txt.startswith("*") and notice_txt.endswith("*"):
                notice_txt = notice_txt[1:-1].strip()
            current_question["b"] = notice_txt
            last_block_was_question_or_option = False
            
        elif active_type == "ro":
            reorder_sentences.append(p_markdown)
            last_block_was_question_or_option = False
            
        elif active_type in ["cz", "rd"]:
            if last_block_was_question_or_option:
                passage_paragraphs.clear()
                parent_exercise = None
                
            passage_paragraphs.append(p_markdown)
            last_block_was_question_or_option = False
            
    for ex in exercises:
        ex_type = ex.get("t")
        if ex_type in ["cz", "rd"]:
            for sub in ex.get("k", []):
                q_key = normalize_q_key(sub.get("q"))
                if q_key in answers_map and not sub.get("a"):
                    sub["a"] = answers_map[q_key]
        else:
            q_key = normalize_q_key(ex.get("q"))
            if q_key in answers_map and not ex.get("a"):
                ex["a"] = answers_map[q_key]
                
    return exercises
