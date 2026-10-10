import React from 'react';
import { RotateCcw } from 'lucide-react';
import { WeekInfo } from './scheduleDatePickerHelper';

interface ScheduleDatePickerPresetsProps {
  scope: 'all' | 'week';
  mo1: number;
  mo2: number;
  weeks: WeekInfo[];
  activeStarts: string[];
  isTwoMonthsSelected: boolean;
  onSelectAllMonth1: () => void;
  onSelectTwoMonths: () => void;
  onToggleWeek: (w: WeekInfo, e?: React.MouseEvent) => void;
  onDoubleClickWeek: (w: WeekInfo) => void;
  onReset: () => void;
  onJumpToday: () => void;
  onApply: () => void;
}

export const ScheduleDatePickerPresets: React.FC<ScheduleDatePickerPresetsProps> = ({
  scope,
  mo1,
  mo2,
  weeks,
  activeStarts,
  isTwoMonthsSelected,
  onSelectAllMonth1,
  onSelectTwoMonths,
  onToggleWeek,
  onDoubleClickWeek,
  onReset,
  onJumpToday,
  onApply,
}) => {
  return (
    <div className="w-full sm:w-52 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 p-3 bg-slate-50/80 dark:bg-[#0d1222] shrink-0 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1.5 py-0.5">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Khoảng thời gian
          </span>
          {scope === 'week' && activeStarts.length > 1 && (
            <span className="text-[10px] font-bold text-blue-500">
              {activeStarts.length} tuần
            </span>
          )}
        </div>

        {/* Cả tháng 1 */}
        <button
          type="button"
          onClick={onSelectAllMonth1}
          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-between cursor-pointer border-0 ${
            scope === 'all' && !isTwoMonthsSelected
              ? 'bg-blue-600 dark:bg-[#5c36f5] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10'
          }`}
        >
          <span>Tháng {mo1}</span>
        </button>

        {/* Cả 2 tháng */}
        <button
          type="button"
          onClick={onSelectTwoMonths}
          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center justify-between cursor-pointer border-0 ${
            scope === 'all' && isTwoMonthsSelected
              ? 'bg-blue-600 dark:bg-[#5c36f5] text-white shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10'
          }`}
        >
          <span>Tháng {mo1} &amp; {mo2} (2 tháng)</span>
        </button>

        <div className="my-1.5 border-t border-slate-200 dark:border-white/10" />

        {/* Week Items */}
        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5">
          {weeks.map((w) => {
            const isSelected = scope === 'week' && activeStarts.includes(w.startStr);

            return (
              <button
                key={w.index}
                type="button"
                onClick={(e) => onToggleWeek(w, e)}
                onDoubleClick={() => onDoubleClickWeek(w)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition flex flex-col gap-0.5 cursor-pointer border-0 ${
                  isSelected
                    ? 'bg-blue-600 dark:bg-[#5c36f5] text-white font-extrabold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 font-bold'
                }`}
                title="Bấm để chọn/bỏ chọn tuần. Nhấp đúp để chọn riêng tuần này và đóng."
              >
                <div className="flex items-center justify-between w-full">
                  <span>Tuần {w.index}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {w.rangeLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-2.5 border-t border-slate-200 dark:border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition flex items-center gap-1 cursor-pointer border-0 bg-transparent py-0.5"
          >
            <RotateCcw size={11} />
            <span>Đặt lại</span>
          </button>
          <button
            type="button"
            onClick={onJumpToday}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition cursor-pointer border-0 bg-transparent py-0.5"
          >
            Hôm nay
          </button>
        </div>

        <button
          type="button"
          onClick={onApply}
          className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 dark:bg-[#5c36f5] dark:hover:bg-[#6b47ff] text-white text-xs font-bold transition cursor-pointer border-0 shadow-xs"
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
};
