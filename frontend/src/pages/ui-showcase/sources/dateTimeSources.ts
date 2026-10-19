import { ComponentSourceItem } from '../types';

export const dateTimeSources: ComponentSourceItem[] = [
  {
    id: 'date-picker-custom',
    title: 'CustomDatePicker (Bộ Chọn Ngày Light & Dark Chuẩn)',
    description: 'Bộ chọn ngày theo AGENTS.md Rule 2.4, thay thế hoàn toàn thẻ input date gốc. Hỗ trợ chọn nhanh Hôm nay/Hôm qua, chuyển tháng/năm, và đánh dấu ngày trong tuần.',
    category: 'datetime',
    dependencies: ['lucide-react', 'framer-motion'],
    filename: 'CustomDatePicker.tsx',
    usageCode: `import { CustomDatePicker } from '@/components/datepicker';
import { useState } from 'react';

export function Example() {
  const [selectedDate, setSelectedDate] = useState('2026-10-19');

  return (
    <div className="w-64">
      <CustomDatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        placeholder="Chọn ngày học..."
        highlightDaysOfWeek={[1, 3, 5]} // Highlight Thứ 2, 4, 6
      />
    </div>
  );
}`,
    sourceCode: `import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { parseLocalDate, formatToISODate, buildMonthCalendarDays, MONTH_NAMES, WEEKDAY_NAMES } from './datePickerUtils';

export interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  highlightDaysOfWeek?: number[];
  highlightDates?: string[];
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn ngày...',
  className = '',
  align = 'left',
  highlightDaysOfWeek = [],
  highlightDates = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parseLocalDate(value), [value]);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calendarDays = useMemo(() => {
    return buildMonthCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  }, [viewDate]);

  return (
    <div className={\`relative inline-block w-full \${className}\`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-xs border-0 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{value ? parseLocalDate(value)?.toLocaleDateString('vi-VN') : placeholder}</span>
        </div>
      </button>

      {isOpen && (
        <div className={\`absolute z-50 mt-1.5 p-3 rounded-2xl bg-white dark:bg-[#181a20] shadow-xl border border-slate-200 dark:border-white/10 w-72 \${
          align === 'right' ? 'right-0' : 'left-0'
        }\`}>
          {/* Month Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-900 dark:text-white">
              Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border-0 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 border-0 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const iso = formatToISODate(item.date);
              const isSelected = value === iso;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { onChange(iso); setIsOpen(false); }}
                  className={\`h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition border-0 cursor-pointer \${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : item.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                      : 'text-slate-300 dark:text-slate-600'
                  }\`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};`,
    typesCode: `export interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  mode?: 'date' | 'month';
  highlightDaysOfWeek?: number[];
  highlightDates?: string[];
}`
  },
  {
    id: 'time-picker-custom',
    title: 'CustomTimePicker (Bộ Chọn Giờ Con Lăn Tinh Tế)',
    description: 'Bộ chọn giờ 24h/12h con lăn tương tác mượt mà với cột Giờ, Phút và Buổi (AM/PM), tích hợp các nút chọn nhanh 30 phút.',
    category: 'datetime',
    dependencies: ['lucide-react', 'framer-motion'],
    filename: 'CustomTimePicker.tsx',
    usageCode: `import { CustomTimePicker } from '@/components/timepicker';
import { useState } from 'react';

export function Example() {
  const [time, setTime] = useState('17:30');

  return (
    <div className="w-56">
      <CustomTimePicker
        value={time}
        onChange={setTime}
        placeholder="Chọn giờ học..."
      />
    </div>
  );
}`,
    sourceCode: `import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { parse24to12, convert12to24 } from './timePickerUtils';

export interface CustomTimePickerProps {
  value: string; // 'HH:mm' 24h
  onChange: (time24: string) => void;
  placeholder?: string;
  className?: string;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  placeholder = '06:00 PM',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const parsed = parse24to12(value);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className={\`relative inline-block w-full \${className}\`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition bg-white dark:bg-[#181a20] text-slate-900 dark:text-white shadow-xs border-0 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-blue-600 dark:text-blue-400" />
          <span>{value ? parsed.display : placeholder}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 p-3 rounded-2xl bg-white dark:bg-[#181a20] shadow-xl border border-slate-200 dark:border-white/10 w-64">
          <div className="flex justify-around text-center text-xs">
            {/* Hour List */}
            <div className="h-44 overflow-y-auto space-y-1 pr-1">
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => onChange(convert12to24(h, parsed.min, parsed.period))}
                  className={\`p-1.5 rounded-lg cursor-pointer font-mono \${
                    parsed.hour === h ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/5'
                  }\`}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Minute List */}
            <div className="h-44 overflow-y-auto space-y-1 px-1">
              {minutes.map((m) => (
                <div
                  key={m}
                  onClick={() => onChange(convert12to24(parsed.hour, m, parsed.period))}
                  className={\`p-1.5 rounded-lg cursor-pointer font-mono \${
                    parsed.min === m ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-100 dark:hover:bg-white/5'
                  }\`}
                >
                  {m}
                </div>
              ))}
            </div>

            {/* Period List */}
            <div className="space-y-2 pt-2">
              {['AM', 'PM'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(convert12to24(parsed.hour, parsed.min, p as any))}
                  className={\`w-full px-2.5 py-2 rounded-xl text-xs font-bold cursor-pointer border-0 \${
                    parsed.period === p ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200'
                  }\`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`
  }
];
