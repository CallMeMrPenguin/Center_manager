import React, { useState } from 'react';
import { Clock, X, Plus, Trash2 } from 'lucide-react';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { CustomSelect } from '../../../components/CustomSelect';
import { showToast } from '../../../components/Toast';
import { api } from '../../../api';
import { formatSessionDate } from '../utils';

interface TimePhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  selectedClassId: string;
  timePhases: any[];
  onPhasesUpdated: () => Promise<void>;
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
}

export const TimePhaseModal: React.FC<TimePhaseModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  timePhases,
  onPhasesUpdated,
  selectedPhaseId,
  setSelectedPhaseId,
}) => {
  const [phaseNameInput, setPhaseNameInput] = useState('');
  const [phaseFromDate, setPhaseFromDate] = useState('');
  const [phaseToDate, setPhaseToDate] = useState('');
  const [phaseClassId, setPhaseClassId] = useState(selectedClassId || '');
  const [savingPhase, setSavingPhase] = useState(false);

  if (!isOpen) return null;

  const handleSavePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseNameInput.trim()) {
      showToast('Vui lòng nhập tên giai đoạn', 'error');
      return;
    }
    if (!phaseFromDate || !phaseToDate) {
      showToast('Vui lòng chọn ngày bắt đầu và kết thúc', 'error');
      return;
    }
    if (phaseFromDate > phaseToDate) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc', 'error');
      return;
    }

    setSavingPhase(true);
    try {
      await api.saveTimePhase({
        phase_name: phaseNameInput.trim(),
        class_id: phaseClassId ? parseInt(phaseClassId) : null,
        from_date: phaseFromDate,
        to_date: phaseToDate,
      });
      showToast('Đã lưu giai đoạn học tập thành công!', 'success');
      setPhaseNameInput('');
      setPhaseFromDate('');
      setPhaseToDate('');
      onClose();
      await onPhasesUpdated();
    } catch (err: any) {
      showToast('Lỗi lưu giai đoạn: ' + (err.message || err), 'error');
    } finally {
      setSavingPhase(false);
    }
  };

  const handleDeletePhase = async (phaseId: number) => {
    try {
      await api.deleteTimePhase(phaseId);
      showToast('Đã xóa giai đoạn học tập', 'success');
      if (selectedPhaseId === String(phaseId)) setSelectedPhaseId('');
      await onPhasesUpdated();
    } catch (err: any) {
      showToast('Lỗi xóa giai đoạn: ' + (err.message || err), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-mac-dropdown">
      <div className="bg-[#0e1222] border border-[#232d4e] rounded-2xl w-full max-w-lg shadow-2xl overflow-visible relative">
        <div className="px-6 py-4 border-b border-[#1c243f] flex items-center justify-between bg-[#141828] rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Clock className="text-indigo-400" size={18} />
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Quản Lý Giai Đoạn Học Tập Tùy Chỉnh
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSavePhaseSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Tên Giai Đoạn:
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Ôn tập Giữa kỳ 1, Luyện đề Chuyên sâu 9 lên 10..."
              value={phaseNameInput}
              onChange={(e) => setPhaseNameInput(e.target.value)}
              className="w-full bg-[#141a2e] border border-[#232d4e] rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500 transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-30">
            <div className="relative">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                Ngày Bắt Đầu:
              </label>
              <CustomDatePicker
                value={phaseFromDate}
                onChange={(val) => setPhaseFromDate(val)}
                placeholder="YYYY-MM-DD"
                align="left"
              />
            </div>
            <div className="relative">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                Ngày Kết Thúc:
              </label>
              <CustomDatePicker
                value={phaseToDate}
                onChange={(val) => setPhaseToDate(val)}
                placeholder="YYYY-MM-DD"
                align="right"
              />
            </div>
          </div>

          <div className="relative z-20">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Áp Dụng Cho Lớp:
            </label>
            <CustomSelect
              value={phaseClassId}
              onChange={(val) => setPhaseClassId(String(val))}
              options={[
                { value: '', label: 'Tất cả lớp học' },
                ...classes.map(c => ({ value: String(c.id), label: `${c.class_name} (${c.grade || 'Lớp 6'})` }))
              ]}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 relative z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#141a2e] text-slate-300 hover:text-white border border-[#232d4e] text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savingPhase}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{savingPhase ? 'Đang lưu...' : 'Thêm Giai Đoạn'}</span>
            </button>
          </div>
        </form>

        {timePhases.length > 0 && (
          <div className="px-6 pb-6 pt-2 border-t border-[#1c243f]">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Danh Sách Giai Đoạn Đã Tạo ({timePhases.length})
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-thin">
              {timePhases.map(p => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-[#141a2e] border border-[#232d4e] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{p.phase_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatSessionDate(p.from_date)} → {formatSessionDate(p.to_date)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePhase(p.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Xóa giai đoạn này"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
