import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getLocalDateStr } from '../../../utils';
import {
  WeekInfo,
  computeMonthWeeks,
  computeTriggerLabel,
  computeSegmentsFromWeeks,
  findWeeksIntersectingRange,
  getAdjacentMonth,
  DateRangeSegment,
} from './scheduleDatePickerHelper';
import { ScheduleDatePickerMonth } from './ScheduleDatePickerMonth';
import { ScheduleDatePickerPresets } from './ScheduleDatePickerPresets';

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

  // Range picking & hover indicator states
  const [pickingStart, setPickingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [activeHoverDay, setActiveHoverDay] = useState<string | null>(null);
  const [customRange, setCustomRange] = useState<{ startStr: string; endStr: string } | null>(null);

  // Month 1 (Primary / Current Month)
  const [yr, mo] = useMemo(() => {
    const parts = (selectedMonth || getLocalDateStr().slice(0, 7)).split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [selectedMonth]);

  // Month 2 (Always simultaneous adjacent next month)
  const { yr: yr2, mo: mo2 } = useMemo(() => {
    return getAdjacentMonth(yr, mo, 1);
  }, [yr, mo]);

  const daysInMonth1 = useMemo(() => new Date(yr, mo, 0).getDate(), [yr, mo]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPickingStart(null);
        setHoverDate(null);
        setActiveHoverDay(null);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Compute weeks for both months simultaneously
  const weeks1 = useMemo<WeekInfo[]>(() => computeMonthWeeks(yr, mo, today), [yr, mo, today]);
  const weeks2 = useMemo<WeekInfo[]>(() => computeMonthWeeks(yr2, mo2, today), [yr2, mo2, today]);
  const allWeeks = useMemo<WeekInfo[]>(() => [...weeks1, ...weeks2], [weeks1, weeks2]);

  const currentWeekStartStr = getLocalDateStr(weekStart);
  const activeStarts = useMemo(() => {
    if (selectedWeekStarts && selectedWeekStarts.length > 0) {
      return selectedWeekStarts;
    }
    return [currentWeekStartStr];
  }, [selectedWeekStarts, currentWeekStartStr]);

  const selectedWeeksList = useMemo(() => {
    return allWeeks.filter((w) => activeStarts.includes(w.startStr)).sort((a, b) => a.startStr.localeCompare(b.startStr));
  }, [allWeeks, activeStarts]);

  const isConsecutiveWeeks = useMemo(() => {
    if (selectedWeeksList.length <= 1) return true;
    return selectedWeeksList.every((w, idx) => {
      if (idx === 0) return true;
      const prevEnd = new Date(selectedWeeksList[idx - 1].endStr);
      prevEnd.setDate(prevEnd.getDate() + 1);
      return w.startStr === getLocalDateStr(prevEnd);
    });
  }, [selectedWeeksList]);

  // Contiguous island segments for range highlight
  const segments = useMemo<DateRangeSegment[]>(() => {
    // 1. Live picking in progress (dragging mouse over days)
    if (pickingStart && hoverDate) {
      const sMin = pickingStart <= hoverDate ? pickingStart : hoverDate;
      const sMax = pickingStart <= hoverDate ? hoverDate : pickingStart;
      return [{ startStr: sMin, endStr: sMax }];
    }

    // 2. Custom picked range
    if (customRange) {
      return [{ startStr: customRange.startStr, endStr: customRange.endStr }];
    }

    // 3. Whole month (Tất cả): chỉ highlight toàn bộ tháng hiện tại (Tháng 1)
    if (scope === 'all') {
      const firstDay1 = `${yr}-${String(mo).padStart(2, '0')}-01`;
      const lastDay1 = `${yr}-${String(mo).padStart(2, '0')}-${String(daysInMonth1).padStart(2, '0')}`;
      return [{ startStr: firstDay1, endStr: lastDay1 }];
    }

    // 4. Week mode: partition selected weeks into contiguous segments
    return computeSegmentsFromWeeks(selectedWeeksList);
  }, [pickingStart, hoverDate, customRange, scope, yr, mo, daysInMonth1, selectedWeeksList]);

  const handleDayClick = (dateStr: string) => {
    if (!pickingStart) {
      setPickingStart(dateStr);
      setHoverDate(dateStr);
      setCustomRange(null);
    } else {
      const minStr = pickingStart <= dateStr ? pickingStart : dateStr;
      const maxStr = pickingStart <= dateStr ? dateStr : pickingStart;

      const coveringWeekStarts = findWeeksIntersectingRange(allWeeks, minStr, maxStr);
      if (coveringWeekStarts.length > 0) {
        onSelectScope('week');
        onSelectWeekStarts?.(coveringWeekStarts);
        const firstWeek = allWeeks.find((w) => w.startStr === coveringWeekStarts[0]);
        if (firstWeek) onSelectWeekStart(firstWeek.start);
      }

      setCustomRange({ startStr: minStr, endStr: maxStr });
      setPickingStart(null);
      setHoverDate(null);
    }
  };

  const handleDayHover = (dateStr: string) => {
    setActiveHoverDay(dateStr);
    if (pickingStart) {
      setHoverDate(dateStr);
    }
  };

  const changeMonth = (delta: number) => {
    setPickingStart(null);
    setHoverDate(null);
    setActiveHoverDay(null);
    setCustomRange(null);
    const nextMo = getAdjacentMonth(yr, mo, delta);
    onSelectMonth(nextMo.monthStr);
  };

  const handleJumpToday = () => {
    setPickingStart(null);
    setHoverDate(null);
    setActiveHoverDay(null);
    setCustomRange(null);
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
    setPickingStart(null);
    setHoverDate(null);
    setActiveHoverDay(null);
    setCustomRange(null);
    const nowMoStr = today.slice(0, 7);
    onSelectMonth(nowMoStr);
    onSelectScope('all');
    if (weeks1[0]) onSelectWeekStarts?.([weeks1[0].startStr]);
    setOpen(false);
  };

  const handleSelectAll = () => {
    setPickingStart(null);
    setHoverDate(null);
    setActiveHoverDay(null);
    setCustomRange(null);
    onSelectScope('all');
  };

  const handleToggleWeek = (w: WeekInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPickingStart(null);
    setHoverDate(null);
    setActiveHoverDay(null);
    setCustomRange(null);
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
        const sortedWeeks = [...allWeeks].sort((a, b) => a.startStr.localeCompare(b.startStr));
        const clickedIdx = sortedWeeks.findIndex((wk) => wk.startStr === w.startStr);
        const currentIndices = activeStarts.map((st) => sortedWeeks.findIndex((wk) => wk.startStr === st)).filter((idx) => idx !== -1);
        const minIdx = Math.min(clickedIdx, ...currentIndices);
        const maxIdx = Math.max(clickedIdx, ...currentIndices);
        updated = sortedWeeks.slice(minIdx, maxIdx + 1).map((wk) => wk.startStr);
      } else {
        updated = [...activeStarts, w.startStr].sort();
      }
    }

    onSelectScope('week');
    onSelectWeekStarts?.(updated);
    const firstWeek = allWeeks.find((wk) => wk.startStr === updated[0]);
    if (firstWeek) onSelectWeekStart(firstWeek.start);
  };

  const handleDoubleClickWeek = (w: WeekInfo) => {
    setPickingStart(null);
    setHoverDate(null);
    setActiveHoverDay(null);
    setCustomRange(null);
    onSelectScope('week');
    onSelectWeekStarts?.([w.startStr]);
    onSelectWeekStart(w.start);
    setOpen(false);
  };

  const triggerLabel = useMemo(() => {
    return computeTriggerLabel(scope, mo, yr, selectedWeeksList, isConsecutiveWeeks, customRange);
  }, [mo, yr, scope, selectedWeeksList, isConsecutiveWeeks, customRange]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer border-0 shadow-2xs outline-none"
        title="Chọn thời gian xem lịch học"
      >
        <Calendar size={14} className="text-blue-600 dark:text-[#5c36f5] shrink-0" />
        <span className="whitespace-nowrap font-extrabold">{triggerLabel}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto top-full mt-1.5 z-50 bg-white dark:bg-[#0c101d] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.22)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.95)] max-h-[calc(100vh-100px)] overflow-y-auto overflow-x-hidden flex flex-col sm:flex-row select-none animate-mac-dropdown">
          {/* Dual Month Calendar View: Month 1 & Month 2 Side-by-Side */}
          <div
            className="p-2.5 sm:p-3 flex flex-col md:flex-row gap-3.5 md:gap-4 shrink-0"
            onMouseLeave={() => {
              setActiveHoverDay(null);
              if (!pickingStart) setHoverDate(null);
            }}
          >
            {/* Left Calendar: Month 1 */}
            <ScheduleDatePickerMonth
              year={yr}
              month={mo}
              weeks={weeks1}
              segments={segments}
              isPicking={!!pickingStart}
              pickingStart={pickingStart}
              hoverDate={hoverDate}
              activeHoverDay={activeHoverDay}
              hoverLayoutId="schedule-datepicker-hover-pill"
              onDayClick={handleDayClick}
              onDayHover={handleDayHover}
              onDoubleClickWeek={handleDoubleClickWeek}
              showPrev={true}
              showNext={false}
              onPrevMonth={() => changeMonth(-1)}
            />

            {/* Subtle Divider */}
            <div className="w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

            {/* Right Calendar: Month 2 (Always simultaneous) */}
            <ScheduleDatePickerMonth
              year={yr2}
              month={mo2}
              weeks={weeks2}
              segments={segments}
              isPicking={!!pickingStart}
              pickingStart={pickingStart}
              hoverDate={hoverDate}
              activeHoverDay={activeHoverDay}
              hoverLayoutId="schedule-datepicker-hover-pill"
              onDayClick={handleDayClick}
              onDayHover={handleDayHover}
              onDoubleClickWeek={handleDoubleClickWeek}
              showPrev={false}
              showNext={true}
              onNextMonth={() => changeMonth(1)}
            />
          </div>

          {/* Right Column: Presets with single 'Tất cả' button */}
          <ScheduleDatePickerPresets
            scope={scope}
            weeks={weeks1}
            activeStarts={activeStarts}
            onSelectAll={handleSelectAll}
            onToggleWeek={handleToggleWeek}
            onDoubleClickWeek={handleDoubleClickWeek}
            onReset={handleReset}
            onJumpToday={handleJumpToday}
            onApply={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
