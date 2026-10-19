import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Code2, Copy, CalendarRange } from 'lucide-react';
import { CustomDatePicker, CustomDateRangePicker, MonthGridPicker, DateRangeValue } from '../../../components/datepicker';
import { CustomTimePicker } from '../../../components/timepicker';
import { showToast } from '../../../components/Toast';
import { dateTimeSources } from '../sources/dateTimeSources';
import { ComponentSourceItem } from '../types';

interface DateTimeDemoViewProps {
  onViewCode: (item: ComponentSourceItem) => void;
}

export const DateTimeDemoView: React.FC<DateTimeDemoViewProps> = ({ onViewCode }) => {
  const [date, setDate] = useState('2026-10-19');
  const [dateRange, setDateRange] = useState<DateRangeValue | null>({
    startStr: '2026-10-12',
    endStr: '2026-10-19',
  });
  const [time, setTime] = useState('18:00');
  const [month, setMonth] = useState('2026-10');
  const [year, setYear] = useState(2026);

  const dateSource = dateTimeSources[0];      // CustomDatePicker
  const rangeSource = dateTimeSources[1];     // CustomDateRangePicker
  const timeSource = dateTimeSources[2];      // CustomTimePicker

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/90 dark:border-[#27272a] p-6 rounded-2xl shadow-sm space-y-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon size={18} className="text-blue-600 dark:text-blue-400" />
            <span>Bộ Chọn Ngày, Khoảng Ngày & Giờ (DatePicker, DateRangePicker & TimePicker)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bộ chọn thời gian nâng cao theo AGENTS.md Rule 2.4 & Rule 6: Không dùng input native OS, hỗ trợ chọn khoảng ngày có hiệu ứng ruy băng trượt (hover ribbon connectors) và con lăn giờ 24h.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onViewCode(rangeSource)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer border-0 shadow-2xs"
          >
            <Code2 size={13} />
            <span>Mã Nguồn (CustomDateRangePicker.tsx)</span>
          </button>
        </div>
      </div>

      {/* Grid of Date, Range, Time and Month Picker */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Custom Date Range Picker */}
        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <CalendarRange size={14} className="text-blue-600" />
              <span>1. Range Picker</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(rangeSource.usageCode);
                showToast('Đã chép ví dụ sử dụng CustomDateRangePicker!', 'success');
              }}
              className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
            >
              Chép cách dùng
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 block">Chọn khoảng ngày (Hiệu ứng hover ruy băng):</label>
            <CustomDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Chọn khoảng ngày..."
            />
          </div>

          <div className="p-2.5 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Khoảng ngày: <span className="font-bold text-blue-600">{dateRange ? `${dateRange.startStr} → ${dateRange.endStr}` : 'Chưa chọn'}</span>
          </div>
        </div>

        {/* 2. Custom Date Picker */}
        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              2. Single DatePicker
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(dateSource.usageCode);
                  showToast('Đã chép ví dụ sử dụng CustomDatePicker!', 'success');
                }}
                className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Chép cách dùng
              </button>
              <button
                type="button"
                onClick={() => onViewCode(dateSource)}
                className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Mã nguồn
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 block">Chọn ngày học (Có hover glow):</label>
            <CustomDatePicker
              value={date}
              onChange={setDate}
              placeholder="Chọn ngày học..."
              highlightDaysOfWeek={[1, 3, 5]}
            />
          </div>

          <div className="p-2.5 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Ngày đã chọn: <span className="font-bold text-blue-600">{date}</span>
          </div>
        </div>

        {/* 3. Custom Time Picker */}
        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              3. CustomTimePicker
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(timeSource.usageCode);
                  showToast('Đã chép ví dụ sử dụng CustomTimePicker!', 'success');
                }}
                className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Chép cách dùng
              </button>
              <button
                type="button"
                onClick={() => onViewCode(timeSource)}
                className="text-xs font-bold text-blue-600 hover:underline border-0 bg-transparent cursor-pointer"
              >
                Mã nguồn
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 block">Chọn giờ học (Con lăn 24h & AM/PM):</label>
            <CustomTimePicker
              value={time}
              onChange={setTime}
              placeholder="06:00 PM"
            />
          </div>

          <div className="p-2.5 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Giờ 24h: <span className="font-bold text-blue-600">{time}</span>
          </div>
        </div>

        {/* 4. Month Grid Picker */}
        <div className="p-5 bg-slate-50 dark:bg-[#0c0f1e] rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              4. MonthGridPicker
            </h4>
            <span className="text-[11px] font-mono text-slate-400">12 Tháng / Năm</span>
          </div>

          <div>
            <MonthGridPicker
              currentYear={year}
              currentMonth={10}
              value={month}
              onSelectMonth={(m) => {
                setMonth(m);
                showToast(`Đã chọn tháng: ${m}`, 'info');
              }}
              onPrevYear={() => setYear((y) => y - 1)}
              onNextYear={() => setYear((y) => y + 1)}
            />
          </div>

          <div className="p-2.5 bg-white dark:bg-white/5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300">
            Tháng đã chọn: <span className="font-bold text-blue-600">{month}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
