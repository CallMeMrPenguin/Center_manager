import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';
import { getLocalDateStr } from '../../../utils';

interface ScheduleDatePickerProps {
  selectedMonth: string; // 'YYYY-MM'
  onSelectMonth: (monthStr: string) => void;
  scope: 'all' | 'week';
  onSelectScope: (scope: 'all' | 'week') => void;
  weekStart: Date;
  onSelectWeekStart: (newMonday: Date) => void;
  today: string; // 'YYYY-MM-DD'
}

interface WeekInfo {
  index: number;
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  rangeLabel: string;
  days: Array<{
    date: Date;
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }>;
}

export const ScheduleDatePicker: React.FC<ScheduleDatePickerProps> = ({
  selectedMonth,
  onSelectMonth,
  scope,
  onSelectScope,
  weekStart,
  onSelectWeekStart,
  today,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse Year and Month
  const [yr, mo] = useMemo(() => {
    const parts = (selectedMonth || getLocalDateStr().slice(0, 7)).split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [selectedMonth]);

  // Click outside to close
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

  // Compute weeks of current month
  const weeks = useMemo<WeekInfo[]>(() => {
    const firstDay = new Date(yr, mo - 1, 1);
    const dayOfWeek = firstDay.getDay();
    const monOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const firstMon = new Date(yr, mo - 1, 1 - monOffset);

    const result: WeekInfo[] = [];
    let curMon = new Date(firstMon);
    let idx = 1;

    while (true) {
      const weekEnd = new Date(curMon);
      weekEnd.setDate(curMon.getDate() + 6);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(curMon);
        d.setDate(curMon.getDate() + i);
        const dStr = getLocalDateStr(d);
        days.push({
          date: d,
          dateStr: dStr,
          dayNum: d.getDate(),
          isCurrentMonth: d.getFullYear() === yr && d.getMonth() === mo - 1,
          isToday: dStr === today,
        });
      }

      const sNum = curMon.getDate();
      const sMo = curMon.getMonth() + 1;
      const eNum = weekEnd.getDate();
      const eMo = weekEnd.getMonth() + 1;
      const rangeLabel = `${String(sNum).padStart(2, '0')}/${String(sMo).padStart(2, '0')} - ${String(eNum).padStart(2, '0')}/${String(eMo).padStart(2, '0')}`;

      result.push({
        index: idx,
        start: new Date(curMon),
        end: weekEnd,
        startStr: getLocalDateStr(curMon),
        endStr: getLocalDateStr(weekEnd),
        rangeLabel,
        days,
      });

      // Advance 7 days
      curMon.setDate(curMon.getDate() + 7);
      idx++;

      // If next Monday is already in next month/year, stop
      if (
        curMon.getFullYear() > yr ||
        (curMon.getFullYear() === yr && curMon.getMonth() > mo - 1)
      ) {
        break;
      }
      if (idx > 6) break;
    }

    return result;
  }, [yr, mo, today]);

  // Active week matching weekStart
  const weekStartStr = getLocalDateStr(weekStart);
  const activeWeek = useMemo(() => {
    return weeks.find((w) => w.startStr === weekStartStr) || weeks[0];
  }, [weeks, weekStartStr]);

  // Navigate month in popover
  const changeMonth = (delta: number) => {
    const nextMoDate = new Date(yr, mo - 1 + delta, 1);
    const newMoStr = `${nextMoDate.getFullYear()}-${String(nextMoDate.getMonth() + 1).padStart(2, '0')}`;
    onSelectMonth(newMoStr);
  };

  // Jump to today
  const handleJumpToday = () => {
    const now = new Date();
    const d = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (d === 0 ? 6 : d - 1));
    const nowMoStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onSelectMonth(nowMoStr);
    onSelectWeekStart(mon);
    onSelectScope('week');
    setOpen(false);
  };

  // Reset to current month (Cả tháng)
  const handleReset = () => {
    const nowMoStr = today.slice(0, 7);
    onSelectMonth(nowMoStr);
    onSelectScope('all');
    setOpen(false);
  };

  // Select week
  const handleSelectWeek = (w: WeekInfo) => {
    onSelectWeekStart(w.start);
    onSelectScope('week');
    setOpen(false);
  };

  // Trigger button label
  const triggerLabel = useMemo(() => {
    if (scope === 'all') {
      return `Tháng ${mo}/${yr} (Cả tháng)`;
    }
    if (activeWeek) {
      return `Tuần ${activeWeek.index} (${activeWeek.rangeLabel})`;
    }
    return `Tháng ${mo}/${yr}`;
  }, [scope, mo, yr, activeWeek]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
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

      {/* Popover Card: Calendar on Left, Tabs on Right */}
      {open && (
        <div className="absolute left-0 sm:left-auto top-full mt-2 z-50 bg-white dark:bg-[#151c2e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.2)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col sm:flex-row select-none animate-mac-dropdown">
          {/* ── LEFT COLUMN: Interactive Month Calendar Grid ── */}
          <div className="p-3.5 w-72 sm:w-80 flex flex-col shrink-0">
            {/* Header: Tháng M YYYY + Prev / Next */}
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

            {/* Weekdays row: T2 T3 T4 T5 T6 T7 CN */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-rose-500 dark:text-rose-400">CN</span>
            </div>

            {/* Week rows */}
            <div className="space-y-1">
              {weeks.map((w) => {
                const isWeekSelected = scope === 'week' && w.startStr === weekStartStr;
                return (
                  <div
                    key={w.index}
                    onClick={() => handleSelectWeek(w)}
                    className="grid grid-cols-7 relative cursor-pointer group rounded-full transition-colors"
                  >
                    {w.days.map((d, dIdx) => {
                      const isFirst = dIdx === 0;
                      const isLast = dIdx === 6;

                      // Full Month Highlight (scope === 'all')
                      if (scope === 'all') {
                        const bgCls = d.isCurrentMonth
                          ? 'bg-blue-50/70 dark:bg-blue-950/25 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-slate-300 dark:text-slate-600';
                        const roundCls = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
                        return (
                          <div key={d.dateStr} className={`relative flex flex-col items-center justify-center h-8 text-xs ${bgCls} ${roundCls}`}>
                            <span className="leading-none">{d.dayNum}</span>
                            {d.isToday && <span className="w-1 h-1 rounded-full mt-0.5 bg-rose-500" />}
                          </div>
                        );
                      }

                      // Single Week Highlight (Image 3 Ribbon Standard)
                      if (isWeekSelected) {
                        return (
                          <div key={d.dateStr} className="relative flex items-center justify-center h-8">
                            {isFirst && <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
                            {isLast && <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-blue-100 dark:bg-blue-900/40" />}
                            {!isFirst && !isLast && <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/40" />}
                            {isFirst || isLast ? (
                              <div className="relative z-10 w-7 h-7 rounded-full bg-blue-600 text-white font-black flex flex-col items-center justify-center shadow-xs text-xs">
                                <span className="leading-none">{d.dayNum}</span>
                                {d.isToday && <span className="w-1 h-1 rounded-full bg-white mt-0.5" />}
                              </div>
                            ) : (
                              <div className="relative z-10 text-xs font-bold text-blue-900 dark:text-blue-100 flex flex-col items-center">
                                <span className="leading-none">{d.dayNum}</span>
                                {d.isToday && <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Default Inactive week row (with subtle hover)
                      const textCls = d.isCurrentMonth ? 'text-slate-700 dark:text-slate-200 font-semibold' : 'text-slate-300 dark:text-slate-600';
                      const cornerCls = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
                      return (
                        <div key={d.dateStr} className={`relative flex flex-col items-center justify-center h-8 text-xs group-hover:bg-slate-100 dark:group-hover:bg-white/5 ${textCls} ${cornerCls}`}>
                          <span className="leading-none">{d.dayNum}</span>
                          {d.isToday && <span className="w-1 h-1 rounded-full mt-0.5 bg-rose-500" />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Bottom info: selection summary */}
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Đang chọn:</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">
                {scope === 'all' ? `Cả tháng (${weeks.length} tuần)` : `Tuần ${activeWeek?.index}`}
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Preset Tabs Panel (Tab bên phải theo yêu cầu) ── */}
          <div className="w-full sm:w-48 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 p-2.5 space-y-1 bg-slate-50/70 dark:bg-[#0f1424] shrink-0 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-2 py-1">
                Khoảng thời gian
              </div>

              {/* Option: Cả tháng (4 tuần) - MẶC ĐỊNH */}
              <button
                type="button"
                onClick={() => {
                  onSelectScope('all');
                  setOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-between cursor-pointer border-0 ${
                  scope === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10'
                }`}
              >
                <span>Cả tháng (4 tuần)</span>
                {scope === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
              </button>

              <div className="my-1 border-t border-slate-200 dark:border-white/10" />

              {/* Week items */}
              {weeks.map((w) => {
                const isSelected = scope === 'week' && w.startStr === weekStartStr;
                return (
                  <button
                    key={w.index}
                    type="button"
                    onClick={() => handleSelectWeek(w)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex flex-col gap-0.5 cursor-pointer border-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 font-bold'
                    }`}
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

            {/* Bottom Actions: Hôm nay + Đặt lại */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1">
              <button
                type="button"
                onClick={handleJumpToday}
                className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition cursor-pointer border-0"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full text-left px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer border-0"
              >
                <RotateCcw size={11} />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
