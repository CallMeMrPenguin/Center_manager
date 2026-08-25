import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { Assignment, AssignmentSubmission } from '../types';

export function useAssignmentsData() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active view: 'list' | 'submissions'
  const [activeView, setActiveView] = useState<'list' | 'submissions'>('list');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState<boolean>(false);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // 1. Fetch classes list
  useEffect(() => {
    let mounted = true;
    api.getClasses('')
      .then((data) => {
        if (mounted) setClasses(data || []);
      })
      .catch((err) => console.error('Failed to load classes:', err));
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch assignments list
  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const cid = selectedClassId !== 'all' ? Number(selectedClassId) : undefined;
      const data = await api.getAssignments(cid, selectedMonth);
      setAssignments(data || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      showToast('Không thể tải danh sách bài tập', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedMonth]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // 3. Fetch submissions for selected assignment
  const loadSubmissions = useCallback(async (assignmentId: number) => {
    try {
      setSubmissionsLoading(true);
      const data = await api.getAssignmentSubmissions(assignmentId);
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      showToast('Không thể tải danh sách nộp bài', 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      loadSubmissions(selectedAssignmentId);
    } else {
      setSubmissions([]);
    }
  }, [selectedAssignmentId, loadSubmissions]);

  // Handler to open submissions view for an assignment
  const handleViewSubmissions = (assign: Assignment) => {
    setSelectedAssignmentId(assign.id);
    setActiveView('submissions');
  };

  // Handler to save batch submissions
  const handleSaveSubmissions = async (updatedSubmissions: AssignmentSubmission[]) => {
    if (!selectedAssignmentId) return;
    try {
      setSubmissionsLoading(true);
      await api.updateAssignmentSubmissions(selectedAssignmentId, updatedSubmissions);
      showToast('Đã lưu kết quả nộp bài thành công!', 'success');
      loadSubmissions(selectedAssignmentId);
      loadAssignments();
    } catch (err) {
      console.error('Failed to save submissions:', err);
      showToast('Không thể lưu kết quả nộp bài: ' + err, 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Selected assignment object
  const currentAssignment = useMemo(() => {
    return assignments.find((a) => a.id === selectedAssignmentId) || null;
  }, [assignments, selectedAssignmentId]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = assignments.length;
    const today = new Date().toISOString().slice(0, 10);
    const dueUpcoming = assignments.filter((a) => a.due_date >= today).length;

    const rates = assignments.map((a) => a.submission_rate || 0);
    const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

    const scores = assignments
      .map((a) => a.avg_score)
      .filter((s): s is number => s !== null && s !== undefined);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    return {
      total,
      dueUpcoming,
      avgRate: Math.trunc(avgRate),
      avgScore: avgScore !== null ? (Math.trunc(avgScore * 10) / 10).toFixed(1) : '-',
    };
  }, [assignments]);

  return {
    classes,
    selectedClassId,
    setSelectedClassId,
    selectedMonth,
    setSelectedMonth,
    assignments,
    loading,
    activeView,
    setActiveView,
    selectedAssignmentId,
    setSelectedAssignmentId,
    currentAssignment,
    submissions,
    submissionsLoading,
    isModalOpen,
    setIsModalOpen,
    editingAssignment,
    setEditingAssignment,
    kpis,
    loadAssignments,
    loadSubmissions,
    handleViewSubmissions,
    handleSaveSubmissions,
  };
}
