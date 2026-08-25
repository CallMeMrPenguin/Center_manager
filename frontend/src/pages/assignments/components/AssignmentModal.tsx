import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, BookOpen } from 'lucide-react';
import { api } from '../../../api';
import { showToast } from '../../../components/Toast';
import { CustomSelect, SelectOption } from '../../../components/CustomSelect';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { Assignment } from '../types';

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
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (assignment) {
      setClassId(assignment.class_id);
      setTitle(assignment.title);
      setDescription(assignment.description || '');
      setAssignedDate(assignment.assigned_date);
      setDueDate(assignment.due_date);
      setMaxScore(assignment.max_score || 10);
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
    }
  }, [assignment, classes, defaultClassId, isOpen]);

  if (!isOpen) return null;

  const classOptions: SelectOption[] = classes.map((c) => ({
    value: c.id,
    label: c.class_name,
  }));

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
      };

      if (assignment) {
        await api.updateAssignment(assignment.id, payload);
        showToast('Đã cập nhật bài tập về nhà thành công!', 'success');
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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${assignment.title}"? Dữ liệu nộp bài của học sinh cũng sẽ bị xóa.`)) {
      return;
    }
    try {
      setDeleting(true);
      await api.deleteAssignment(assignment.id);
      showToast('Đã xóa bài tập về nhà thành công!', 'success');
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
      <div className="bg-[#0c0f1e] border border-[#212c4b] rounded-2xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
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
          {/* Class Select */}
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

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Tiêu Đề Bài Tập <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: BTVN Unit 3 - Grammar Review"
              className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
              required
            />
          </div>

          {/* Dates (Assigned & Due) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Ngày Giao <span className="text-rose-400">*</span>
              </label>
              <CustomDatePicker
                value={assignedDate}
                onChange={setAssignedDate}
                placeholder="Chọn ngày giao..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Hạn Nộp <span className="text-rose-400">*</span>
              </label>
              <CustomDatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Chọn hạn nộp..."
              />
            </div>
          </div>

          {/* Max Score & Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Điểm Tối Đa
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={maxScore}
              onChange={(e) => setMaxScore(parseFloat(e.target.value) || 10)}
              className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Mô Tả / Yêu Cầu Chi Tiết
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Yêu cầu làm các bài trang 45-47, nộp trước buổi học sau..."
              className="w-full bg-[#121626] border border-[#263152] focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs font-medium text-white shadow-inner resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
            {/* Merged Single Pen Action Rule: Delete button inside Edit Modal */}
            {assignment ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{deleting ? 'Đang xóa...' : 'Xóa bài tập'}</span>
              </button>
            ) : (
              <div />
            )}

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
                <span>{saving ? 'Đang lưu...' : 'Lưu bài tập'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
