import os
import sys
from typing import List, Dict, Any, Optional
from .common import normalize_input_exercises
from .pywin32_engine import WordDocumentCompilerPyWin32, win32com_available
from .docx_engine import WordDocumentCompilerDocx

class WordDocumentCompiler:
    """Primary Compiler interface that defaults to python-docx XML generation with fallback to pywin32 COM."""
    def __init__(self, settings: Dict[str, Any] = None):
        self.settings = settings or {}

    def compile(self, exercises: List[Dict[str, Any]], output_filepath: Any, grade: str = "", unit: str = "", version_code: str = "", include_answer_key: bool = True, is_answer_key: bool = False, is_test: bool = False):
        # 1. Primary: python-docx XML compiler (fast, reliable, cross-platform)
        try:
            compiler_docx = WordDocumentCompilerDocx(self.settings)
            compiler_docx.compile(exercises, output_filepath, grade=grade, unit=unit, version_code=version_code, include_answer_key=include_answer_key, is_answer_key=is_answer_key, is_test=is_test)
            return
        except Exception as e:
            print(f"[WordCompiler] python-docx compilation failed, falling back to pywin32 COM: {e}")
        
        # 2. Fallback to pywin32 COM if available
        if win32com_available:
            try:
                compiler_win32 = WordDocumentCompilerPyWin32(self.settings)
                compiler_win32.compile(exercises, output_filepath, grade=grade, unit=unit, version_code=version_code, include_answer_key=include_answer_key, is_answer_key=is_answer_key, is_test=is_test)
                return
            except Exception as e:
                print(f"[WordCompiler] pywin32 COM compilation failed: {e}")

    def compile_test_versions(self, exercises: List[Dict[str, Any]], num_versions: int = 1, mix_options: bool = True, grade: str = "", unit: str = "", output_dir: Optional[str] = None):
        import random
        from collections import defaultdict
        try:
            from backend.config.settings import get_setting
        except ImportError:
            from config.settings import get_setting

        target_dir = output_dir if output_dir else get_setting("files_dir")
        os.makedirs(target_dir, exist_ok=True)

        clean_grade = str(grade).replace(" ", "_") if grade else "Test"
        clean_unit = str(unit).replace(" ", "_") if unit else "Unit"
        
        last_filename = ""
        last_filepath = ""
        files_list = []
        base_version = 101

        # Group exercises by question type so each version gets a proportional mix of all types
        grouped_by_type = defaultdict(list)
        for ex in exercises:
            t = ex.get("t", "mq")
            grouped_by_type[t].append(ex)

        version_pools = [[] for _ in range(num_versions)]

        if num_versions > 1:
            for t, t_list in grouped_by_type.items():
                n_items = len(t_list)
                per_v_count = n_items // num_versions
                if per_v_count > 0:
                    for v in range(num_versions):
                        start_idx = v * per_v_count
                        end_idx = (v + 1) * per_v_count if v < num_versions - 1 else min((v + 1) * per_v_count, n_items)
                        version_pools[v].extend(t_list[start_idx:end_idx])
                else:
                    for v, item in enumerate(t_list):
                        if v < num_versions:
                            version_pools[v].append(item)
        else:
            version_pools[0] = list(exercises)

        # Dedicated subfolder for multi-version tests
        if num_versions > 1:
            folder_name = f"Lop_{clean_grade}_Unit_{clean_unit}"
            sub_target_dir = os.path.join(target_dir, folder_name)
            os.makedirs(sub_target_dir, exist_ok=True)
            active_out_dir = sub_target_dir
        else:
            active_out_dir = target_dir

        for i in range(num_versions):
            version_code = str(base_version + i)
            filename = f"De_Lop{clean_grade}_Unit{clean_unit}_MDT{version_code}.docx"
            filepath = os.path.join(active_out_dir, filename)

            ex_copy = copy.deepcopy(version_pools[i])
            # Re-number questions 1..N for each test version
            for idx, ex in enumerate(ex_copy, start=1):
                ex["q"] = idx

            if mix_options:
                import re
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

                for ex in ex_copy:
                    _mix_item(ex)
                    for sub_key in ["k", "questions"]:
                        sub_list = ex.get(sub_key)
                        if isinstance(sub_list, list):
                            for sub in sub_list:
                                if isinstance(sub, dict):
                                    _mix_item(sub)

            self.compile(ex_copy, filepath, grade=grade, unit=unit, version_code=version_code, include_answer_key=True)
            
            last_filename = filename
            last_filepath = filepath
            files_list.append({"filename": filename, "filepath": filepath, "version_code": version_code})

        return last_filename, last_filepath, files_list

    def convert_docx_to_pdf_soffice(self, docx_path: str, pdf_path: str) -> bool:
        out_dir = os.path.dirname(pdf_path)
        os.makedirs(out_dir, exist_ok=True)
        abs_docx = os.path.abspath(docx_path)
        abs_pdf = os.path.abspath(pdf_path)

        if win32com_available:
            try:
                pythoncom.CoInitialize()
                word = win32com.client.Dispatch("Word.Application")
                word.Visible = False
                doc = word.Documents.Open(abs_docx)
                doc.SaveAs(abs_pdf, FileFormat=17)  # 17 = wdFormatPDF
                doc.Close(False)
                word.Quit()
                try: pythoncom.CoUninitialize()
                except Exception: pass
                if os.path.exists(abs_pdf):
                    return True
            except Exception as e:
                print(f"MS Word COM PDF conversion failed: {e}")

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
