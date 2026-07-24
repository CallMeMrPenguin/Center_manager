import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn ngày...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date or default to today
  const parsedDate = value ? new Date(value) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const [viewYear, setViewYear] = useState(validDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(validDate.getMonth()); // 0-indexed

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
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

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Days calculation for calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${mm}-${dd}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formatted = `${today.getFullYear()}-${mm}-${dd}`;
    onChange(formatted);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Formatted value display
  const displayFormatted = value ? (() => {
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  })() : '';

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* INPUT TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#121626] border border-[#263152] hover:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white transition-all cursor-pointer shadow-inner focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <span className={displayFormatted ? 'font-bold text-white' : 'text-slate-400 font-normal'}>
          {displayFormatted || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-indigo-400">
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:text-rose-400 transition cursor-pointer"
              title="Xóa ngày"
            >
              <X size={13} />
            </span>
          )}
          <Calendar size={15} className="text-indigo-400 shrink-0" />
        </div>
      </button>

      {/* CUSTOM DARK POPOVER DIALOG */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-[9999] w-72 bg-[#0c0f1e] border border-[#212c4b] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-4 select-none animate-slide-up">
          {/* HEADER MONTH/YEAR NAV */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-[#14192b] hover:bg-indigo-600 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-white tracking-wide">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-[#14192b] hover:bg-indigo-600 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* DAYS OF WEEK */}
          <div className="grid grid-cols-7 text-center mb-2">
            {daysOfWeek.map((d, i) => (
              <span key={i} className="text-[10px] font-black text-indigo-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* DAYS GRID */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const dateStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = value === dateStr;
              const isToday = (() => {
                const t = new Date();
                return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === dayNum;
              })();

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center mx-auto ${
                    isSelected
                      ? 'bg-[#5c36f5] text-white font-black shadow-[0_0_16px_rgba(92,54,245,0.8)] border border-indigo-300'
                      : isToday
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-black'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-[11px] font-extrabold">
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-400 hover:text-rose-300 transition cursor-pointer"
            >
              Xóa chọn
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
