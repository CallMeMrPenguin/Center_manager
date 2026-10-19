import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MONTH_NAMES, WEEKDAY_NAMES, formatToISODate, parseLocalDate } from './datePickerUtils';

export interface DateRangeValue {
  startStr: string; // 'YYYY-MM-DD'
  endStr: string;   // 'YYYY-MM-DD'
}

export interface CustomDateRangePickerProps {
  value?: DateRangeValue | null;
  onChange: (val: DateRangeValue | null) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  triggerClassName?: string;
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn khoảng ngày...',
  className = '',
  align = 'left',
  triggerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => formatToISODate(today), [today]);

  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value?.startStr) {
      const parsed = parseLocalDate(value.startStr);
      if (parsed) return parsed;
    }
    return new Date();
  });

  const [pickingStart, setPickingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPickingStart(null);
        setHoverDate(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Compute month calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const dayOfWeek = firstDay.getDay(); // 0 is Sunday
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 0

    const startDate = new Date(currentYear, currentMonth, 1 - offset);
    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isSunday: boolean }[] = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = formatToISODate(d);
      days.push({
        dateStr: iso,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === currentMonth,
        isSunday: d.getDay() === 0,
      });
    }
    return days;
  }, [currentYear, currentMonth]);

  // Active range endpoints & preview
  const activeStart = pickingStart || value?.startStr || null;
  const activeEnd = pickingStart ? hoverDate : value?.endStr || null;

  const normalizedRange = useMemo(() => {
    if (!activeStart || !activeEnd) return null;
    return activeStart <= activeEnd
      ? { start: activeStart, end: activeEnd }
      : { start: activeEnd, end: activeStart };
  }, [activeStart, activeEnd]);

  const handleDayClick = (dateStr: string) => {
    if (!pickingStart) {
      setPickingStart(dateStr);
      setHoverDate(dateStr);
    } else {
      const [start, end] = pickingStart <= dateStr ? [pickingStart, dateStr] : [dateStr, pickingStart];
      onChange({ startStr: start, endStr: end });
      setPickingStart(null);
      setHoverDate(null);
      setIsOpen(false);
    }
  };

  const handleDayHover = (dateStr: string) => {
    if (pickingStart) {
      setHoverDate(dateStr);
    }
  };

  const handleQuickPreset = (type: 'today' | '7days' | 'thisWeek' | 'thisMonth' | '30days') => {
    const now = new Date();
    let s = new Date(now);
    let e = new Date(now);

    if (type === 'today') {
      // s and e are today
    } else if (type === '7days') {
      s.setDate(now.getDate() - 6);
    } else if (type === 'thisWeek') {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      s.setDate(now.getDate() - diff);
      e.setDate(s.getDate() + 6);
    } else if (type === 'thisMonth') {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === '30days') {
      s.setDate(now.getDate() - 29);
    }

    const startStr = formatToISODate(s);
    const endStr = formatToISODate(e);
    onChange({ startStr, endStr });
    setViewDate(s);
    setPickingStart(null);
    setHoverDate(null);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPickingStart(null);
    setHoverDate(null);
    setIsOpen(false);
  };

  const displayText = useMemo(() => {
    if (!value?.startStr || !value?.endStr) return '';
    const formatPart = (str: string) => {
      const parts = str.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : str;
    };
    return `${formatPart(value.startStr)} - ${formatPart(value.endStr)}`;
  }, [value]);

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-xs active:scale-[0.98] outline-none ${
          triggerClassName || 'bg-white hover:bg-slate-50 dark:bg-[#181a20] dark:hover:bg-[#20232b] text-slate-800 dark:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className="text-blue-600 dark:text-blue-400 shrink-0 font-bold" />
          <span className={displayText ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400 font-normal'}>
            {displayText || placeholder}
          </span>
        </div>
        {value && (
          <span
            onClick={handleClear}
            className="p-0.5 hover:text-rose-500 text-slate-400 transition cursor-pointer shrink-0"
            title="Xóa khoảng ngày"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[100] top-full mt-2 ${
              align === 'right' ? 'right-0' : 'left-0'
            } w-[360px] p-4 bg-white dark:bg-[#181a20] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 select-none space-y-4`}
          >
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-slate-100 dark:border-white/5">
              {[
                { id: 'today', label: 'Hôm nay' },
                { id: '7days', label: '7 ngày qua' },
                { id: 'thisWeek', label: 'Tuần này' },
                { id: 'thisMonth', label: 'Tháng này' },
                { id: '30days', label: '30 ngày qua' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickPreset(p.id as any)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-white/5 dark:hover:bg-blue-500/15 dark:hover:text-blue-400 transition cursor-pointer border-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Month & Year Navigation */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer border-0"
                  title="Tháng trước"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer border-0"
                  title="Tháng sau"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-slate-400">
              {WEEKDAY_NAMES.map((name, idx) => (
                <span key={name} className={idx === 6 ? 'text-rose-500' : ''}>
                  {name}
                </span>
              ))}
            </div>

            {/* Days Grid with Ribbon Connectors & Hover */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, idx) => {
                const dayIndex = idx % 7;
                const isFirstCol = dayIndex === 0;
                const isLastCol = dayIndex === 6;

                const inRange =
                  !!normalizedRange &&
                  day.dateStr >= normalizedRange.start &&
                  day.dateStr <= normalizedRange.end;

                const isStartEndpoint = !!normalizedRange && day.dateStr === normalizedRange.start;
                const isEndEndpoint = !!normalizedRange && day.dateStr === normalizedRange.end;
                const isSingleDay = isStartEndpoint && isEndEndpoint;
                const isInterior = inRange && !isStartEndpoint && !isEndEndpoint;
                const isEndpoint = isStartEndpoint || isEndEndpoint;

                const hasLeftConnector = inRange && !isSingleDay && !isStartEndpoint;
                const hasRightConnector = inRange && !isSingleDay && !isEndEndpoint;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => handleDayClick(day.dateStr)}
                    onMouseEnter={() => handleDayHover(day.dateStr)}
                    className="relative flex items-center justify-center h-8 select-none cursor-pointer group"
                  >
                    {/* Left Connector Ribbon */}
                    {hasLeftConnector && (
                      <div
                        className={`absolute left-0 top-0.5 bottom-0.5 w-1/2 bg-blue-100 dark:bg-blue-600/30 pointer-events-none transition-colors ${
                          isFirstCol ? 'rounded-l-full' : ''
                        }`}
                      />
                    )}

                    {/* Right Connector Ribbon */}
                    {hasRightConnector && (
                      <div
                        className={`absolute right-0 top-0.5 bottom-0.5 w-1/2 bg-blue-100 dark:bg-blue-600/30 pointer-events-none transition-colors ${
                          isLastCol ? 'rounded-r-full' : ''
                        }`}
                      />
                    )}

                    {/* Interior Range Fill */}
                    {isInterior && (
                      <div
                        className={`absolute inset-x-0 top-0.5 bottom-0.5 bg-blue-100 dark:bg-blue-600/30 pointer-events-none ${
                          isFirstCol ? 'rounded-l-full' : isLastCol ? 'rounded-r-full' : ''
                        }`}
                      />
                    )}

                    {/* Hover preview ring / pill */}
                    {!isEndpoint && (
                      <div className="absolute inset-0.5 rounded-xl bg-blue-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    )}

                    {/* Endpoint Circle Pill */}
                    {isEndpoint && (
                      <div className="absolute inset-0.5 rounded-xl bg-blue-600 text-white shadow-xs z-10 pointer-events-none" />
                    )}

                    {/* Day Number */}
                    <span
                      className={`relative z-20 text-xs font-bold ${
                        isEndpoint
                          ? 'text-white font-black'
                          : inRange
                          ? 'text-blue-900 dark:text-blue-200 font-black'
                          : day.isCurrentMonth
                          ? day.isSunday
                            ? 'text-rose-500 font-extrabold'
                            : 'text-slate-800 dark:text-slate-100'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Today Dot */}
                    {day.dateStr === todayISO && !isEndpoint && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500 z-20" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-white/5">
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {pickingStart ? 'Nhấp chọn ngày kết thúc...' : displayText || 'Chọn khoảng ngày'}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold transition cursor-pointer border-0"
              >
                Đặt lại
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDateRangePicker;
