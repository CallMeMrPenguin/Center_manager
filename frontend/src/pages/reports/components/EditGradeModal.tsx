import React, { useState, useEffect } from 'react';
import { Edit3, Save } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { showToast } from '../../../components/Toast';
import { api } from '../../../api';
import { notifyDataChanged } from '../../../utils';
import { formatFullDate } from '../utils';

interface EditGradeModalProps {
  record: any | null;
  onClose: () => void;
  onSuccess: () => void;
  isTestMode?: boolean;
  onSaveTestRecord?: (updatedRecord: any) => void;
}

export const EditGradeModal: React.FC<EditGradeModalProps> = ({
  record,
  onClose,
  onSuccess,
  isTestMode,
  onSaveTestRecord,
}) => {
  const [editStatus, setEditStatus] = useState<string>('Có mặt');
  const [editCheck1, setEditCheck1] = useState<string>('');
  const [editCheck2, setEditCheck2] = useState<string>('');
  const [editHomework, setEditHomework] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setEditStatus(record.status || (record.attendance === 'absent' ? 'Vắng' : 'Có mặt'));
      setEditCheck1(record.check_1 !== null && record.check_1 !== undefined && Number(record.check_1) > 0 ? String(record.check_1) : '');
      setEditCheck2(record.check_2 !== null && record.check_2 !== undefined && Number(record.check_2) > 0 ? String(record.check_2) : '');
      setEditHomework(record.homework !== null && record.homework !== undefined && Number(record.homework) > 0 ? String(record.homework) : '');
      setEditNotes(record.notes || '');
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const c1 = editCheck1.trim() !== '' ? Math.max(0, Math.min(10, parseFloat(editCheck1.replace(',', '.')) || 0)) : null;
      const c2 = editCheck2.trim() !== '' ? Math.max(0, Math.min(10, parseFloat(editCheck2.replace(',', '.')) || 0)) : null;
      const hw = editHomework.trim() !== '' ? Math.max(0, Math.min(10, parseFloat(editHomework.replace(',', '.')) || 0)) : null;

      if (isTestMode) {
        const updated = {
          ...record,
          attendance: editStatus.includes('Vắng') ? 'absent' : 'present',
          status: editStatus,
          check_1: c1,
          check_2: c2,
          homework: hw,
          notes: editNotes,
        };
        if (onSaveTestRecord) {
          onSaveTestRecord(updated);
        }
        showToast(`Đã cập nhật điểm số test cho ${record.full_name || record.student_name || 'học sinh'}!`, "success");
        onClose();
        onSuccess();
        return;
      }

      await api.saveClassAttendance(record.class_id, record.date, [{
        student_id: record.student_id,
        status: editStatus,
        check_1: c1 ?? 0,
        check_2: c2 ?? 0,
        homework: hw ?? 0,
        notes: editNotes,
      }]);

      showToast(`Đã cập nhật điểm số cho ${record.student_name || record.full_name || 'học sinh'}!`, "success");
      onClose();
      onSuccess();
      notifyDataChanged();
    } catch (err: any) {
      showToast("Lỗi khi cập nhật điểm: " + (err.message || err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
      <div className="bg-[#0f1320] border border-indigo-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141828]">
          <h2 className="text-sm font-black uppercase text-indigo-300 flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Sửa Điểm Số Buổi Học
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
              Học Sinh
            </label>
            <input
              type="text"
              disabled
              value={record.student_name || 'Học sinh'}
              className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-300 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                Ngày Học
              </label>
              <input
                type="text"
                disabled
                value={formatFullDate(record.date)}
                className="w-full bg-[#181d2e] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-indigo-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
                Điểm Danh
              </label>
              <CustomSelect
                value={editStatus}
                onChange={(val) => setEditStatus(String(val))}
                options={[
                  { value: 'Có mặt', label: 'Có mặt' },
                  { value: 'Vắng mặt', label: 'Vắng mặt' },
                  { value: 'Nghỉ học có phép', label: 'Có phép' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-blue-400 uppercase tracking-wider mb-1">
                Check 1
              </label>
              <input
                type="text"
                placeholder="0.0"
                value={editCheck1}
                onChange={(e) => setEditCheck1(e.target.value)}
                className="w-full bg-[#161c30] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-purple-400 uppercase tracking-wider mb-1">
                Check 2
              </label>
              <input
                type="text"
                placeholder="0.0"
                value={editCheck2}
                onChange={(e) => setEditCheck2(e.target.value)}
                className="w-full bg-[#161c30] border border-purple-500/30 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1">
                Homework
              </label>
              <input
                type="text"
                placeholder="0.0"
                value={editHomework}
                onChange={(e) => setEditHomework(e.target.value)}
                className="w-full bg-[#161c30] border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">
              Ghi Chú (Notes)
            </label>
            <input
              type="text"
              placeholder="Nhập ghi chú cho buổi học..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-[#161c30] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#181d2e] hover:bg-[#252c42] text-slate-300 text-xs font-bold border border-white/10 transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold border border-white/20 transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={13} />
              <span>{saving ? 'Đang lưu...' : 'Lưu Điểm Số'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
