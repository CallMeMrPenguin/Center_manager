"""
Modular Word Document Compiler Package.
Exports WordDocumentCompiler, WordDocumentCompilerPyWin32, WordDocumentCompilerDocx,
and all core helper utilities for document formatting & exam compilation.
"""
from .common import (
    INSTRUCTION_MAP_MCQ,
    INSTRUCTION_MAP_NON_MCQ,
    cm_to_pt,
    get_instruction_map,
    get_instruction_text,
    normalize_input_exercises,
    parse_text_formatting,
    clean_option_text,
    set_cell_border,
    get_unit_name,
)
from .pywin32_engine import WordDocumentCompilerPyWin32
from .docx_engine import WordDocumentCompilerDocx
from .facade import WordDocumentCompiler

__all__ = [
    "INSTRUCTION_MAP_MCQ",
    "INSTRUCTION_MAP_NON_MCQ",
    "cm_to_pt",
    "get_instruction_map",
    "get_instruction_text",
    "normalize_input_exercises",
    "parse_text_formatting",
    "clean_option_text",
    "set_cell_border",
    "get_unit_name",
    "WordDocumentCompilerPyWin32",
    "WordDocumentCompilerDocx",
    "WordDocumentCompiler",
]
