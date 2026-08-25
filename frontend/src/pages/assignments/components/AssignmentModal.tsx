import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, BookOpen, Upload, FileCode, Sparkles, CheckCircle, Edit3, FileText } from 'lucide-react';
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
  const [showDirectPaste, setShowDirectPaste] = useState<boolean>(false);
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

  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c.id,
    label: c.class_name,
  }));

  // Handle file upload (.txt / .json / .uln / .docx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (file.name.endsWith('.txt') || file.name.endsWith('.uln')) {
        const text = await file.text();
        setContentJson(text);
        const nodes = parseUlnContent(text);
        const qCount = nodes.filter((n) => n.type === 'question').length;
        setQuestionCount(qCount);
        if (!title.trim()) {
          const h1Node = nodes.find((n) => n.type === 'h1');
          const h1Text = h1Node && 'text' in h1Node ? h1Node.text : '';
          setTitle(h1Text || file.name.replace(/\.[^/.]+$/, ''));
        }
        showToast(`Đã nạp file TXT/ULN với ${qCount} câu hỏi!`, 'success');
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        setContentJson(text);
        const nodes = parseUlnContent(text);
        const qCount = nodes.filter((n) => n.type === 'question').length;
        setQuestionCount(qCount);
        if (!title.trim()) {
          setTitle(file.name.replace('.json', ''));
        }
        showToast(`Đã nạp file JSON với ${qCount} câu hỏi!`, 'success');
      } else {
        const res = await api.parseQuizFile(file);
        if (res && res.questions && res.questions.length > 0) {
          setContentJson(JSON.stringify(res.questions));
          setQuestionCount(res.questions.length);
          if (!title.trim()) {
            setTitle(res.title || file.name.replace(/\.[^/.]+$/, ''));
          }
          showToast(`Đã nhận diện ${res.questions.length} câu hỏi!`, 'success');
        } else {
          showToast('Không nhận diện được câu hỏi trong file', 'error');
        }
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      showToast('Lỗi đọc file đề: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleTextareaChange = (text: string) => {
    setContentJson(text);
    const nodes = parseUlnContent(text);
    const qCount = nodes.filter((n) => n.type === 'question').length;
    setQuestionCount(qCount);
    if (!title.trim()) {
      const firstH1Node = nodes.find((n) => n.type === 'h1');
      const firstH1 = firstH1Node && 'text' in firstH1Node ? firstH1Node.text : '';
      if (firstH1) setTitle(firstH1);
    }
  };

  const handleLoadSample = () => {
    setContentJson(SAMPLE_UNIT12_ULN_TEXT);
    const nodes = parseUlnContent(SAMPLE_UNIT12_ULN_TEXT);
    const qCount = nodes.filter((n) => n.type === 'question').length;
    setQuestionCount(qCount);
    if (!title.trim()) {
      setTitle('UNIT 12: ENGLISH-SPEAKING COUNTRIES (ĐỀ ÔN TẬP TOÀN DIỆN)');
    }
    showToast(`Đã nạp đề mẫu Unit 12 với ${qCount} câu hỏi chuẩn ULN!`, 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) {
      showToast('Vui lòng chọn lớp học', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề bài tập', 'error');
      return;
    }
    if (!assignedDate || !dueDate) {
      showToast('Vui lòng chọn ngày giao và hạn nộp', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        class_id: classId,
        title: title.trim(),
        description: description.trim(),
        assigned_date: assignedDate,
        due_date: dueDate,
        max_score: Number(maxScore) || 10,
        content_json: contentJson.trim() || SAMPLE_UNIT12_ULN_TEXT,
        quiz_config: '',
      };

      if (assignment) {
        await api.updateAssignment(assignment.id, payload);
        showToast('Đã cập nhật bài tập thành công!', 'success');
      } else {
        await api.createAssignment(payload);
        showToast('Đã giao bài tập về nhà mới thành công!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save assignment:', err);
      showToast('Lỗi khi lưu bài tập: ' + err, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;
    if (!window.confirm(`Bạn có chắc muốn xóa bài tập "${assignment.title}"?`)) return;
    try {
      setDeleting(true);
      await api.deleteAssignment(assignment.id);
      showToast('Đã xóa bài tập thành công!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      showToast('Lỗi khi xóa bài tập: ' + err, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 select-none animate-fade-in">
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-2xl w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {assignment ? 'Chỉnh Sửa Bài Tập' : 'Giao Bài Tập Về Nhà Mới'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Lớp Học <span className="text-rose-400">*</span>
            </label>
            <CustomSelect
              value={classId}
              onChange={(val) => setClassId(Number(val))}
              options={classOptions}
              placeholder="Chọn lớp học..."
              disabled={!!assignment}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Tiêu Đề Bài Tập <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: UNIT 12 - English-Speaking Countries"
              className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
              required
            />
          </div>

          {/* File Upload / Paste ULN Text */}
          <div className="bg-[#121626] border border-[#263152] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileCode size={14} className="text-indigo-400" />
                <span>Nội Dung Đề Thi (.txt / .json / .uln / .docx)</span>
              </label>
              <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer">
                <Upload size={13} />
                <span>{uploading ? 'Đang đọc file...' : 'Tải File Đề (.txt, .json, .uln, .docx)'}</span>
                <input
                  type="file"
                  accept=".txt,.json,.uln,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowDirectPaste(!showDirectPaste)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 size={13} />
                <span>{showDirectPaste ? 'Thu Gọn' : 'Dán Đề (Paste)'}</span>
              </button>
            </div>

            {showDirectPaste && (
              <div className="space-y-1 pt-1">
                <textarea
                  rows={5}
                  value={contentJson}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  placeholder="Dán nội dung định dạng ULN / Text hoặc JSON vào đây..."
                  className="w-full bg-[#0d1018] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl p-3 font-mono text-xs text-slate-200 resize-y"
                />
              </div>
            )}

            {questionCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle size={13} />
                <span>Đã nhận diện {questionCount} câu hỏi và các phần thi liên quan!</span>
              </div>
            )}
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
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer">
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5c36f5] hover:bg-[#6c48f7] text-white text-xs font-black shadow-[0_0_15px_rgba(92,54,245,0.4)] transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'Đang lưu...' : 'Lưu bài tập'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <PromptTemplateModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
      />
    </div>
  );
};
