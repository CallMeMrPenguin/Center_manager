import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from './datePickerUtils';

interface MonthGridPickerProps {
  currentYear: number;
  currentMonth: number;
  value: string;
  onSelectMonth: (monthStr: string) => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}

export const MonthGridPicker: React.FC<MonthGridPickerProps> = ({
  currentYear,
  value,
  onSelectMonth,
  onPrevYear,
  onNextYear,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-slate-300/60 dark:border-white/10">
        <span className="text-sm font-black text-slate-900 dark:text-white">Năm {currentYear}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevYear}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/10 transition cursor-pointer font-bold border-0"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={onNextYear}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-white/10 transition cursor-pointer font-bold border-0"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MONTH_NAMES.map((name, idx) => {
          const monthStr = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
          const isSelected = value.startsWith(monthStr);
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectMonth(monthStr)}
              className={`py-2.5 px-2 rounded-xl text-xs font-black transition cursor-pointer border-0 outline-none ${
                isSelected
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
