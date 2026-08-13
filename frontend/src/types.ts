export interface AppFile {
  name: string;
  size: number;
  mtime: number;
  type: 'json' | 'docx' | 'pdf' | 'csv' | 'other';
}

export interface GradeWeights {
  check_1: number;
  check_2: number;
  homework: number;
}

export interface GradeTypeItem {
  id: string;
  label: string;
  weight: number;
  color?: string;
}

export interface AppSettings {
  files_dir: string;
  machine_id: string;
  pdf_server_port?: number;
  theme?: any;
  grade_weights?: GradeWeights;
  grade_types?: GradeTypeItem[];
}

export interface LayoutSettings {
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  font_name: string;
  font_size: number;
  line_spacing: number;
  space_after: number;
  header_space_before: number;
  header_space_after: number;
  question_space_before: number;
  question_space_after: number;
  options_left_indent: number;
  options_space_before: number;
  options_space_after: number;
  passage_space_before: number;
  passage_space_after: number;
  passage_indent_first: number;
  reorder_space_before: number;
  reorder_space_after: number;
  reorder_left_indent: number;
  notice_space_before: number;
  notice_space_after: number;
  notice_left_indent: number;
}

export interface SystemCheck {
  word_installed: boolean;
  win32_com_error: string | null;
  python_version: string;
  docx_library_present: boolean;
}

export interface DbQuestion {
  id: number;
  grade: string;
  unit: string;
  test_type: string;
  x: string;
  t: string;
  o: string[];
  a: string;
  level: string;
  frequency: string;
}

export interface DbVocab {
  id: number;
  no: string;
  grade: string;
  unit: string;
  vocabulary: string;
  pos: string;
  ipa: string;
  meaning: string;
  difficulty: string;
  root_word: string;
}

export interface Student {
  id?: number;
  full_name: string;
  nickname?: string;
  enrolled_classes?: string;
  gender?: string;
  grade?: string;
  date_of_birth?: string;
  enroll_date?: string;
  school?: string;
  status?: string;
  father_name?: string;
  father_phone?: string;
  mother_name?: string;
  mother_phone?: string;
  address?: string;
  notes?: string;
}
