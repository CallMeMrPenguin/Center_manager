import React, { useState, useMemo } from 'react';
import { Clock, X, Plus, Trash2, Edit3, RotateCcw, Check } from 'lucide-react';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { CustomSelect } from '../../../components/CustomSelect';
import { showToast } from '../../../components/Toast';
import { api } from '../../../api';
import { formatSessionDate, getStandardMoetPhases, savePhaseOverride, resetPhaseOverride, StandardMoetPhase } from '../utils';

interface TimePhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  selectedClassId: string;
  selectedAcademicYear: string;
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
  selectedAcademicYear,
  timePhases,
  onPhasesUpdated,
  selectedPhaseId,
  setSelectedPhaseId,
}) => {
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseNameInput, setPhaseNameInput] = useState('');
  const [phaseFromDate, setPhaseFromDate] = useState('');
  const [phaseToDate, setPhaseToDate] = useState('');
  const [phaseClassId, setPhaseClassId] = useState(selectedClassId || '');
  const [savingPhase, setSavingPhase] = useState(false);

  const moetPhases = useMemo(() => {
    return getStandardMoetPhases(selectedAcademicYear);
  }, [selectedAcademicYear, isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (p: StandardMoetPhase | any) => {
    setEditingPhaseId(String(p.id));
    setPhaseNameInput(p.phase_name);
    setPhaseFromDate(p.from_date);
    setPhaseToDate(p.to_date);
    setPhaseClassId(p.class_id ? String(p.class_id) : '');
  };

  const handleCancelEdit = () => {
    setEditingPhaseId(null);
    setPhaseNameInput('');
    setPhaseFromDate('');
    setPhaseToDate('');
    setPhaseClassId(selectedClassId || '');
  };

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
      if (editingPhaseId && editingPhaseId.startsWith('moet-')) {
        // Save override for standard MOET phase
        savePhaseOverride(selectedAcademicYear, editingPhaseId, {
          phase_name: phaseNameInput.trim(),
          from_date: phaseFromDate,
          to_date: phaseToDate,
        });
        showToast('Đã lưu điều chỉnh thời gian giai đoạn thành công!', 'success');
        handleCancelEdit();
        await onPhasesUpdated();
      } else {
        // Save or update custom time phase via API
        await api.saveTimePhase({
          id: editingPhaseId && !editingPhaseId.startsWith('moet-') ? parseInt(editingPhaseId, 10) : undefined,
          phase_name: phaseNameInput.trim(),
          class_id: phaseClassId ? parseInt(phaseClassId, 10) : null,
          from_date: phaseFromDate,
          to_date: phaseToDate,
        });
        showToast('Đã lưu giai đoạn học tập thành công!', 'success');
        handleCancelEdit();
        await onPhasesUpdated();
      }
    } catch (err: any) {
      showToast('Lỗi lưu giai đoạn: ' + (err.message || err), 'error');
    } finally {
      setSavingPhase(false);
    }
  };

  const handleResetMoetPhase = async (phaseId: string) => {
    resetPhaseOverride(selectedAcademicYear, phaseId);
    showToast('Đã đặt lại thời gian chuẩn Bộ GD&ĐT', 'success');
    if (editingPhaseId === phaseId) handleCancelEdit();
    await onPhasesUpdated();
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
      <div className="bg-[#0e1222] border border-[#232d4e] rounded-2xl w-full max-w-2xl shadow-2xl overflow-visible relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1c243f] flex items-center justify-between bg-[#141828] rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="text-indigo-400" size={18} />
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider">
                Quản Lý & Chỉnh Sửa Giai Đoạn Học Tập
              </h3>
              <span className="text-[11px] text-indigo-300 font-bold block">
                Năm học: {selectedAcademicYear} (01/06 → 31/05)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Edit / Add Form */}
          <form onSubmit={handleSavePhaseSubmit} className="p-4 rounded-xl bg-[#141a2e] border border-[#232d4e] space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                {editingPhaseId ? 'Chỉnh Sửa Thời Gian Giai Đoạn' : 'Thêm Giai Đoạn Tùy Chỉnh Mới'}
              </span>
              {editingPhaseId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-300 cursor-pointer"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                Tên Giai Đoạn:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Ôn tập Giữa kỳ 1, Luyện đề Chuyên sâu 9 lên 10..."
                value={phaseNameInput}
                onChange={(e) => setPhaseNameInput(e.target.value)}
                className="w-full bg-[#0d1222] border border-[#232d4e] rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500 transition"
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

            {!editingPhaseId?.startsWith('moet-') && (
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
            )}

            <div className="pt-2 flex items-center justify-end gap-3 relative z-10">
              {editingPhaseId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl bg-[#0d1222] text-slate-300 hover:text-white border border-[#232d4e] text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
              )}
              <button
                type="submit"
                disabled={savingPhase}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {editingPhaseId ? <Check size={14} /> : <Plus size={14} />}
                <span>{savingPhase ? 'Đang lưu...' : editingPhaseId ? 'Lưu Cập Nhật Ngày' : 'Thêm Giai Đoạn'}</span>
              </button>
            </div>
          </form>

          {/* Standard MOET Phases List */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-indigo-300 flex items-center justify-between">
              <span>Khung Giai Đoạn Chuẩn Bộ GD&ĐT ({moetPhases.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Nhấn biểu tượng cây bút để sửa ngày tháng</span>
            </h4>
            <div className="space-y-2">
              {moetPhases.map(p => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl bg-[#141a2e] border transition flex items-center justify-between gap-3 text-xs ${editingPhaseId === p.id ? 'border-indigo-500 bg-indigo-950/20' : 'border-[#232d4e] hover:border-indigo-500/40'}`}
                >
                  <div className="flex-1">
                    <span className="font-black text-white block">{p.phase_name}</span>
                    <span className="text-[11px] text-indigo-300 font-mono font-bold">
                      {formatSessionDate(p.from_date)} → {formatSessionDate(p.to_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(p)}
                      className="p-1.5 rounded-lg bg-[#0d1222] hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-[#232d4e] transition cursor-pointer"
                      title="Chỉnh sửa ngày tháng giai đoạn này"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetMoetPhase(p.id)}
                      className="p-1.5 rounded-lg bg-[#0d1222] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-[#232d4e] transition cursor-pointer"
                      title="Đặt lại ngày mặc định chuẩn Bộ GD&ĐT"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Time Phases List */}
          {timePhases.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[#1c243f]">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Giai Đoạn Tùy Chỉnh Bổ Sung ({timePhases.length})
              </h4>
              <div className="space-y-2">
                {timePhases.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-[#141a2e] border border-[#232d4e] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{p.phase_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatSessionDate(p.from_date)} → {formatSessionDate(p.to_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 rounded-lg bg-[#0d1222] hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-[#232d4e] transition cursor-pointer"
                        title="Chỉnh sửa giai đoạn này"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhase(p.id)}
                        className="p-1.5 rounded-lg bg-[#0d1222] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#232d4e] transition cursor-pointer"
                        title="Xóa giai đoạn này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
