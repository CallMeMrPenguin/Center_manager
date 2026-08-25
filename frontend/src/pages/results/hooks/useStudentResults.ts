import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../../api';
import { StudentResultRecord, StudentProfileSummary } from '../types';

export const trunc1Dec = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '-';
  const truncated = Math.trunc(val * 10) / 10;
  return truncated.toFixed(1);
};

export const computeTier = (overall: number | null) => {
  if (overall === null) {
    return {
      label: 'Chưa xếp loại',
      color: 'text-slate-400',
      badgeBg: 'bg-slate-500/10 border-slate-500/30',
    };
  }
  if (overall >= 8.5) {
    return {
      label: 'Xuất Sắc',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    };
  }
  if (overall >= 7.0) {
    return {
      label: 'Giỏi',
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/15 border-blue-500/30',
    };
  }
  if (overall >= 5.0) {
    return {
      label: 'Khá',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
    };
  }
  return {
    label: 'Cần Cố Gắng',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
  };
};

export function useStudentResults() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [rawRecords, setRawRecords] = useState<StudentResultRecord[]>([]);

  // 1. Fetch Students & Classes list on mount
  useEffect(() => {
    let mounted = true;
    const fetchInit = async () => {
      try {
        setLoading(true);
        const [studentsData, classesData] = await Promise.all([
          api.getStudents('', ''),
          api.getClasses(''),
        ]);
        if (!mounted) return;
        setStudents(studentsData || []);
        setClasses(classesData || []);

        // Pick first active student by default if none selected
        if (studentsData && studentsData.length > 0) {
          const first = studentsData.find((s: any) => s.status === 'Đang học') || studentsData[0];
          setSelectedStudentId(first.id);
        }
      } catch (err) {
        console.error('Failed to load students / classes:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchInit();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch specific student's grade analytics records
  const loadStudentData = useCallback(async (studentId: number) => {
    try {
      setLoading(true);
      const res = await api.getGradeAnalytics(undefined, studentId);
      const recs = (res.session_records || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        class_id: r.class_id,
        class_name: r.class_name,
        student_id: r.student_id,
        student_name: r.student_name,
        status: r.status || 'Có mặt',
        check_1: r.check_1 !== undefined && r.check_1 !== null ? Number(r.check_1) : null,
        check_2: r.check_2 !== undefined && r.check_2 !== null ? Number(r.check_2) : null,
        homework: r.homework !== undefined && r.homework !== null ? Number(r.homework) : null,
        mock_test: r.mock_test !== undefined && r.mock_test !== null ? Number(r.mock_test) : null,
        notes: r.notes || '',
      }));
      setRawRecords(recs);
    } catch (err) {
      console.error('Failed to load grade analytics for student:', err);
      setRawRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentData(selectedStudentId);
    } else {
      setRawRecords([]);
    }
  }, [selectedStudentId, loadStudentData]);

  // Current selected student object
  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Filtered records by class
  const filteredRecords = useMemo(() => {
    if (selectedClassId === 'all') return rawRecords;
    return rawRecords.filter((r) => String(r.class_id) === String(selectedClassId));
  }, [rawRecords, selectedClassId]);

  // Summary Metrics Calculation
  const summary = useMemo<StudentProfileSummary | null>(() => {
    if (!currentStudent) return null;

    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'Có mặt').length;
    const absent = total - present;
    const attendance_rate = total > 0 ? (present / total) * 100 : 100;

    const c1Scores = filteredRecords.map((r) => r.check_1).filter((s): s is number => s !== null);
    const c2Scores = filteredRecords.map((r) => r.check_2).filter((s): s is number => s !== null);
    const hwScores = filteredRecords.map((r) => r.homework).filter((s): s is number => s !== null);
    const mockScores = filteredRecords.map((r) => r.mock_test).filter((s): s is number => s !== null);

    const avg_check_1 = c1Scores.length > 0 ? c1Scores.reduce((a, b) => a + b, 0) / c1Scores.length : null;
    const avg_check_2 = c2Scores.length > 0 ? c2Scores.reduce((a, b) => a + b, 0) / c2Scores.length : null;
    const avg_homework = hwScores.length > 0 ? hwScores.reduce((a, b) => a + b, 0) / hwScores.length : null;
    const avg_mock_test = mockScores.length > 0 ? mockScores.reduce((a, b) => a + b, 0) / mockScores.length : null;

    const allScores = [...c1Scores, ...c2Scores, ...hwScores, ...mockScores];
    const overall_avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null;

    const tier = computeTier(overall_avg);

    return {
      student_id: currentStudent.id,
      full_name: currentStudent.full_name || 'Học Sinh',
      nickname: currentStudent.nickname,
      grade: currentStudent.grade,
      school: currentStudent.school,
      status: currentStudent.status,
      enrolled_classes: currentStudent.enrolled_classes,
      total_sessions: total,
      present_sessions: present,
      absent_sessions: absent,
      attendance_rate,
      avg_check_1,
      avg_check_2,
      avg_homework,
      avg_mock_test,
      overall_avg,
      tier_label: tier.label,
      tier_color: tier.color,
      tier_badge_bg: tier.badgeBg,
    };
  }, [currentStudent, filteredRecords]);

  return {
    students,
    selectedStudentId,
    setSelectedStudentId,
    currentStudent,
    classes,
    selectedClassId,
    setSelectedClassId,
    loading,
    records: filteredRecords,
    summary,
    refresh: () => {
      if (selectedStudentId) loadStudentData(selectedStudentId);
    },
  };
}
