import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

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
  const [direction, setDirection] = useState<number>(0);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(-1);
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(1);
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

    // Prev month days
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

    // Next month days
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
    <div className="p-4 bg-[#0c0f1e]/98 border border-[#212c4b] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.95)] select-none w-76 space-y-3">
      {/* Month & Year Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white">{MONTH_NAMES[currentMonth]}</span>
          <span className="text-xs font-bold text-slate-400">{currentYear}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
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

      {/* Animated Month Slide Grid */}
      <div className="overflow-hidden relative min-h-[210px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${currentYear}-${currentMonth}`}
            initial={{ opacity: 0, x: direction * 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -25 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="grid grid-cols-7 gap-1"
          >
            {daysInMonth.map((item, idx) => {
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(item.date)}
                  className={`h-8 rounded-xl text-xs font-bold relative flex items-center justify-center cursor-pointer transition-colors ${
                    item.isSelected
                      ? 'text-white font-black z-10'
                      : item.isToday
                      ? 'text-white font-extrabold border border-indigo-400/50'
                      : item.isCurrentMonth
                      ? item.isHighlightedDayOfWeek
                        ? 'text-indigo-300 font-extrabold hover:bg-indigo-500/20'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 hover:bg-white/5'
                  }`}
                >
                  {/* Selected Day Framer Spring Backdrop */}
                  {item.isSelected && (
                    <motion.div
                      layoutId="calendar-selected-indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 rounded-xl bg-[#5c36f5] shadow-[0_0_16px_rgba(92,54,245,0.7)] z-0"
                    />
                  )}

                  <span className="relative z-10">{item.dayNumber}</span>

                  {item.isToday && !item.isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
                  )}
                  {item.isHighlightedDayOfWeek && !item.isSelected && !item.isToday && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Quick Actions */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleSelectToday}
          className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer flex items-center gap-1"
        >
          <Sparkles size={12} />
          <span>Hôm nay</span>
        </button>
        {selectedDate && (
          <span className="text-[11px] font-mono text-slate-400 font-bold">
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

      {/* Animated Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="absolute top-full left-0 mt-2 z-50 origin-top-left"
            >
              {calendarGrid}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedCalendar;
