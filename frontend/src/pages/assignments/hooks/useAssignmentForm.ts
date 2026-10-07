import { useState, useEffect, useMemo } from 'react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { Assignment, AssignmentType } from '../types';
import { parseUlnContent } from '../utils/ulnParser';
import { extractUlnSections } from '../utils/ulnSectionExtractor';
import { SAMPLE_UNIT12_ULN_TEXT } from '../constants/sampleUlnTest';

interface UseAssignmentFormProps {
  isOpen: boolean;
  assignment: Assignment | null;
  classes: any[];
  defaultClassId?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function useAssignmentForm({
  isOpen,
  assignment,
  classes,
  defaultClassId,
  onSuccess,
  onClose,
}: UseAssignmentFormProps) {
  const [classId, setClassId] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assignedDate, setAssignedDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [maxScore, setMaxScore] = useState<number>(10);
  const [contentJson, setContentJson] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(0);

  const [assignmentType, setAssignmentType] = useState<AssignmentType>('homework_1');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [proctoringEnabled, setProctoringEnabled] = useState<boolean>(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([]);

  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const sections = useMemo(() => {
    const nodes = parseUlnContent(contentJson);
    return extractUlnSections(nodes);
  }, [contentJson]);

  useEffect(() => {
    if (assignment) {
      setClassId(assignment.class_id);
      setTitle(assignment.title);
      setDescription(assignment.description || '');
      setAssignedDate(assignment.assigned_date);
      setDueDate(assignment.due_date);
      setMaxScore(assignment.max_score || 10);
      setContentJson(assignment.content_json || '');

      const parsed = parseUlnContent(assignment.content_json || '');
      setQuestionCount(parsed.filter((n) => n.type === 'question').length);

      if (assignment.quiz_config) {
        try {
          const cfg = JSON.parse(assignment.quiz_config);
          setAssignmentType(cfg.assignment_type || 'homework_1');
          setTimeLimit(cfg.time_limit_minutes ?? null);
          setMaxAttempts(cfg.max_attempts ?? 1);
          setProctoringEnabled(cfg.proctoring_enabled ?? false);
          if (Array.isArray(cfg.assigned_sections) && cfg.assigned_sections.length > 0) {
            setSelectedSectionIds(cfg.assigned_sections);
          } else {
            const secs = extractUlnSections(parsed);
            setSelectedSectionIds(secs.map((s) => s.id));
          }
        } catch {
          setAssignmentType('homework_1');
          const secs = extractUlnSections(parsed);
          setSelectedSectionIds(secs.map((s) => s.id));
        }
      } else {
        setAssignmentType('homework_1');
        const secs = extractUlnSections(parsed);
        setSelectedSectionIds(secs.map((s) => s.id));
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      const defCid = defaultClassId && defaultClassId !== 'all' ? Number(defaultClassId) : (classes[0]?.id || 0);
      setClassId(defCid);
      setTitle('');
      setDescription('');
      setAssignedDate(today);
      setDueDate(nextWeek);
      setMaxScore(10);
      setContentJson('');
      setQuestionCount(0);
      setAssignmentType('homework_1');
      setTimeLimit(null);
      setMaxAttempts(1);
      setProctoringEnabled(false);
      setSelectedSectionIds([]);
    }
  }, [assignment, classes, defaultClassId, isOpen]);

  useEffect(() => {
    if (!assignment && sections.length > 0 && selectedSectionIds.length === 0) {
      setSelectedSectionIds(sections.map((s) => s.id));
    }
  }, [sections, assignment]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (file.name.endsWith('.txt') || file.name.endsWith('.uln') || file.name.endsWith('.json')) {
        const text = await file.text();
        setContentJson(text);
        const nodes = parseUlnContent(text);
        const qCount = nodes.filter((n) => n.type === 'question').length;
        setQuestionCount(qCount);
        const secs = extractUlnSections(nodes);
        setSelectedSectionIds(secs.map((s) => s.id));
        if (!title.trim()) {
          const h1Node = nodes.find((n) => n.type === 'h1');
          setTitle((h1Node && 'text' in h1Node ? (h1Node as any).text : '') || file.name.replace(/\.[^/.]+$/, ''));
        }
        showToast(`Đã nạp file với ${qCount} câu hỏi`, 'success');
      } else {
        showToast('Vui lòng chọn file định dạng .txt, .uln hoặc .json', 'warning');
      }
    } catch (err: any) {
      showToast('Lỗi khi tải file: ' + (err?.message || err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = () => {
    setContentJson(SAMPLE_UNIT12_ULN_TEXT);
    const nodes = parseUlnContent(SAMPLE_UNIT12_ULN_TEXT);
    const qCount = nodes.filter((n) => n.type === 'question').length;
    setQuestionCount(qCount);
    const secs = extractUlnSections(nodes);
    setSelectedSectionIds(secs.map((s) => s.id));
    if (!title) setTitle('Unit 12: English-Speaking Countries');
    showToast(`Đã nạp đề mẫu với ${qCount} câu hỏi`, 'success');
  };

  const handleTextareaChange = (val: string) => {
    setContentJson(val);
    const nodes = parseUlnContent(val);
    setQuestionCount(nodes.filter((n) => n.type === 'question').length);
    const secs = extractUlnSections(nodes);
    setSelectedSectionIds(secs.map((s) => s.id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !title.trim() || !assignedDate || !dueDate) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc', 'error');
      return;
    }

    if (sections.length > 0 && selectedSectionIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 bài tập trong đề để giao', 'warning');
      return;
    }

    setSaving(true);
    try {
      const quizConfig = {
        assignment_type: assignmentType,
        assigned_sections: selectedSectionIds.length === sections.length ? [] : selectedSectionIds,
        time_limit_minutes: assignmentType === 'homework_2' ? timeLimit : null,
        max_attempts: assignmentType === 'homework_2' ? maxAttempts : 0,
        proctoring_enabled: assignmentType === 'homework_2' ? proctoringEnabled : false,
      };

      const payload = {
        class_id: classId,
        title: title.trim(),
        description: description.trim(),
        assigned_date: assignedDate,
        due_date: dueDate,
        max_score: maxScore,
        content_json: contentJson.trim(),
        quiz_config: JSON.stringify(quizConfig),
      };

      if (assignment) {
        await api.updateAssignment(assignment.id, payload);
        showToast('Cập nhật bài tập thành công', 'success');
      } else {
        await api.createAssignment(payload);
        showToast('Tạo bài tập thành công', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Lỗi khi lưu bài tập: ' + (err?.message || err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment || !window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
    setDeleting(true);
    try {
      await api.deleteAssignment(assignment.id);
      showToast('Đã xóa bài tập', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Lỗi khi xóa bài tập: ' + (err?.message || err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return {
    classId,
    setClassId,
    title,
    setTitle,
    description,
    setDescription,
    assignedDate,
    setAssignedDate,
    dueDate,
    setDueDate,
    maxScore,
    setMaxScore,
    contentJson,
    questionCount,
    assignmentType,
    setAssignmentType,
    timeLimit,
    setTimeLimit,
    maxAttempts,
    setMaxAttempts,
    proctoringEnabled,
    setProctoringEnabled,
    selectedSectionIds,
    setSelectedSectionIds,
    sections,
    saving,
    deleting,
    uploading,
    handleFileUpload,
    handleLoadSample,
    handleTextareaChange,
    handleSave,
    handleDelete,
  };
}
