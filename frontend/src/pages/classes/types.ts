export interface ClassItem {
  id: number;
  class_name: string;
  teacher_id?: number;
  teacher_name?: string;
  grade?: string;
  subject?: string;
  room?: string;
  status: 'Đang hoạt động' | 'Tạm dừng' | 'Đã kết thúc';
  color?: string;
  notes?: string;
  student_count?: number;
}

export interface EnrolledStudent {
  id: number;
  full_name: string;
  nickname?: string;
  grade?: string;
  school?: string;
  gender?: string;
}

export interface TeacherCM {
  id: number;
  full_name: string;
}

export interface ClassDayConfig {
  checked: boolean;
  time: string;
  duration: number;
}

export interface AttendanceRecord {
  id?: number;
  student_id: number;
  student_name: string;
  status?: string;
  check_1?: string | number | null;
  check_2?: string | number | null;
  homework?: string | number | null;
  homework_2?: string | number | null;
  mock_test?: string | number | null;
  pred_check_1?: string | number | null;
  pred_check_2?: string | number | null;
  pred_homework?: string | number | null;
  pred_homework_2?: string | number | null;
  pred_mock_test?: string | number | null;
  pred_c1?: string | number | null;
  pred_c2?: string | number | null;
  pred_hw?: string | number | null;
  pred_mt?: string | number | null;
  predicted_next?: string | number | null;
  prediction_model?: string | null;
  notes?: string;
}

export interface SeatingSeat {
  desk: number;
  position: number;
  student_id: number | null;
  student_name: string | null;
}

export interface SeatingCol {
  col_index: number;
  desks_in_col: number;
  seats: SeatingSeat[];
}

export interface GradingPair {
  student1_name?: string;
  grader_name?: string;
  student2_name?: string;
  owner_name?: string;
  same_group_conflict?: boolean;
}

export const GRADE_LIST = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6',
  'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'
];

export const WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export const DEFAULT_PALETTE = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f43f5e'  // Rose
];

export function getClassColor(cls: ClassItem, index: number): string {
  if (cls.color && cls.color.startsWith('#')) {
    return cls.color;
  }
  const notesMatch = (cls.notes || '').match(/#COLOR:(#[0-9a-fA-F]{6})/);
  if (notesMatch) {
    return notesMatch[1];
  }
  return DEFAULT_PALETTE[(cls.id || index) % DEFAULT_PALETTE.length];
}

export function hexToRGBA(hex: string, alpha: number): string {
  let c = (hex || '#3b82f6').replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(59, 130, 246, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
