import React, { useState, useMemo } from 'react';
import { Clock, X, Plus, Trash2, Edit3, Check } from 'lucide-react';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { CustomSelect } from '../../../components/CustomSelect';
import { showToast } from '../../../components/Toast';
import { api } from '../../../api';
import { formatSessionDate, getStandardMoetPhases, StandardMoetPhase } from '../utils';

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
  const [editingDbId, setEditingDbId] = useState<number | null>(null);
  const [phaseNameInput, setPhaseNameInput] = useState('');
  const [phaseFromDate, setPhaseFromDate] = useState('');
  const [phaseToDate, setPhaseToDate] = useState('');
  const [phaseClassId, setPhaseClassId] = useState(selectedClassId || '');
  const [savingPhase, setSavingPhase] = useState(false);

  // Merge standard MOET phases with database phases
  const mergedPhases = useMemo(() => {
    const defaultMoet = getStandardMoetPhases(selectedAcademicYear);
    const dbList = timePhases || [];

    return defaultMoet.map(m => {
      const dbMatch = dbList.find(p => p.phase_name === m.phase_name);
      if (dbMatch) {
        return {
          ...m,
          db_id: dbMatch.id,
          from_date: dbMatch.from_date || m.from_date,
          to_date: dbMatch.to_date || m.to_date,
        };
      }
      return m;
    });
  }, [selectedAcademicYear, timePhases, isOpen]);

  // Additional custom phases not in standard list
  const customOnlyPhases = useMemo(() => {
    const defaultMoet = getStandardMoetPhases(selectedAcademicYear);
    const dbList = timePhases || [];
    return dbList.filter(dbp => !defaultMoet.some(m => m.phase_name === dbp.phase_name));
  }, [selectedAcademicYear, timePhases, isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (p: StandardMoetPhase & { db_id?: number; class_id?: any }) => {
    setEditingPhaseId(String(p.id));
    setEditingDbId(p.db_id || (typeof p.id === 'number' ? p.id : null));
    setPhaseNameInput(p.phase_name);
    setPhaseFromDate(p.from_date);
    setPhaseToDate(p.to_date);
    setPhaseClassId(p.class_id ? String(p.class_id) : '');
  };

  const handleCancelEdit = () => {
    setEditingPhaseId(null);
    setEditingDbId(null);
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
      // Find if this phase name already exists in database
      let targetDbId = editingDbId;
      if (!targetDbId) {
        const found = (timePhases || []).find(p => p.phase_name === phaseNameInput.trim());
        if (found) targetDbId = found.id;
      }

      // Save directly to SQLite Database via API
      await api.saveTimePhase({
        id: targetDbId || undefined,
        phase_name: phaseNameInput.trim(),
        class_id: phaseClassId ? parseInt(phaseClassId, 10) : null,
        from_date: phaseFromDate,
        to_date: phaseToDate,
      });

      showToast('Đã lưu dữ liệu giai đoạn vào Database thành công!', 'success');
      handleCancelEdit();
      await onPhasesUpdated();
    } catch (err: any) {
      showToast('Lỗi lưu giai đoạn vào Database: ' + (err.message || err), 'error');
    } finally {
      setSavingPhase(false);
    }
  };

  const handleDeletePhase = async (phaseId: number) => {
    try {
      await api.deleteTimePhase(phaseId);
      showToast('Đã xóa giai đoạn trong Database', 'success');
      if (selectedPhaseId === String(phaseId)) setSelectedPhaseId('');
      await onPhasesUpdated();
    } catch (err: any) {
      showToast('Lỗi xóa giai đoạn: ' + (err.message || err), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-mac-dropdown">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-visible relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="text-blue-600" size={18} />
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                Quản Lý & Chỉnh Sửa Giai Đoạn (Database SQLite)
              </h3>
              <span className="text-[11px] text-blue-600 font-bold block">
                Năm học: {selectedAcademicYear} (01/06 → 31/05)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Edit / Add Form */}
          <form onSubmit={handleSavePhaseSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                {editingPhaseId ? 'Chỉnh Sửa Giai Đoạn (Lưu Database)' : 'Thêm Giai Đoạn Tùy Chỉnh (Lưu Database)'}
              </span>
              {editingPhaseId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[10px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Tên Giai Đoạn:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Học Kỳ I, Ôn tập Giữa kỳ 1, Luyện đề Chuyên sâu..."
                value={phaseNameInput}
                onChange={(e) => setPhaseNameInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-30">
              <div className="relative">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
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
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
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
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
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
              {editingPhaseId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
              )}
              <button
                type="submit"
                disabled={savingPhase}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {editingPhaseId ? <Check size={14} /> : <Plus size={14} />}
                <span>{savingPhase ? 'Đang lưu DB...' : editingPhaseId ? 'Lưu Vào Database' : 'Thêm Vào Database'}</span>
              </button>
            </div>
          </form>

          {/* Standard MOET Phases List */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Giai Đoạn Chuẩn Bộ GD&ĐT ({mergedPhases.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Bấm ✏️ để sửa tên & ngày lưu vào DB</span>
            </h4>
            <div className="space-y-2">
              {mergedPhases.map(p => (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl bg-white border transition flex items-center justify-between gap-3 text-xs ${editingPhaseId === String(p.id) ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-400'}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{p.phase_name}</span>
                      {p.db_id && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                          Đã lưu DB
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-blue-600 font-mono font-bold block mt-0.5">
                      {formatSessionDate(p.from_date)} → {formatSessionDate(p.to_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(p)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Chỉnh sửa tên và ngày tháng"
                    >
                      <Edit3 size={13} />
                      <span>Sửa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Time Phases List */}
          {customOnlyPhases.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Giai Đoạn Tùy Chỉnh Khác ({customOnlyPhases.length})
              </h4>
              <div className="space-y-2">
                {customOnlyPhases.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{p.phase_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatSessionDate(p.from_date)} → {formatSessionDate(p.to_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                        title="Chỉnh sửa giai đoạn này"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhase(p.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
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
