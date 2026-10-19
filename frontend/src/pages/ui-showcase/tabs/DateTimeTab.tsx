import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { CustomDatePicker, MonthGridPicker } from '../../../components/datepicker';
import { CustomTimePicker } from '../../../components/timepicker';
import { AnimatedCalendar } from '../../../components/ui/calender';
import { ComponentCard } from '../components/ComponentCard';
import { dateTimeSources } from '../sources/dateTimeSources';
import { ComponentSourceItem } from '../types';

interface DateTimeTabProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const DateTimeTab: React.FC<DateTimeTabProps> = ({ onViewCode }) => {
  const [date, setDate] = useState('2026-10-19');
  const [time, setTime] = useState('18:30');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [monthYear, setMonthYear] = useState(2026);
  const [calendarDate, setCalendarDate] = useState<Date | null>(new Date());

  const getSource = (id: string) => dateTimeSources.find((s) => s.id === id)!;

  return (
    <div className="space-y-6">
      {/* 1. CUSTOM DATE PICKER */}
      <ComponentCard item={getSource('date-picker-custom')} onViewCode={onViewCode}>
        <div className="w-full max-w-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Chọn Ngày Học (Highlight T2, T4, T6):
              </label>
              <CustomDatePicker
                value={date}
                onChange={setDate}
                placeholder="Chọn ngày học..."
                highlightDaysOfWeek={[1, 3, 5]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Căn Lề Phải (align="right"):
              </label>
              <CustomDatePicker
                value={date}
                onChange={setDate}
                align="right"
                placeholder="Chọn ngày..."
              />
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Ngày đã chọn (ISO): <span className="font-bold text-blue-600 dark:text-blue-400">{date}</span>
          </div>
        </div>
      </ComponentCard>

      {/* 2. CUSTOM TIME PICKER */}
      <ComponentCard item={getSource('time-picker-custom')} onViewCode={onViewCode}>
        <div className="w-full max-w-xl space-y-4">
          <div className="w-64">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Chọn Giờ Học (Con Lăn & AM/PM):
            </label>
            <CustomTimePicker
              value={time}
              onChange={setTime}
              placeholder="06:00 PM"
            />
          </div>

          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Giờ đã chọn (24h format): <span className="font-bold text-blue-600 dark:text-blue-400">{time}</span>
          </div>
        </div>
      </ComponentCard>

      {/* 3. MONTH GRID PICKER & ANIMATED INLINE CALENDAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComponentCard
          item={{
            id: 'month-grid-picker',
            title: 'MonthGridPicker (Lưới Chọn Tháng / Năm)',
            description: 'Lưới chọn nhanh 12 tháng trong năm cho báo cáo học phí, doanh thu hoặc lịch học theo tháng.',
            category: 'datetime',
            dependencies: ['lucide-react'],
            filename: 'MonthGridPicker.tsx',
            usageCode: `<MonthGridPicker
  currentYear={2026}
  currentMonth={10}
  value="${selectedMonth}"
  onSelectMonth={(m) => setSelectedMonth(m)}
  onPrevYear={() => setMonthYear(y => y - 1)}
  onNextYear={() => setMonthYear(y => y + 1)}
/>`,
            sourceCode: `// MonthGridPicker source code...`,
          }}
          onViewCode={onViewCode}
        >
          <div className="w-full max-w-xs">
            <MonthGridPicker
              currentYear={monthYear}
              currentMonth={10}
              value={selectedMonth}
              onSelectMonth={setSelectedMonth}
              onPrevYear={() => setMonthYear((y) => y - 1)}
              onNextYear={() => setMonthYear((y) => y + 1)}
            />
          </div>
        </ComponentCard>

        <ComponentCard
          item={{
            id: 'animated-calendar',
            title: 'AnimatedCalendar (Lịch Trực Quan Gắn Liền)',
            description: 'Lịch hiển thị trực tiếp (Inline) với hiệu ứng chuyển tháng mượt mà.',
            category: 'datetime',
            dependencies: ['lucide-react', 'framer-motion'],
            filename: 'calender.tsx',
            usageCode: `<AnimatedCalendar value={date} onChange={setDate} mode="single" />`,
            sourceCode: `// AnimatedCalendar source code...`,
          }}
          onViewCode={onViewCode}
        >
          <div className="w-full flex justify-center">
            <AnimatedCalendar
              value={calendarDate}
              onChange={setCalendarDate}
              mode="single"
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
};
