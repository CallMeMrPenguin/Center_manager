import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekInfo, DateRangeSegment } from './scheduleDatePickerHelper';
import { ScheduleDatePickerDayCell } from './ScheduleDatePickerDayCell';

interface ScheduleDatePickerMonthProps {
  year: number;
  month: number;
  weeks: WeekInfo[];
  segments: DateRangeSegment[];
  isPicking: boolean;
  pickingStart?: string | null;
  hoverDate?: string | null;
  onDayClick: (dateStr: string) => void;
  onDayHover: (dateStr: string) => void;
  onDoubleClickWeek?: (w: WeekInfo) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}

export const ScheduleDatePickerMonth: React.FC<ScheduleDatePickerMonthProps> = ({
  year,
  month,
  weeks,
  segments,
  isPicking,
  pickingStart,
  hoverDate,
  onDayClick,
  onDayHover,
  onDoubleClickWeek,
  onPrevMonth,
  onNextMonth,
  showPrev = false,
  showNext = false,
}) => {
  return (
    <div className="flex flex-col w-full sm:w-68 md:w-72 select-none">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-2.5 px-1 h-7">
        <div className="flex items-center gap-1">
          {showPrev ? (
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer border-0"
              title="Tháng trước"
            >
              <ChevronLeft size={15} />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wide">
          Tháng {month} <span className="font-semibold text-slate-500 dark:text-slate-400">{year}</span>
        </span>

        <div className="flex items-center gap-1">
          {showNext ? (
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer border-0"
              title="Tháng sau"
            >
              <ChevronRight size={15} />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>
      </div>

      {/* Weekday Labels (T2, T3, T4, T5, T6, T7, CN) */}
      <div className="grid grid-cols-7 text-center text-[10.5px] font-bold text-slate-400 dark:text-slate-500 mb-1">
        <span>T2</span>
        <span>T3</span>
        <span>T4</span>
        <span>T5</span>
        <span>T6</span>
        <span>T7</span>
        <span className="text-rose-500 dark:text-rose-400">CN</span>
      </div>

      {/* Week Rows */}
      <div className="space-y-0.5">
        {weeks.map((w) => (
          <div
            key={w.index}
            onDoubleClick={() => onDoubleClickWeek?.(w)}
            className="grid grid-cols-7 relative group transition-colors"
          >
            {w.days.map((d, dIdx) => (
              <ScheduleDatePickerDayCell
                key={d.dateStr}
                day={d}
                dayIndex={dIdx}
                segments={segments}
                isPicking={isPicking}
                pickingStart={pickingStart}
                hoverDate={hoverDate}
                onDayClick={onDayClick}
                onDayHover={onDayHover}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
