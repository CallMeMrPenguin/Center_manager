import React from 'react';
import { Calendar as CalendarIcon, X, Palette } from 'lucide-react';
import { CustomDatePicker } from '../../../components/CustomDatePicker';
import { CustomSelect } from '../../../components/CustomSelect';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Button } from '../../../components/button';
import { ClassSession, PALETTE_20, DAYS, DAY_NUM } from '../types';
import { getDeterministicClassColor } from '../../../theme';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: ClassSession | null;
  form: Partial<ClassSession>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ClassSession>>>;
  mode: 'recurring' | 'temporary';
  setMode: (m: 'recurring' | 'temporary') => void;
  color: string;
  setColor: (c: string) => void;
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
  classesList,
  selectedMonth,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-mac-backdrop">
      <div className="bg-white dark:bg-[#0f1320] border-0 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-mac-modal">
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
                setForm((prev) => ({ ...prev, class_id: cid }));
                if (cid) {
                  setColor(getDeterministicClassColor(cid, selectedCls?.color, selectedCls?.notes));
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
            <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 dark:bg-[#141928] p-2.5 rounded-xl border-0 shadow-2xs">
              {PALETTE_20.map((c) => (
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
            <SegmentedControl<'recurring' | 'temporary'>
              value={mode}
              onChange={setMode}
              options={[
                { value: 'recurring', label: 'Lịch Cố Định' },
                { value: 'temporary', label: 'Lịch Tạm Thời' },
              ]}
              fit="fluid"
              size="sm"
            />
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {mode === 'recurring' && !editing ? 'Chọn Ngày (Lấy Thứ Trong Tuần) *' : 'Ngày Học *'}
              </label>
              {mode === 'recurring' && !editing && form.date && (
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg shadow-2xs">
                  {(() => {
                    const [y, m, d] = (form.date || '').split('-').map(Number);
                    const dt = new Date(y, m - 1, d);
                    const dayName = DAYS.find((k) => DAY_NUM[k] === dt.getDay()) || 'Thứ 2';
                    return `${dayName} hàng tuần (Tháng ${selectedMonth})`;
                  })()}
                </span>
              )}
              {mode === 'temporary' && !editing && form.date && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg shadow-2xs">
                  Lịch 1 buổi: {form.date}
                </span>
              )}
            </div>
            <CustomDatePicker value={form.date || ''} onChange={(val) => setForm((prev) => ({ ...prev, date: val }))} />
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
                onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-[#181d2e] border-0 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_1px_3px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.08)] font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Thời Lượng (phút)
              </label>
              <input
                type="number"
                value={form.duration || 90}
                onChange={(e) => setForm((prev) => ({ ...prev, duration: parseInt(e.target.value) || 90 }))}
                className="w-full bg-slate-50 dark:bg-[#181d2e] border-0 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_1px_3px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.08)] font-semibold"
              />
            </div>
          </div>

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
                { value: 'Nghỉ', label: 'Nghỉ' },
                { value: 'Hủy', label: 'Hủy' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            {editing ? (
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={() => onDelete(editing)}
              >
                Xóa Buổi Học
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
              >
                Lưu Buổi Học
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
