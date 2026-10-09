import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
import { getLocalDateStr } from '../../../utils';

interface ScheduleWeekRangePickerProps {
  currentWeekStart: Date;
  onSelectWeek: (startDate: Date) => void;
  className?: string;
}

export const ScheduleWeekRangePicker: React.FC<ScheduleWeekRangePickerProps> = ({
  currentWeekStart,
  onSelectWeek,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar displayed month/year state
  const [displayYear, setDisplayYear] = useState<number>(() => currentWeekStart.getFullYear());
  const [displayMonth, setDisplayMonth] = useState<number>(() => currentWeekStart.getMonth() + 1);

  // Sync displayed month when external week changes
  useEffect(() => {
    setDisplayYear(currentWeekStart.getFullYear());
    setDisplayMonth(currentWeekStart.getMonth() + 1);
  }, [currentWeekStart]);

  // Click outside listener
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const todayStr = getLocalDateStr();

  // Current selected week's Monday and Sunday date strings
  const selectedMonday = useMemo(() => {
    const d = new Date(currentWeekStart);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return d;
  }, [currentWeekStart]);

  const selectedSunday = useMemo(() => {
    const d = new Date(selectedMonday);
    d.setDate(d.getDate() + 6);
    return d;
  }, [selectedMonday]);

  const selectedStartStr = getLocalDateStr(selectedMonday);
  const selectedEndStr = getLocalDateStr(selectedSunday);

  // Format trigger text: "DD/MM - DD/MM/YYYY"
  const triggerLabel = useMemo(() => {
    const d1 = String(selectedMonday.getDate()).padStart(2, '0');
    const m1 = String(selectedMonday.getMonth() + 1).padStart(2, '0');
    const y1 = selectedMonday.getFullYear();

    const d2 = String(selectedSunday.getDate()).padStart(2, '0');
    const m2 = String(selectedSunday.getMonth() + 1).padStart(2, '0');
    const y2 = selectedSunday.getFullYear();

    if (y1 === y2) {
      return `${d1}/${m1} – ${d2}/${m2}/${y2}`;
    }
    return `${d1}/${m1}/${y1} – ${d2}/${m2}/${y2}`;
  }, [selectedMonday, selectedSunday]);

  // Compute month's weeks for the left shortcut panel
  const monthWeeks = useMemo(() => {
    const weeks: Array<{ weekNum: number; startDate: Date; label: string }> = [];
    // Start at 1st day of display month
    const firstDay = new Date(displayYear, displayMonth - 1, 1);
    const lastDay = new Date(displayYear, displayMonth, 0);

    // Monday of the week containing firstDay
    const cursor = new Date(firstDay);
    const day = cursor.getDay();
    cursor.setDate(cursor.getDate() - day + (day === 0 ? -6 : 1));

    let weekIndex = 1;
    while (cursor <= lastDay && weekIndex <= 5) {
      const wStart = new Date(cursor);
      weeks.push({
        weekNum: weekIndex,
        startDate: wStart,
        label: `Tuần ${weekIndex}`,
      });
      cursor.setDate(cursor.getDate() + 7);
      weekIndex++;
    }
    return weeks;
  }, [displayYear, displayMonth]);

  // Compute 42 calendar grid cells (Monday-first)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(displayYear, displayMonth - 1, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon
    const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - startOffset);

    const cells: Array<{
      date: Date;
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isRangeStart: boolean;
      isRangeEnd: boolean;
      isRangeMiddle: boolean;
    }> = [];

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const str = getLocalDateStr(cellDate);
      const isCurrentMonth = cellDate.getMonth() + 1 === displayMonth;
      const isToday = str === todayStr;

      const isRangeStart = str === selectedStartStr;
      const isRangeEnd = str === selectedEndStr;
      const isRangeMiddle = str > selectedStartStr && str < selectedEndStr;

      cells.push({
        date: cellDate,
        dateStr: str,
        dayNum: cellDate.getDate(),
        isCurrentMonth,
        isToday,
        isRangeStart,
        isRangeEnd,
        isRangeMiddle,
      });
    }

    return cells;
  }, [displayYear, displayMonth, selectedStartStr, selectedEndStr, todayStr]);

  const handlePrevMonth = () => {
    if (displayMonth === 1) {
      setDisplayYear(y => y - 1);
      setDisplayMonth(12);
    } else {
      setDisplayMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayYear(y => y + 1);
      setDisplayMonth(1);
    } else {
      setDisplayMonth(m => m + 1);
    }
  };

  const handleSelectDay = (cellDate: Date) => {
    // Select the week (Monday) containing cellDate
    const d = new Date(cellDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    onSelectWeek(d);
  };

  const handleSelectToday = () => {
    const now = new Date();
    const day = now.getDay();
    now.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    onSelectWeek(now);
    setDisplayYear(now.getFullYear());
    setDisplayMonth(now.getMonth() + 1);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#151c2e] border border-slate-300 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-400 text-slate-800 dark:text-slate-100 font-extrabold text-xs transition cursor-pointer shadow-2xs select-none"
        title="Chọn khoảng thời gian theo tuần"
      >
        <CalendarIcon size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="whitespace-nowrap">{triggerLabel}</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card */}
      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 bg-white dark:bg-[#0d1018] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* LEFT SIDEBAR: Week Shortcuts */}
          <div className="w-full sm:w-36 bg-slate-50 dark:bg-[#111728] border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-white/10 p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block mb-1">
                Lối Tắt
              </span>
              <button
                type="button"
                onClick={handleSelectToday}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 transition cursor-pointer"
              >
                Hôm nay
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block mb-1">
                  Tuần Tháng {displayMonth}
                </span>
                {monthWeeks.map((w) => {
                  const wStartStr = getLocalDateStr(w.startDate);
                  const isCurrent = wStartStr === selectedStartStr;
                  return (
                    <button
                      key={w.weekNum}
                      type="button"
                      onClick={() => onSelectWeek(w.startDate)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/5'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 mt-2">
              <button
                type="button"
                onClick={handleSelectToday}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

          {/* RIGHT CALENDAR: Month Grid */}
          <div className="p-4 w-72 sm:w-80 select-none">
            {/* Header: Month / Year Navigation */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black text-slate-800 dark:text-white">
                Tháng {String(displayMonth).padStart(2, '0')}, {displayYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 mb-1 text-center">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dh) => (
                <div key={dh} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1">
                  {dh}
                </div>
              ))}
            </div>

            {/* 42 Days Grid with Week Highlight Strip */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarCells.map((cell) => {
                const { date, dayNum, isCurrentMonth, isToday, isRangeStart, isRangeEnd, isRangeMiddle } = cell;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => handleSelectDay(date)}
                    className={`relative h-8 flex items-center justify-center cursor-pointer transition-colors ${
                      isRangeMiddle
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
                        : isRangeStart && !isRangeEnd
                        ? 'bg-gradient-to-r from-transparent to-blue-100 dark:to-blue-900/40'
                        : isRangeEnd && !isRangeStart
                        ? 'bg-gradient-to-l from-transparent to-blue-100 dark:to-blue-900/40'
                        : ''
                    }`}
                  >
                    {/* Circle badge for start or end */}
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full flex flex-col items-center justify-center font-bold text-xs ${
                        isRangeStart || isRangeEnd
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : isRangeMiddle
                          ? 'text-blue-900 dark:text-blue-100 font-extrabold'
                          : isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                          : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="leading-none">{dayNum}</span>

                      {/* Red indicator dot for Today */}
                      {isToday && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                            isRangeStart || isRangeEnd ? 'bg-amber-300' : 'bg-rose-500'
                          }`}
                          title="Hôm nay"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
