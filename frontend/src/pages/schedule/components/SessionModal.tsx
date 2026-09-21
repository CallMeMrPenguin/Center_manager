import React from 'react';
import { Calendar as CalendarIcon, X, Palette } from 'lucide-react';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { CustomSelect } from '../../../components/CustomSelect';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { ClassSession, DayCfg, PALETTE_20, DAYS } from '../types';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: ClassSession | null;
  form: Partial<ClassSession>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ClassSession>>>;
  mode: 'single' | 'weekdays';
  setMode: (m: 'single' | 'weekdays') => void;
  color: string;
  setColor: (c: string) => void;
  dayCfgs: Record<string, DayCfg>;
  setDayCfgs: React.Dispatch<React.SetStateAction<Record<string, DayCfg>>>;
  classesList: any[];
  selectedMonth: string;
  onSave: (e: React.FormEvent) => void;
  onDelete: (sess: ClassSession) => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  editing,
  form,
  setForm,
  mode,
  setMode,
  color,
  setColor,
  dayCfgs,
  setDayCfgs,
  classesList,
  selectedMonth,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-backdrop">
      <div className="bg-white dark:bg-[#0f1320] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-mac-modal">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#14192b]">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            {editing ? 'Cập Nhật Buổi Học' : 'Thêm Buổi Học Mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={onSave} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Lớp Học *
            </label>
            <CustomSelect
              value={form.class_id || ''}
              onChange={(val) => {
                const cid = Number(val);
                const selectedCls = classesList.find((c) => c.id === cid);
                setForm({ ...form, class_id: cid });
                if (selectedCls?.color) {
                  setColor(selectedCls.color);
                }
              }}
              options={[
                { value: '', label: '-- Chọn Lớp --' },
                ...classesList.map((c) => ({ value: c.id, label: c.class_name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Palette size={10} className="text-blue-500 dark:text-blue-400" />
              Màu Sắc Lịch Trình
            </label>
            <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 dark:bg-[#141928] p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
              {PALETTE_20.slice(0, 10).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-xl transition-all cursor-pointer border ${
                    color === c ? 'border-blue-500 dark:border-white scale-110 ring-2 ring-blue-400' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                />
              ))}
              <label className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 flex items-center justify-center cursor-pointer border border-white/30 hover:scale-105 transition relative overflow-hidden">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <Palette size={10} className="text-white" />
              </label>
            </div>
          </div>

          {!editing && (
            <SegmentedControl<'weekdays' | 'single'>
              value={mode}
              onChange={setMode}
              options={[
                { value: 'weekdays', label: 'Chọn Ngày Trong Tuần' },
                { value: 'single', label: '1 Ngày Cụ Thể' },
              ]}
              fit="fluid"
              size="sm"
            />
          )}

          {!editing && mode === 'weekdays' && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Cấu Hình Theo Thứ — Tháng {selectedMonth}
              </label>
              <div className="space-y-2 bg-slate-50 dark:bg-[#141928] p-3 rounded-xl border border-slate-200 dark:border-white/10">
                {DAYS.map((day) => {
                  const cfg = dayCfgs[day];
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setDayCfgs((p) => ({
                            ...p,
                            [day]: { ...p[day], checked: !p[day].checked },
                          }))
                        }
                        className={`shrink-0 h-5 w-5 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition cursor-pointer ${
                          cfg.checked ? 'bg-blue-600 border-blue-400 text-white' : 'bg-transparent border-slate-300 dark:border-white/20 text-transparent'
                        }`}
                      >
                        ✓
                      </button>
                      <span className={`text-xs font-bold w-16 shrink-0 ${cfg.checked ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        {day}
                      </span>
                      <input
                        type="time"
                        value={cfg.time}
                        disabled={!cfg.checked}
                        onChange={(e) =>
                          setDayCfgs((p) => ({
                            ...p,
                            [day]: { ...p[day], time: e.target.value },
                          }))
                        }
                        className={`flex-1 bg-white dark:bg-[#0d1018] border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 ${
                          !cfg.checked ? 'opacity-30' : ''
                        }`}
                      />
                      <input
                        type="number"
                        value={cfg.duration}
                        min={30}
                        max={240}
                        step={15}
                        disabled={!cfg.checked}
                        onChange={(e) =>
                          setDayCfgs((p) => ({
                            ...p,
                            [day]: { ...p[day], duration: parseInt(e.target.value) || 90 },
                          }))
                        }
                        className={`w-14 bg-white dark:bg-[#0d1018] border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 ${
                          !cfg.checked ? 'opacity-30' : ''
                        }`}
                      />
                      <span className={`text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ${!cfg.checked ? 'opacity-30' : ''}`}>p</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(editing || mode === 'single') && (
            <>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Ngày Học *
                </label>
                <CustomDatePicker value={form.date || ''} onChange={(val) => setForm({ ...form, date: val })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Giờ Bắt Đầu *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.start_time || '18:00'}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full bg-white dark:bg-[#181d2e] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Thời Lượng (phút)
                  </label>
                  <input
                    type="number"
                    value={form.duration || 90}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 90 })}
                    className="w-full bg-white dark:bg-[#181d2e] border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Trạng Thái
            </label>
            <CustomSelect
              value={form.status || 'Sắp diễn ra'}
              onChange={(val) => setForm({ ...form, status: val })}
              options={[
                { value: 'Sắp diễn ra', label: 'Sắp diễn ra' },
                { value: 'Đã học', label: 'Đã học' },
                { value: 'Hủy', label: 'Hủy' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            {editing ? (
              <button
                type="button"
                onClick={() => onDelete(editing)}
                className="px-4 py-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-500/25 border border-rose-500/30 transition cursor-pointer"
              >
                Xóa Buổi Học
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold border border-blue-400/30 hover:bg-blue-500 transition shadow-lg cursor-pointer"
              >
                Lưu Buổi Học
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
