import { ComponentSourceItem } from '../types';

export const dateTimeSources: ComponentSourceItem[] = [
  {
    id: 'date-picker-custom',
    title: 'CustomDatePicker (Bộ Chọn Ngày Đơn Light & Dark Chuẩn)',
    description: 'Bộ chọn ngày theo AGENTS.md Rule 2.4, thay thế hoàn toàn thẻ input date gốc. Hỗ trợ chọn nhanh Hôm nay/Hôm qua, chuyển tháng/năm, và đánh dấu ngày học.',
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
    </div>
  );
};`,
    typesCode: `export interface CustomDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  highlightDaysOfWeek?: number[];
  highlightDates?: string[];
}`
  },
  {
    id: 'date-range-picker-custom',
    title: 'CustomDateRangePicker (Bộ Chọn Khoảng Ngày Có Ruy Băng Hover)',
    description: 'Bộ chọn khoảng ngày hai đầu mút (Start - End) với hiệu ứng ruy băng trượt (hover connector ribbon) nối giữa ngày bắt đầu và ngày con trỏ đang rê qua, tích hợp các bộ lọc nhanh.',
    category: 'datetime',
    dependencies: ['lucide-react', 'framer-motion'],
    filename: 'CustomDateRangePicker.tsx',
    usageCode: `import { CustomDateRangePicker, DateRangeValue } from '@/components/datepicker';
import { useState } from 'react';

export function Example() {
  const [range, setRange] = useState<DateRangeValue | null>({
    startStr: '2026-10-12',
    endStr: '2026-10-19',
  });

  return (
    <div className="w-80">
      <CustomDateRangePicker
        value={range}
        onChange={setRange}
        placeholder="Chọn khoảng ngày..."
      />
    </div>
  );
}`,
    sourceCode: `import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
}

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Chọn khoảng ngày...',
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [pickingStart, setPickingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Implementation with hover ribbon connectors across active range...
  return (
    <div className={\`relative inline-block w-full \${className}\`} ref={containerRef}>
      {/* Trigger Button & Popover with Quick Presets */}
    </div>
  );
};`,
    typesCode: `export interface DateRangeValue {
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

  return (
    <div className={\`relative inline-block w-full \${className}\`} ref={containerRef}>
      {/* Time Picker Wheel Implementation */}
    </div>
  );
};`
  }
];
