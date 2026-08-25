export interface Assignment {
  id: number;
  class_id: number;
  class_name?: string;
  title: string;
  description?: string;
  assigned_date: string;
  due_date: string;
  max_score: number;
  created_at?: string;
  total_enrolled?: number;
  submitted_count?: number;
  submission_rate?: number;
  avg_score?: number | null;
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
}
