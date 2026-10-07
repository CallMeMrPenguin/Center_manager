import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  parseLocalDate,
  formatToISODate,
  buildMonthCalendarDays,
} from './datepicker/datePickerUtils';
import { MonthGridPicker } from './datepicker/MonthGridPicker';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD' or 'YYYY-MM'
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  align?: 'left' | 'right';
  mode?: 'date' | 'month';
  highlightDaysOfWeek?: number[]; // e.g. [1, 3, 5] for Mon, Wed, Fri (0 = Sunday)
  highlightDates?: string[]; // e.g. ['2026-07-28', '2026-07-30']
  maxHighlightDate?: string; // default today 'YYYY-MM-DD'
  triggerClassName?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn ngày...',
  className = '',
  align = 'left',
  mode = 'date',
  highlightDaysOfWeek = [],
  highlightDates = [],
  maxHighlightDate,
  triggerClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<number>(0);
  const [autoAlign, setAutoAlign] = useState<'left' | 'right'>(align === 'right' ? 'right' : 'left');
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseLocalDate(value), [value]);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollParent = containerRef.current.closest('.overflow-y-auto, .overflow-hidden, .fixed, [role="dialog"]');
      const parentRect = scrollParent ? scrollParent.getBoundingClientRect() : null;

      const boundaryRight = parentRect ? Math.min(window.innerWidth, parentRect.right) : window.innerWidth;
      const spaceRight = boundaryRight - rect.left;

      if (align === 'right' || spaceRight < 330) {
        setAutoAlign('right');
      } else {
        setAutoAlign('left');
      }

      const boundaryBottom = parentRect ? Math.min(window.innerHeight, parentRect.bottom) : window.innerHeight;
      const spaceBelow = boundaryBottom - rect.bottom;
      const spaceAbove = rect.top - (parentRect ? parentRect.top : 0);
      setOpenUpwards(spaceBelow < 340 && spaceAbove > 340);
    }
  }, [isOpen, align]);

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
    return buildMonthCalendarDays({
      currentYear,
      currentMonth,
      value,
      todayISO,
      cutoffDateStr,
      highlightDaysOfWeek,
      highlightDates,
    });
  }, [currentYear, currentMonth, value, highlightDaysOfWeek, highlightDates, cutoffDateStr, todayISO]);

  const handleSelectDate = (isoStr: string) => {
    onChange(isoStr);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    if (mode === 'month') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      onChange(`${y}-${m}`);
    } else {
      const iso = formatToISODate(today);
      onChange(iso);
    }
    setViewDate(today);
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
    if (mode === 'month' && parts.length >= 2) {
      return `Tháng ${parseInt(parts[1], 10)}/${parts[0]}`;
    }
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value, mode]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON (Synced with button shade setting via btn-neutral or custom triggerClassName) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-slate-900 dark:text-white text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-sm outline-none ${
          triggerClassName || 'btn-neutral border-0'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-blue-600 dark:text-blue-400 shrink-0 font-bold" />
          <span className={displayFormatted ? 'text-slate-900 dark:text-white font-black' : 'text-slate-500 font-bold'}>
            {displayFormatted || placeholder}
          </span>
        </div>
        {value && (
          <span
            onClick={handleClear}
            className="p-0.5 hover:text-rose-500 text-slate-400 dark:text-slate-500 transition cursor-pointer shrink-0"
            title="Xóa ngày"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {/* ANIMATED POPOVER CARD (Solid white in light mode, zero border) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: openUpwards ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: openUpwards ? 6 : -6 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`absolute ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'} ${autoAlign === 'right' ? 'right-0' : 'left-0'} ${
              openUpwards
                ? autoAlign === 'right' ? 'origin-bottom-right' : 'origin-bottom-left'
                : autoAlign === 'right' ? 'origin-top-right' : 'origin-top-left'
            } z-[9999] w-80 p-4 bg-white dark:bg-[#181d2e] rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.9)] border-0 outline-none select-none space-y-3`}
          >
            {mode === 'month' ? (
              <MonthGridPicker
                currentYear={currentYear}
                currentMonth={currentMonth}
                value={value}
                onSelectMonth={(monthStr) => {
                  onChange(monthStr);
                  setIsOpen(false);
                }}
                onPrevYear={() => setViewDate(new Date(currentYear - 1, currentMonth, 1))}
                onNextYear={() => setViewDate(new Date(currentYear + 1, currentMonth, 1))}
              />
            ) : (
              <>
                {/* Header: Month/Year Nav */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{MONTH_NAMES[currentMonth]}</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{currentYear}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[var(--btn-neutral-hover,#e2e8f0)] dark:hover:bg-[#1c1c21] transition cursor-pointer font-bold border-0"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[var(--btn-neutral-hover,#e2e8f0)] dark:hover:bg-[#1c1c21] transition cursor-pointer font-bold border-0"
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
                        idx === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
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
                          className={`h-8 w-full rounded-xl text-xs font-bold relative flex items-center justify-center cursor-pointer transition-colors border-0 outline-none ${
                            item.isSelected
                              ? 'text-white font-black z-10'
                              : item.isToday
                              ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-blue-500/20'
                              : item.isCurrentMonth
                              ? item.isStudyDay
                                ? 'text-blue-600 dark:text-blue-300 font-black hover:bg-blue-100 dark:hover:bg-blue-500/20'
                                : 'text-slate-900 dark:text-slate-100 font-extrabold hover:bg-[var(--btn-neutral-hover,#e2e8f0)] dark:hover:bg-[#1c1c21] hover:text-black dark:hover:text-white'
                              : 'text-slate-400 dark:text-slate-500 hover:bg-[var(--btn-neutral-hover,#e2e8f0)]/50 dark:hover:bg-white/5'
                          }`}
                          title={item.isStudyDay ? `Ngày học của lớp (${item.dayNumber}/${currentMonth + 1}/${currentYear})` : undefined}
                        >
                          {/* Selected Spring Pill Indicator */}
                          {item.isSelected && (
                            <motion.div
                              layoutId="custom-datepicker-selected"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              className="absolute inset-0 rounded-xl bg-[#2563eb] shadow-xs z-0"
                            />
                          )}

                          <span className="relative z-10">{item.dayNumber}</span>

                          {item.isToday && !item.isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
                          )}
                          {item.isStudyDay && !item.isSelected && !item.isToday && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Quick Actions Footer - No icon beside 'Hôm nay' */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200/80 dark:border-white/5">
                  <button
                    type="button"
                    onClick={handleSelectToday}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-black transition cursor-pointer border-0"
                  >
                    Hôm nay
                  </button>
                  {displayFormatted && (
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                      {displayFormatted}
                    </span>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
