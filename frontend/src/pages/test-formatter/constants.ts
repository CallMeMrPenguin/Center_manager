import { LayoutSettings } from '../../types';
import { PromptItem } from '../../components/PromptManager';
import { ULN_OCR_SYSTEM_PROMPT } from '../assignments/constants/ulnPromptTemplate';

export const DEFAULT_TEST_FORMATTER_PROMPTS: PromptItem[] = [
  {
    id: "tf_universal_v2",
    title: "Universal Test & Exercise Serialization Agent Prompt (18 Exercise Types)",
    content: `You are an expert Document, Test, and Exercise Serialization Agent for Microsoft Word DOCX compilation.
Your job is to parse tests/exercises from source text/images into strict JSON matching the universal compiler schema.

==================================================
OUTPUT FORMAT MANDATE
==================================================
• Provide your response inside a single \`\`\`json code block containing valid JSON.
• Absolutely NO text, intro, explanations, or conversational filler outside the JSON code block.

==================================================
CORE CONTENT SCHEMA
==================================================

Top-level object MUST contain a "data" array:
{
  "data": [ ... ]
}

Each object in "data" represents a section or exercise and uses these fields:

1. "t": (String) Exercise type code. MUST be one of:
   - "pr" : Pronunciation / Underlined sound (MCQ or classification)
   - "st" : Stress pattern distinction (MCQ)
   - "sy" : Synonym / Closest in meaning (MCQ with bracketed target word)
   - "an" : Antonym / Opposite in meaning (MCQ with bracketed target word)
   - "er" : Error Identification & Correction ([text](A) ... or [TAB2] sentence | <blank>)
   - "fb" : Fill in the Blank (Word form in brackets, Verb tense, Prepositions, Standalone sentence)
   - "rw" : Rewrite Sentence / Sentence Transformation (e.g. "→ Starting phrase <blank>")
   - "wq" : Write Question (Write question A: for given answer B:)
   - "wb" : Word Box Passage (Fill blanks with words from a given word bank box)
   - "cz" : Cloze Passage (Passage with numbered blanks and MCQ A/B/C/D choices per blank)
   - "rd" : Reading Comprehension Passage with comprehension questions
   - "ro" : Sentence / Dialogue Reordering (Scrambled phrases or dialogue lines)
   - "mt" : Matching (Connect Left items "o" to Right items "p")
   - "tf" : True / False statements
   - "sg" : Sign Meaning (MCQ)
   - "nt" : Notice Meaning (MCQ)
   - "pc" : Picture Vocabulary (Identify words from pictures / diagrams)
   - "cl" : Column Classification / Word Sorting (Sort words into columns e.g. PLAY / GO / DO)

2. "q": (String) Question number. e.g., "1", "15".
3. "x": (String) Question sentence / prompt text / instruction.
4. "o": (Array) Answer choices array ["option A", "option B", "option C", "option D"] or LEFT matching items.
5. "a": (String | Array) Correct answer string ("A", "B", "C", "D" or open-ended answer text).
6. "b": (String) Passage body text or dialogue text. Used by "wb", "cz", "rd", "nt".
7. "k": (Array of Objects) Sub-questions grouped under a shared instruction heading.
8. "w": (Array of Strings) Word bank list for "wb" or "cl". Rendered in a rounded box above the exercise.
9. "p": (Array of Strings) RIGHT-column pool for "mt" (matching).

==================================================
INLINE TEXT FORMATTING RULES
==================================================
- Target Underline:        [word]{u}     → e.g., "[po]{u}ttery", "fl[ow]{u}er"
- Target Underline + Bold: [word]{u,b}   → e.g., "[th]{u,b}ink"
- Bold Text:               **word**      → e.g., "**SECTION A: PHONETICS**"
- Italic Text:             *word*        → e.g., "*Note:*"
- Student Answer Blank:    <blank>       → e.g., "She usually goes <blank> with her friends."
- Error ID Fragment:       [text](LTR)   → e.g., "She [go](A) to [school](B) yesterday."`
  },
  {
    id: "tf_uln_dsl_v1",
    title: "Universal Layout Notation (ULN) DSL Extraction & Compilation Agent Prompt",
    content: ULN_OCR_SYSTEM_PROMPT,
  }
];

export const DEFAULT_LAYOUT: LayoutSettings = {
  margin_top: 2.0,
  margin_bottom: 2.0,
  margin_left: 3.0,
  margin_right: 1.5,
  font_name: "Times New Roman",
  font_size: 12.0,
  line_spacing: 1.15,
  space_after: 6.0,
  header_space_before: 14.0,
  header_space_after: 8.0,
  question_space_before: 6.0,
  question_space_after: 4.0,
  options_left_indent: 0.5,
  options_space_before: 0.0,
  options_space_after: 3.0,
  passage_space_before: 4.0,
  passage_space_after: 6.0,
  passage_indent_first: 0.75,
  reorder_space_before: 0.0,
  reorder_space_after: 2.0,
  reorder_left_indent: 1.0,
  notice_space_before: 4.0,
  notice_space_after: 6.0,
  notice_left_indent: 1.0
};

export const EXERCISE_LABELS: Record<string, string> = {
  'pr': 'Phát âm (Pronunciation)',
  'st': 'Trọng âm (Stress)',
  'sy': 'Đồng nghĩa (Synonyms)',
  'an': 'Trái nghĩa (Antonyms)',
  'er': 'Tìm lỗi sai (Error Identification)',
  'fb': 'Điền từ / Dạng từ (Fill in the Blank)',
  'rw': 'Viết lại câu (Sentence Transformation)',
  'wq': 'Đặt câu hỏi (Write Questions)',
  'wb': 'Hộp từ (Word Box Passage)',
  'cz': 'Đọc điền khuyết (Cloze Passage)',
  'rd': 'Đọc hiểu (Reading Comprehension)',
  'ro': 'Sắp xếp câu (Reordering)',
  'mt': 'Nối cột (Matching)',
  'tf': 'Đúng / Sai (True / False)',
  'sg': 'Biển báo (Signs)',
  'nt': 'Thông báo (Notices)',
  'pc': 'Hình ảnh (Picture Vocabulary)',
  'cl': 'Phân loại cột (Word Sorting)',
  'mq': 'Trắc nghiệm tổng hợp (Multiple Choice)'
};

export const UNIT_CHOICES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Giữa kì 1", "Cuối kì 1", "Giữa kì 2", "Cuối kì 2"];
