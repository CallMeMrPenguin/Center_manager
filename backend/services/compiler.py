"""
Backward-compatibility proxy for services.compiler module.
All implementations are now modularized in services.compiler.* package.
"""
from services.compiler import (
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
    WordDocumentCompilerPyWin32,
    WordDocumentCompilerDocx,
    WordDocumentCompiler,
)

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
