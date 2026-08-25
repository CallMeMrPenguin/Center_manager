import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

export interface AnimatedCalendarProps {
  value?: Date | string | null;
  onChange?: (date: Date) => void;
  mode?: 'single' | 'range';
  placeholder?: string;
  highlightDaysOfWeek?: number[];
  className?: string;
  inline?: boolean;
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const AnimatedCalendar: React.FC<AnimatedCalendarProps> = ({
  value,
  onChange,
  mode = 'single',
  placeholder = 'Chọn ngày',
  highlightDaysOfWeek = [],
  className = '',
  inline = false,
}) => {
  const selectedDate = useMemo(() => {
    if (!value) return null;
    return typeof value === 'string' ? new Date(value) : value;
  }, [value]);

  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());
  const [isOpen, setIsOpen] = useState(inline);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isHighlightedDayOfWeek: boolean;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month padding days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: selectedDate ? d.toDateString() === selectedDate.toDateString() : false,
        isHighlightedDayOfWeek: highlightDaysOfWeek.includes(d.getDay()),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        isSelected: selectedDate ? d.toDateString() === selectedDate.toDateString() : false,
        isHighlightedDayOfWeek: highlightDaysOfWeek.includes(d.getDay()),
      });
    }

    // Next month padding days to complete grid (6 rows = 42 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: selectedDate ? d.toDateString() === selectedDate.toDateString() : false,
        isHighlightedDayOfWeek: highlightDaysOfWeek.includes(d.getDay()),
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDate, highlightDaysOfWeek]);

  const handleSelectDay = (dayDate: Date) => {
    onChange?.(dayDate);
    if (!inline) setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setViewDate(today);
    onChange?.(today);
    if (!inline) setIsOpen(false);
  };

  const formatDisplay = (d: Date | null) => {
    if (!d || isNaN(d.getTime())) return placeholder;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calendarGrid = (
    <div className="p-4 bg-[#0c0f1e] border border-[#212c4b] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] select-none w-72 space-y-3">
      {/* Month & Year Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-white">{MONTH_NAMES[currentMonth]}</span>
          <span className="text-xs font-bold text-slate-400">{currentYear}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tháng trước"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tháng sau"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_NAMES.map((name, idx) => (
          <span
            key={name}
            className={`text-[10px] font-black uppercase py-1 ${
              idx === 0 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {name}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((item, idx) => {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectDay(item.date)}
              className={`h-8 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${
                item.isSelected
                  ? 'bg-[#5c36f5] text-white shadow-[0_0_12px_rgba(92,54,245,0.6)] font-black scale-105 z-10'
                  : item.isToday
                  ? 'bg-white/10 text-white font-extrabold border border-indigo-400/50'
                  : item.isCurrentMonth
                  ? item.isHighlightedDayOfWeek
                    ? 'text-indigo-300 font-extrabold hover:bg-indigo-500/20'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  : 'text-slate-600 hover:bg-white/5'
              }`}
            >
              <span>{item.dayNumber}</span>
              {item.isToday && !item.isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
              )}
              {item.isHighlightedDayOfWeek && !item.isSelected && !item.isToday && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleSelectToday}
          className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer"
        >
          Hôm nay
        </button>
        {selectedDate && (
          <span className="text-[11px] font-mono text-slate-400">
            {formatDisplay(selectedDate)}
          </span>
        )}
      </div>
    </div>
  );

  if (inline) {
    return <div className={className}>{calendarGrid}</div>;
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#0c0f1e] border border-[#212c4b] hover:border-[#5c36f5] text-white text-xs font-bold transition cursor-pointer shadow-sm w-full"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-white shrink-0" />
          <span className={selectedDate ? 'text-white' : 'text-slate-400'}>
            {formatDisplay(selectedDate)}
          </span>
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-left">
            {calendarGrid}
          </div>
        </>
      )}
    </div>
  );
};
