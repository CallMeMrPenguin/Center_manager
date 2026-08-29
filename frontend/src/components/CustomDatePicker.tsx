import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  align?: 'left' | 'right';
  highlightDaysOfWeek?: number[]; // e.g. [1, 3, 5] for Mon, Wed, Fri (0 = Sunday)
  highlightDates?: string[]; // e.g. ['2026-07-28', '2026-07-30']
  maxHighlightDate?: string; // default today 'YYYY-MM-DD'
}

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const parseLocalDate = (val: string | null | undefined): Date | null => {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const parts = val.trim().split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const formatToISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn ngày...',
  className = '',
  align = 'left',
  highlightDaysOfWeek = [],
  highlightDates = [],
  maxHighlightDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseLocalDate(value), [value]);

  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  useEffect(() => {
    if (value) {
      const parsed = parseLocalDate(value);
      if (parsed) {
        setViewDate(parsed);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  const todayISO = formatToISODate(todayObj);
  const cutoffDateStr = maxHighlightDate || todayISO;

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      date: Date;
      isoStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isStudyDay: boolean;
    }> = [];

    // Previous month overflow days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
      d.setHours(0, 0, 0, 0);
      const iso = formatToISODate(d);
      const dayOfWeek = d.getDay();
      const isPastOrToday = iso <= cutoffDateStr;
      const isStudyDay = isPastOrToday && (
        highlightDaysOfWeek.includes(dayOfWeek) ||
        highlightDates.includes(iso)
      );

      days.push({
        date: d,
        isoStr: iso,
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: iso === todayISO,
        isSelected: value === iso,
        isStudyDay,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      d.setHours(0, 0, 0, 0);
      const iso = formatToISODate(d);
      const dayOfWeek = d.getDay();
      const isPastOrToday = iso <= cutoffDateStr;
      const isStudyDay = isPastOrToday && (
        highlightDaysOfWeek.includes(dayOfWeek) ||
        highlightDates.includes(iso)
      );

      days.push({
        date: d,
        isoStr: iso,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: iso === todayISO,
        isSelected: value === iso,
        isStudyDay,
      });
    }

    // Next month overflow days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      d.setHours(0, 0, 0, 0);
      const iso = formatToISODate(d);
      const dayOfWeek = d.getDay();
      const isPastOrToday = iso <= cutoffDateStr;
      const isStudyDay = isPastOrToday && (
        highlightDaysOfWeek.includes(dayOfWeek) ||
        highlightDates.includes(iso)
      );

      days.push({
        date: d,
        isoStr: iso,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: iso === todayISO,
        isSelected: value === iso,
        isStudyDay,
      });
    }

    return days;
  }, [currentYear, currentMonth, value, highlightDaysOfWeek, highlightDates, cutoffDateStr, todayISO]);

  const handleSelectDate = (isoStr: string) => {
    onChange(isoStr);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const iso = formatToISODate(today);
    setViewDate(today);
    onChange(iso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const displayFormatted = useMemo(() => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#0c0f1e] border border-[#212c4b] hover:border-[#5c36f5] text-white text-xs font-bold transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-[#5c36f5]"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-indigo-400 shrink-0" />
          <span className={displayFormatted ? 'text-white font-black' : 'text-slate-400 font-normal'}>
            {displayFormatted || placeholder}
          </span>
        </div>
        {value && (
          <span
            onClick={handleClear}
            className="p-0.5 hover:text-rose-400 text-slate-500 transition cursor-pointer shrink-0"
            title="Xóa ngày"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {/* ANIMATED POPOVER CARD */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`absolute top-full ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'} mt-2 z-[9999] w-80 p-4 bg-[#0c0f1e]/98 border border-[#212c4b] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.95)] select-none space-y-3`}
          >
            {/* Header: Month/Year Nav */}
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

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center px-1">
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

            {/* Animated Month Sliding Grid with shadow bleed buffer */}
            <div className="overflow-hidden relative min-h-[210px] p-1.5 -m-1.5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${currentYear}-${currentMonth}`}
                  initial={{ opacity: 0, x: direction * 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -25 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="grid grid-cols-7 gap-1 p-0.5"
                >
                  {daysInMonth.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDate(item.isoStr)}
                      className={`h-8 w-full rounded-xl text-xs font-bold relative flex items-center justify-center cursor-pointer transition-colors ${
                        item.isSelected
                          ? 'text-white font-black z-10'
                          : item.isToday
                          ? 'text-white font-extrabold border border-indigo-400/50'
                          : item.isCurrentMonth
                          ? item.isStudyDay
                            ? 'text-indigo-300 font-extrabold hover:bg-indigo-500/20'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white'
                          : 'text-slate-600 hover:bg-white/5'
                      }`}
                      title={item.isStudyDay ? `Ngày học của lớp (${item.dayNumber}/${currentMonth + 1}/${currentYear})` : undefined}
                    >
                      {/* Selected Spring Pill Indicator with safe bounds */}
                      {item.isSelected && (
                        <motion.div
                          layoutId="custom-datepicker-selected"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className="absolute inset-0 rounded-xl bg-[#5c36f5] shadow-[0_0_12px_rgba(92,54,245,0.7)] z-0"
                        />
                      )}

                      <span className="relative z-10">{item.dayNumber}</span>

                      {item.isToday && !item.isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400" />
                      )}
                      {item.isStudyDay && !item.isSelected && !item.isToday && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                      )}
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleSelectToday}
                className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles size={12} />
                <span>Hôm nay</span>
              </button>
              {displayFormatted && (
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  {displayFormatted}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
