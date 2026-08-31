export type AssignmentType = 'practice' | 'homework_1' | 'homework_2';

export interface AssignmentQuizConfig {
  assignment_type?: AssignmentType;
  assigned_sections?: number[]; // 1-based section indices e.g. [1, 2, 3, 4, 5, 6]
  time_limit_minutes?: number | null; // e.g. 30, 45 or null
  max_attempts?: number; // e.g. 1, 2, 0 (unlimited)
  proctoring_enabled?: boolean; // anti-cheat screen monitor
  allow_retry_wrong?: boolean; // retry wrong only
  auto_convert_to_practice?: boolean; // convert to practice upon locking
}

export interface UlnSectionItem {
  id: number; // 1-based index
  title: string;
  startNodeIndex: number;
  endNodeIndex: number;
  questionCount: number;
  questionNumbers: string[];
}

export interface Assignment {
  id: number;
  class_id: number;
  class_name?: string;
  title: string;
  description?: string;
  assigned_date: string;
  due_date: string;
  max_score: number;
  content_json?: string;
  quiz_config?: string;
  created_at?: string;
  total_enrolled?: number;
  submitted_count?: number;
  submission_rate?: number;
  avg_score?: number | null;
}

export interface AssignmentDailyLog {
  session: string;
  date: string;
  scope?: string;
  answered_count?: number;
  correct_count?: number;
  score?: number;
  teacher_comment?: string;
}

export interface AssignmentSubmission {
  submission_id?: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  nickname?: string;
  grade?: string;
  submitted: number; // 0 or 1
  score: number | null;
  notes?: string;
  submitted_at?: string | null;
  answers_json?: string;
  daily_logs?: string;
}
