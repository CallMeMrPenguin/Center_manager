import React from 'react';
import { Calendar as CalendarIcon, X, Palette } from 'lucide-react';
import { CustomSelect } from '../../../components/CustomSelect';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Button } from '../../../components/button';
import { ClassSession, PALETTE_20, SessionScheduleItem } from '../types';
import { getDeterministicClassColor } from '../../../theme';
import { InlineCalendarGrid } from './InlineCalendarGrid';
import { SelectedDaysTimeList } from './SelectedDaysTimeList';
import { useSessionModalState } from './useSessionModalState';

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
  onSave: (e: React.FormEvent, items: SessionScheduleItem[]) => void;
  onDelete: (sess: ClassSession) => void;
  sessions?: ClassSession[];
  setEditing?: React.Dispatch<React.SetStateAction<ClassSession | null>>;
}

function formatSessionDateTitle(dateStr?: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return `${dayNames[dt.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
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
  sessions,
  setEditing,
}) => {
  const {
    calYear,
    calMonth,
    selectedItems,
    selectedDatesList,
    selectedDaysOfWeekList,
    handlePrevMonth,
    handleNextMonth,
    handleModeChange,
    handleToggleDate,
    handleToggleDayOfWeek,
    handleChangeTime,
    handleRemoveItem,
    handleSyncAllTimes,
  } = useSessionModalState({
    isOpen,
    editing,
    form,
    setForm,
    mode,
    setMode,
    selectedMonth,
    sessions,
    setEditing,
    setColor,
  });

  const highlightDates = React.useMemo(() => {
    if (!form.class_id || !sessions) return [];
    return sessions.filter((s) => s.class_id === form.class_id).map((s) => s.date);
  }, [sessions, form.class_id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 animate-mac-backdrop">
      <div className="bg-white dark:bg-[#0f1320] border-0 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-mac-modal flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#14192b] shrink-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            {editing
              ? `Cập Nhật Buổi Học ${formatSessionDateTitle(form.date || editing.date)}`
              : 'Thêm Buổi Học Mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition border-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={(e) => onSave(e, selectedItems)} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* CLASS AND STATUS SELECTOR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Lớp
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
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Trạng Thái
              </label>
              <CustomSelect
                value={form.status === 'Hủy' ? 'Nghỉ' : (form.status || 'Sắp diễn ra')}
                onChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
                options={[
                  { value: 'Sắp diễn ra', label: 'Sắp diễn ra' },
                  { value: 'Đã học', label: 'Đã học' },
                  { value: 'Nghỉ', label: 'Nghỉ' },
                ]}
              />
            </div>
          </div>

          {/* COLOR PALETTE */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Palette size={10} className="text-blue-500 dark:text-blue-400" />
              Màu Sắc Lịch Trình
            </label>
            <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 dark:bg-[#141928] p-2 rounded-xl border-0 shadow-2xs">
              {PALETTE_20.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-6 w-6 rounded-lg transition-all cursor-pointer border ${
                    color === c ? 'border-blue-500 dark:border-white scale-110 ring-2 ring-blue-400' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                />
              ))}
              <label className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 flex items-center justify-center cursor-pointer border border-white/30 hover:scale-105 transition relative overflow-hidden">
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

          {/* RECURRING / TEMPORARY MODE TOGGLE */}
          {!editing && (
            <SegmentedControl<'recurring' | 'temporary'>
              value={mode}
              onChange={handleModeChange}
              options={[
                { value: 'recurring', label: 'Lịch Cố Định' },
                { value: 'temporary', label: 'Lịch Tạm Thời' },
              ]}
              fit="fluid"
              size="sm"
            />
          )}

          {/* ALWAYS-VISIBLE INLINE CALENDAR */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Lịch Tháng *
            </label>
            <InlineCalendarGrid
              year={calYear}
              month={calMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              mode={mode}
              selectedDates={selectedDatesList}
              selectedDaysOfWeek={selectedDaysOfWeekList}
              highlightDates={highlightDates}
              highlightColor={color}
              onToggleDate={handleToggleDate}
              onToggleDayOfWeek={handleToggleDayOfWeek}
              isSingleSelect={!!editing}
            />
          </div>

          {/* ADJUST TIME FOR EACH SELECTED DAY */}
          <SelectedDaysTimeList
            items={selectedItems}
            onChangeTime={handleChangeTime}
            onRemoveItem={handleRemoveItem}
            onSyncAllTimes={handleSyncAllTimes}
          />



          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-white/10 shrink-0">
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
                {editing ? 'Lưu Buổi Học' : `Lưu (${selectedItems.length}) Buổi Học`}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
