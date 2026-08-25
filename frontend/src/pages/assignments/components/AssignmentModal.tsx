import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, BookOpen, Upload, Sparkles, CheckCircle, FileText } from 'lucide-react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { Assignment } from '../types';
import { SAMPLE_UNIT12_ULN_TEXT } from '../constants/sampleUlnTest';
import { parseUlnContent } from '../utils/ulnParser';
import { PromptTemplateModal } from './PromptTemplateModal';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  classes: any[];
  defaultClassId?: string;
  onSuccess: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  classes,
  defaultClassId,
  onSuccess,
}) => {
  const [classId, setClassId] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assignedDate, setAssignedDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [maxScore, setMaxScore] = useState<number>(10);
  const [contentJson, setContentJson] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

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
    }
  }, [assignment, classes, defaultClassId, isOpen]);

  if (!isOpen) return null;

  const classOptions: SelectOption[] = classes.map((c) => ({ value: c.id, label: c.class_name }));

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
        if (!title.trim()) {
          const h1Node = nodes.find((n) => n.type === 'h1');
          setTitle((h1Node && 'text' in h1Node ? h1Node.text : '') || file.name.replace(/\.[^/.]+$/, ''));
        }
        showToast(`Đã nạp file với ${qCount} câu hỏi!`, 'success');
      } else {
        showToast('Vui lòng chọn file định dạng .txt, .uln hoặc .json!', 'warning');
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
    if (!title) setTitle('Unit 12: English-Speaking Countries (Standard Test)');
    showToast(`Đã nạp đề mẫu với ${qCount} câu hỏi!`, 'success');
  };

  const handleTextareaChange = (val: string) => {
    setContentJson(val);
    const nodes = parseUlnContent(val);
    setQuestionCount(nodes.filter((n) => n.type === 'question').length);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !title.trim() || !assignedDate || !dueDate) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc!', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        class_id: classId,
        title: title.trim(),
        description: description.trim(),
        assigned_date: assignedDate,
        due_date: dueDate,
        max_score: maxScore,
        content_json: contentJson.trim(),
      };

      if (assignment) {
        await api.updateAssignment(assignment.id, payload);
        showToast('Cập nhật bài tập thành công!', 'success');
      } else {
        await api.createAssignment(payload);
        showToast('Giao bài tập mới thành công!', 'success');
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
      showToast('Đã xóa bài tập!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('Lỗi khi xóa bài tập: ' + (err?.message || err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 select-none font-sans">
        <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-white">
                  {assignment ? 'Chỉnh Sửa Bài Tập Về Nhà' : 'Giao Bài Tập Về Nhà Mới'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Quản lý nội dung đề thi, hạn nộp và lớp áp dụng</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {/* Class & Max Score */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Lớp Học Áp Dụng <span className="text-rose-400">*</span>
                </label>
                <CustomSelect
                  value={classId}
                  onChange={(val) => setClassId(Number(val))}
                  options={classOptions}
                  placeholder="Chọn lớp học..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Thang Điểm</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value) || 10)}
                  className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Tiêu Đề Bài Tập / Đề Thi <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Phiếu Bài Tập Unit 12: English-Speaking Countries"
                className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
              />
            </div>

            {/* Content ULN / Textarea (Always Open By Default) */}
            <div className="space-y-2 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-300">Nội Dung Đề Bài (ULN Format)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPromptModal(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    <FileText size={12} />
                    <span>Mẫu Prompt AI / OCR</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Nạp Đề Mẫu Toàn Diện</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={7}
                  value={contentJson}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  placeholder="Dán nội dung đề định dạng ULN / Text hoặc JSON vào đây..."
                  className="w-full bg-[#0d1018] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl p-3 font-mono text-xs text-slate-200 resize-y leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer">
                  <Upload size={13} />
                  <span>{uploading ? 'Đang đọc file...' : 'Tải File Đề (.txt, .json, .uln)'}</span>
                  <input type="file" accept=".txt,.json,.uln" onChange={handleFileUpload} className="hidden" />
                </label>

                {questionCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <CheckCircle size={13} />
                    <span>Đã nhận diện {questionCount} câu hỏi!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Ngày Giao <span className="text-rose-400">*</span>
                </label>
                <CustomDatePicker value={assignedDate} onChange={setAssignedDate} placeholder="Chọn ngày giao..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Hạn Nộp <span className="text-rose-400">*</span>
                </label>
                <CustomDatePicker value={dueDate} onChange={setDueDate} placeholder="Chọn hạn nộp..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Mô Tả / Hướng Dẫn</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Học sinh làm trực tiếp trên phiếu đề A4 hoặc in ra giấy..."
                className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs font-medium text-white shadow-inner resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
              {assignment ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>{deleting ? 'Đang xóa...' : 'Xóa'}</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? 'Đang lưu...' : 'Lưu Bài Tập'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <PromptTemplateModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />
    </>
  );
};
