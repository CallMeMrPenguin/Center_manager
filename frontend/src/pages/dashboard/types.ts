export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  todaySessionsCount: number;
  attendanceCompletedCount: number;
}

export interface TodaySessionItem {
  id: number;
  class_id: number;
  class_name: string;
  start_time: string;
  duration: number;
  teacher_name?: string;
  room?: string;
  status: string;
  isAttendanceRecorded: boolean;
}

export interface StudentAlertItem {
  student_id: number;
  student_name: string;
  class_name: string;
  issue: string;
  severity: 'high' | 'medium';
}
