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
      label: 'Chưa Xếp Loại',
      color: 'text-slate-400',
      badgeBg: 'bg-slate-500/15 border-slate-500/30',
      evaluation: 'Chưa Đánh Giá',
    };
  }
  if (overall >= 8.5) {
    return {
      label: 'Xuất Sắc',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      evaluation: 'Xuất Chúng (Nắm Vững Kiến Thức)',
    };
  }
  if (overall >= 7.0) {
    return {
      label: 'Giỏi',
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/15 border-indigo-500/30',
      evaluation: 'Ưu Tú (Tiến Bộ Nhanh)',
    };
  }
  if (overall >= 5.0) {
    return {
      label: 'Khá',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/15 border-cyan-500/30',
      evaluation: 'Khá (Đang Tiến Bộ)',
    };
  }
  return {
    label: 'Cần Cố Gắng',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 border-rose-500/30',
    evaluation: 'Cần Củng Cố & Phụ Đạo Thêm',
  };
};

export function useStudentResults() {
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [classEnrolledStudentIds, setClassEnrolledStudentIds] = useState<number[]>([]);
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
        setAllStudents(studentsData || []);
        setClasses(classesData || []);

        if (studentsData && studentsData.length > 0) {
          const first = studentsData.find((s: any) => s.status === 'Đang học') || studentsData[0];
          setSelectedStudentId(first.id);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchInit();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. When selectedClassId changes, fetch enrolled students for that class
  useEffect(() => {
    let mounted = true;
    if (selectedClassId === 'all') {
      setClassEnrolledStudentIds([]);
      return;
    }

    api.getClassStudents(Number(selectedClassId))
      .then((enrolledList) => {
        if (!mounted) return;
        const ids = (enrolledList || []).map((s: any) => s.id || s.student_id);
        setClassEnrolledStudentIds(ids);

        // Auto-switch to first enrolled student in class if current selected student is not in this class
        if (ids.length > 0) {
          setSelectedStudentId((prev) => {
            if (prev && ids.includes(prev)) return prev;
            return ids[0];
          });
        }
      })
      .catch((err) => console.error('Failed to fetch class students:', err));

    return () => {
      mounted = false;
    };
  }, [selectedClassId]);

  // Students list filtered by class
  const students = useMemo(() => {
    if (selectedClassId === 'all') return allStudents;
    return allStudents.filter((s) => classEnrolledStudentIds.includes(s.id));
  }, [allStudents, selectedClassId, classEnrolledStudentIds]);

  // 3. Fetch specific student's grade records
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
      console.error('Failed to load student grade records:', err);
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
    return allStudents.find((s) => s.id === selectedStudentId) || null;
  }, [allStudents, selectedStudentId]);

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
    const performance_index = overall_avg !== null ? (overall_avg * 10).toFixed(1) : '0.0';

    return {
      student_id: currentStudent.id,
      full_name: currentStudent.full_name || 'Học Sinh',
      nickname: currentStudent.nickname,
      grade: currentStudent.grade,
      school: currentStudent.school,
      gender: currentStudent.gender,
      date_of_birth: currentStudent.date_of_birth,
      father_name: currentStudent.father_name,
      father_phone: currentStudent.father_phone,
      mother_name: currentStudent.mother_name,
      mother_phone: currentStudent.mother_phone,
      address: currentStudent.address,
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
      evaluation_text: tier.evaluation,
      performance_index,
    };
  }, [currentStudent, filteredRecords]);

  return {
    students,
    allStudents,
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
