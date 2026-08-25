export interface StudentResultRecord {
  id?: number;
  date: string;
  class_id: number;
  class_name?: string;
  student_id: number;
  student_name?: string;
  status: 'Có mặt' | 'Vắng mặt' | string;
  check_1: number | null;
  check_2: number | null;
  homework: number | null;
  mock_test: number | null;
  notes?: string;
}

export interface StudentProfileSummary {
  student_id: number;
  full_name: string;
  nickname?: string;
  grade?: string;
  school?: string;
  gender?: string;
  date_of_birth?: string;
  father_name?: string;
  father_phone?: string;
  mother_name?: string;
  mother_phone?: string;
  address?: string;
  status?: string;
  enrolled_classes?: string;
  total_sessions: number;
  present_sessions: number;
  absent_sessions: number;
  attendance_rate: number;
  avg_check_1: number | null;
  avg_check_2: number | null;
  avg_homework: number | null;
  avg_mock_test: number | null;
  overall_avg: number | null;
  tier_label: string;
  tier_color: string;
  tier_badge_bg: string;
  evaluation_text: string;
  performance_index: string;
}
