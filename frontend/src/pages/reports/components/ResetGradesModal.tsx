import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { showToast } from '../../../components/Toast';
import { api } from '../../../api';
import { notifyDataChanged } from '../../../utils';

interface ResetGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClassId: string;
  selectedStudentId: string;
  classes: any[];
  onSuccess: () => void;
}

export const ResetGradesModal: React.FC<ResetGradesModalProps> = ({
  isOpen,
  onClose,
  selectedClassId,
  selectedStudentId,
  classes,
  onSuccess,
}) => {
  const [resetFromDate, setResetFromDate] = useState('');
  const [resetToDate, setResetToDate] = useState('');
  const [resetScope, setResetScope] = useState<'class' | 'student'>('class');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cid = selectedClassId ? parseInt(selectedClassId) : undefined;
      const sid = (resetScope === 'student' && selectedStudentId) ? parseInt(selectedStudentId) : undefined;
      const res = await api.resetGrades({
        class_id: cid,
        student_id: sid,
        from_date: resetFromDate || undefined,
        to_date: resetToDate || undefined,
      });
      showToast(`Đã đặt lại điểm số thành công cho ${res.reset_count} bản ghi!`, "success");
      onClose();
      onSuccess();
      notifyDataChanged();
    } catch (err: any) {
      showToast("Không thể đặt lại điểm: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedClassName = classes.find(c => String(c.id) === selectedClassId)?.class_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-mac-dropdown">
      <div className="bg-[#0f1320] border border-rose-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141828]">
          <h2 className="text-sm font-black uppercase text-rose-400 flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Đặt Lại (Xóa) Điểm Số Học Sinh
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
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
              Phạm Vi Đặt Lại Điểm
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResetScope('class')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${resetScope === 'class'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                  : 'bg-[#181d2e] text-slate-400 border-white/10 hover:text-white'
                  }`}
              >
                Toàn Bộ Lớp {selectedClassId ? `(${selectedClassName})` : ''}
              </button>

              <button
                type="button"
                onClick={() => setResetScope('student')}
                disabled={!selectedStudentId}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${!selectedStudentId ? 'opacity-40 cursor-not-allowed bg-[#181d2e] text-slate-500 border-white/5' :
                  resetScope === 'student'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                    : 'bg-[#181d2e] text-slate-400 border-white/10 hover:text-white'
                  }`}
              >
                Học Sinh Đang Chọn
              </button>
            </div>
            {!selectedStudentId && resetScope === 'student' && (
              <p className="text-[10px] text-amber-400 mt-1">Vui lòng chọn học sinh trong bảng trước để đặt lại điểm cá nhân.</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
              Từ Ngày (From Date)
            </label>
            <CustomDatePicker value={resetFromDate} onChange={setResetFromDate} />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
              Đến Ngày (To Date)
            </label>
            <CustomDatePicker value={resetToDate} onChange={setResetToDate} />
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
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold border border-white/20 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Xác Nhận Đặt Lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
