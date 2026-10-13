import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '../../../components/datepicker/datePickerUtils';

interface InlineCalendarGridProps {
  year: number;
  month: number; // 1-12
  onPrevMonth: () => void;
  onNextMonth: () => void;
  mode: 'recurring' | 'temporary';
  selectedDates: string[]; // ['2026-10-14', ...]
  selectedDaysOfWeek: number[]; // [1, 3] (0 = Sunday, 1 = Monday, etc.)
  onToggleDate: (dateStr: string, dayOfWeek: number) => void;
  onToggleDayOfWeek: (dayOfWeek: number) => void;
  isSingleSelect?: boolean;
}

const WEEKDAYS = [
  { label: 'T2', dayNum: 1 },
  { label: 'T3', dayNum: 2 },
  { label: 'T4', dayNum: 3 },
  { label: 'T5', dayNum: 4 },
  { label: 'T6', dayNum: 5 },
  { label: 'T7', dayNum: 6 },
  { label: 'CN', dayNum: 0 },
];

export const InlineCalendarGrid: React.FC<InlineCalendarGridProps> = ({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  mode,
  selectedDates,
  selectedDaysOfWeek,
  onToggleDate,
  onToggleDayOfWeek,
  isSingleSelect = false,
}) => {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const firstDay = new Date(year, month - 1, 1).getDay();
  // Monday-first offset: Mon(1)->0, Tue(2)->1, ..., Sun(0)->6
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const cells: Array<{
    dateStr: string;
    dayNumber: number;
    dayOfWeek: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }> = [];

  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Previous month overflow
  for (let i = startOffset - 1; i >= 0; i--) {
    const dNum = prevMonthDays - i;
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    const dStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    const dObj = new Date(prevY, prevM - 1, dNum);
    cells.push({
      dateStr: dStr,
      dayNumber: dNum,
      dayOfWeek: dObj.getDay(),
      isCurrentMonth: false,
      isToday: dStr === todayISO,
      isSelected: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dObj = new Date(year, month - 1, d);
    const dayOfWeek = dObj.getDay();

    let isSelected = false;
    if (mode === 'recurring' && !isSingleSelect) {
      isSelected = selectedDaysOfWeek.includes(dayOfWeek);
    } else {
      isSelected = selectedDates.includes(dStr);
    }

    cells.push({
      dateStr: dStr,
      dayNumber: d,
      dayOfWeek,
      isCurrentMonth: true,
      isToday: dStr === todayISO,
      isSelected,
    });
  }

  // Fill up to multiple of 7
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const nextFill = 7 - remainder;
    for (let d = 1; d <= nextFill; d++) {
      const nextM = month === 12 ? 1 : month + 1;
      const nextY = month === 12 ? year + 1 : year;
      const dStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dObj = new Date(nextY, nextM - 1, d);
      cells.push({
        dateStr: dStr,
        dayNumber: d,
        dayOfWeek: dObj.getDay(),
        isCurrentMonth: false,
        isToday: dStr === todayISO,
        isSelected: false,
      });
    }
  }

  return (
    <div className="bg-slate-50/80 dark:bg-[#141928] rounded-2xl p-3 border-0 shadow-xs">
      {/* HEADER: Month & Year Navigator */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-black text-slate-900 dark:text-white">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer transition border-0"
            title="Tháng trước"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer transition border-0"
            title="Tháng sau"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* WEEKDAY COLUMN HEADERS */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {WEEKDAYS.map((w) => {
          const isWeekend = w.dayNum === 0 || w.dayNum === 6;
          const isRecurring = mode === 'recurring' && !isSingleSelect;
          const isDayActive = isRecurring && selectedDaysOfWeek.includes(w.dayNum);

          return (
            <button
              key={w.dayNum}
              type="button"
              onClick={() => {
                if (isRecurring) {
                  onToggleDayOfWeek(w.dayNum);
                }
              }}
              className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-black transition-all border-0 ${
                isRecurring ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              } ${
                isDayActive
                  ? isWeekend
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                  : isWeekend
                  ? 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10'
              }`}
              title={isRecurring ? `Bấm để chọn/bỏ chọn ${w.label}` : w.label}
            >
              {w.label}
            </button>
          );
        })}
      </div>

      {/* MONTH DAYS GRID */}
      <div
        className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center"
        onMouseLeave={() => setHoveredDate(null)}
      >
        {cells.map((c, idx) => {
          if (!c.isCurrentMonth) {
            return (
              <div
                key={`pad-${idx}`}
                className="w-8 h-8 mx-auto flex items-center justify-center text-xs font-medium text-slate-300 dark:text-slate-600 select-none"
              >
                {c.dayNumber}
              </div>
            );
          }

          const isHovered = hoveredDate === c.dateStr;

          return (
            <button
              key={c.dateStr}
              type="button"
              onClick={() => onToggleDate(c.dateStr, c.dayOfWeek)}
              onMouseEnter={() => setHoveredDate(c.dateStr)}
              className={`w-8 h-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-bold transition-all duration-150 cursor-pointer relative border-0 ${
                c.isSelected
                  ? 'text-white font-black'
                  : c.isToday
                  ? 'ring-1.5 ring-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
                  : 'text-slate-800 dark:text-slate-100 font-bold'
              }`}
            >
              {/* Sliding hover pill (matching range datepicker standard) */}
              {isHovered && !c.isSelected && (
                <motion.div
                  layoutId="inline-cal-hover"
                  className="absolute inset-0 rounded-full bg-slate-200/90 dark:bg-white/15 border border-slate-300/50 dark:border-white/20 shadow-xs pointer-events-none z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Selected pill */}
              {c.isSelected && (
                <div className="absolute inset-0 rounded-full bg-blue-600 shadow-xs z-10" />
              )}

              {/* Date Number */}
              <span className="relative z-20">{c.dayNumber}</span>

              {/* Today dot indicator */}
              {c.isToday && !c.isSelected && (
                <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-0.5 z-20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
