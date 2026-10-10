import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
import { getLocalDateStr } from '../../../utils';
import {
  WeekInfo,
  computeMonthWeeks,
  computeTriggerLabel,
} from './scheduleDatePickerHelper';
import { ScheduleDatePickerDayCell } from './ScheduleDatePickerDayCell';

export type { WeekInfo };

interface ScheduleDatePickerProps {
  selectedMonth: string; // 'YYYY-MM'
  onSelectMonth: (monthStr: string) => void;
  scope: 'all' | 'week';
  onSelectScope: (scope: 'all' | 'week') => void;
  weekStart: Date;
  onSelectWeekStart: (newMonday: Date) => void;
  today: string; // 'YYYY-MM-DD'
  selectedWeekStarts?: string[];
  onSelectWeekStarts?: (starts: string[]) => void;
}

export const ScheduleDatePicker: React.FC<ScheduleDatePickerProps> = ({
  selectedMonth,
  onSelectMonth,
  scope,
  onSelectScope,
  weekStart,
  onSelectWeekStart,
  today,
  selectedWeekStarts,
  onSelectWeekStarts,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [yr, mo] = useMemo(() => {
    const parts = (selectedMonth || getLocalDateStr().slice(0, 7)).split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => new Date(yr, mo, 0).getDate(), [yr, mo]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const weeks = useMemo<WeekInfo[]>(() => {
    return computeMonthWeeks(yr, mo, today);
  }, [yr, mo, today]);

  const currentWeekStartStr = getLocalDateStr(weekStart);
  const activeStarts = useMemo(() => {
    if (selectedWeekStarts && selectedWeekStarts.length > 0) {
      return selectedWeekStarts;
    }
    return [currentWeekStartStr];
  }, [selectedWeekStarts, currentWeekStartStr]);

  const selectedWeeksList = useMemo(() => {
    return weeks.filter((w) => activeStarts.includes(w.startStr)).sort((a, b) => a.index - b.index);
  }, [weeks, activeStarts]);

  const isConsecutiveWeeks = useMemo(() => {
    if (selectedWeeksList.length <= 1) return true;
    return selectedWeeksList.every((w, idx) => idx === 0 || w.index === selectedWeeksList[idx - 1].index + 1);
  }, [selectedWeeksList]);

  const minSelectedStartStr = selectedWeeksList[0]?.startStr || '';
  const maxSelectedEndStr = selectedWeeksList[selectedWeeksList.length - 1]?.endStr || '';

  const changeMonth = (delta: number) => {
    const nextMoDate = new Date(yr, mo - 1 + delta, 1);
    const newMoStr = `${nextMoDate.getFullYear()}-${String(nextMoDate.getMonth() + 1).padStart(2, '0')}`;
    onSelectMonth(newMoStr);
  };

  const handleJumpToday = () => {
    const now = new Date();
    const d = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (d === 0 ? 6 : d - 1));
    const nowMoStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monStr = getLocalDateStr(mon);
    onSelectMonth(nowMoStr);
    onSelectWeekStart(mon);
    onSelectWeekStarts?.([monStr]);
    onSelectScope('week');
    setOpen(false);
  };

  const handleReset = () => {
    const nowMoStr = today.slice(0, 7);
    onSelectMonth(nowMoStr);
    onSelectScope('all');
    if (weeks[0]) onSelectWeekStarts?.([weeks[0].startStr]);
    setOpen(false);
  };

  const handleSelectAll = () => {
    onSelectScope('all');
    setOpen(false);
  };

  const handleToggleWeek = (w: WeekInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (scope !== 'week') {
      updated = [w.startStr];
    } else if (activeStarts.includes(w.startStr)) {
      if (activeStarts.length > 1) {
        updated = activeStarts.filter((s) => s !== w.startStr);
      } else {
        updated = activeStarts;
      }
    } else {
      if (e?.shiftKey && activeStarts.length > 0) {
        const sortedWeeks = [...weeks].sort((a, b) => a.index - b.index);
        const clickedIdx = w.index;
        const currentIndices = weeks
          .filter((wk) => activeStarts.includes(wk.startStr))
          .map((wk) => wk.index);
        const minIdx = Math.min(clickedIdx, ...currentIndices);
        const maxIdx = Math.max(clickedIdx, ...currentIndices);
        updated = sortedWeeks
          .filter((wk) => wk.index >= minIdx && wk.index <= maxIdx)
          .map((wk) => wk.startStr);
      } else {
        updated = [...activeStarts, w.startStr].sort();
      }
    }
    onSelectScope('week');
    onSelectWeekStarts?.(updated);
    const firstWeek = weeks.find((wk) => wk.startStr === updated[0]);
    if (firstWeek) onSelectWeekStart(firstWeek.start);
  };

  const handleDoubleClickWeek = (w: WeekInfo) => {
    onSelectScope('week');
    onSelectWeekStarts?.([w.startStr]);
    onSelectWeekStart(w.start);
    setOpen(false);
  };

  const triggerLabel = useMemo(() => {
    return computeTriggerLabel(scope, mo, yr, selectedWeeksList, isConsecutiveWeeks);
  }, [scope, mo, yr, selectedWeeksList, isConsecutiveWeeks]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer border-0 shadow-2xs outline-none"
        title="Chọn thời gian xem lịch học"
      >
        <Calendar size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="whitespace-nowrap font-extrabold">{triggerLabel}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto top-full mt-2 z-50 bg-white dark:bg-[#151c2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.2)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col sm:flex-row select-none animate-mac-dropdown">
          {/* Left Column: Interactive Month Calendar Grid */}
          <div className="p-3.5 w-72 sm:w-80 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                Tháng {mo} {yr}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer border-0"
                  title="Tháng trước"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer border-0"
                  title="Tháng sau"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-rose-500 dark:text-rose-400">CN</span>
            </div>

            {/* Week rows in Calendar Grid */}
            <div className="space-y-1">
              {weeks.map((w) => {
                const isWeekRowSelected = scope === 'week' && activeStarts.includes(w.startStr);

                return (
                  <div
                    key={w.index}
                    onClick={(e) => handleToggleWeek(w, e)}
                    onDoubleClick={() => handleDoubleClickWeek(w)}
                    className="grid grid-cols-7 relative cursor-pointer group rounded-full transition-colors"
                  >
                    {w.days.map((d, dIdx) => (
                      <ScheduleDatePickerDayCell
                        key={d.dateStr}
                        day={d}
                        dayIndex={dIdx}
                        scope={scope}
                        daysInMonth={daysInMonth}
                        isConsecutiveWeeks={isConsecutiveWeeks}
                        selectedWeeksList={selectedWeeksList}
                        isWeekRowSelected={isWeekRowSelected}
                        minSelectedStartStr={minSelectedStartStr}
                        maxSelectedEndStr={maxSelectedEndStr}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition flex items-center gap-1.5 cursor-pointer border-0 bg-transparent py-1 px-1 rounded-lg"
              >
                <RotateCcw size={11} />
                <span>Đặt lại</span>
              </button>
              <button
                type="button"
                onClick={handleJumpToday}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition cursor-pointer border-0 bg-transparent py-1 px-1 rounded-lg"
              >
                Hôm nay
              </button>
            </div>
          </div>

          {/* Right Column: Preset Tabs Panel (NO CHECKBOXES - Original Clean Style) */}
          <div className="w-full sm:w-48 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 p-2.5 space-y-1 bg-slate-50/70 dark:bg-[#0f1424] shrink-0 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  Khoảng thời gian
                </span>
                {scope === 'week' && activeStarts.length > 1 && (
                  <span className="text-[10px] font-bold text-blue-500">
                    {activeStarts.length} tuần
                  </span>
                )}
              </div>

              {/* Tất cả */}
              <button
                type="button"
                onClick={handleSelectAll}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-between cursor-pointer border-0 ${
                  scope === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10'
                }`}
              >
                <span>Tất cả</span>
                {scope === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
              </button>

              <div className="my-1 border-t border-slate-200 dark:border-white/10" />

              {/* Week items: Original Clean Button Style */}
              {weeks.map((w) => {
                const isSelected = scope === 'week' && activeStarts.includes(w.startStr);

                return (
                  <button
                    key={w.index}
                    type="button"
                    onClick={(e) => handleToggleWeek(w, e)}
                    onDoubleClick={() => handleDoubleClickWeek(w)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex flex-col gap-0.5 cursor-pointer border-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 font-bold'
                    }`}
                    title="Bấm để chọn/bỏ chọn tuần. Nhấp đúp để chọn riêng tuần này và đóng."
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Tuần {w.index}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                        {w.rangeLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Apply Button */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer border-0 shadow-xs"
              >
                Áp dụng {scope === 'week' && activeStarts.length > 1 ? `(${activeStarts.length} tuần)` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
