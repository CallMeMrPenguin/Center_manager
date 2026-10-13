import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/button';
import { getLocalDateStr } from '../../../utils';
import { formatSessionDate } from '../utils';
import {
  WeekInfo,
  computeMonthWeeks,
  getAdjacentMonth,
  DateRangeSegment,
} from '../../schedule/components/scheduleDatePickerHelper';
import { ScheduleDatePickerMonth } from '../../schedule/components/ScheduleDatePickerMonth';

interface ChartDateRangePickerProps {
  timeView: '1m' | '2m' | '3m' | 'all';
  setTimeView: (v: '1m' | '2m' | '3m' | 'all') => void;
  customRange?: { startStr: string; endStr: string } | null;
  setCustomRange?: (r: { startStr: string; endStr: string } | null) => void;
  className?: string;
}

export const ChartDateRangePicker: React.FC<ChartDateRangePickerProps> = ({
  timeView,
  setTimeView,
  customRange: customRangeProp,
  setCustomRange: setCustomRangeProp,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Range picking & hover states on calendar
  const [pickingStart, setPickingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [activeHoverDay, setActiveHoverDay] = useState<string | null>(null);
  const [internalCustomRange, setInternalCustomRange] = useState<{ startStr: string; endStr: string } | null>(null);
  const customRange = customRangeProp !== undefined ? customRangeProp : internalCustomRange;

  const updateCustomRange = (r: { startStr: string; endStr: string } | null) => {
    if (setCustomRangeProp) {
      setCustomRangeProp(r);
    } else {
      setInternalCustomRange(r);
    }
  };

  const todayStr = useMemo(() => getLocalDateStr(), []);
  const [activeMonthStr, setActiveMonthStr] = useState<string>(() => todayStr.slice(0, 7));

  const [yr, mo] = useMemo(() => {
    const parts = (activeMonthStr || todayStr.slice(0, 7)).split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 10];
  }, [activeMonthStr, todayStr]);

  const { yr: yr2, mo: mo2 } = useMemo(() => {
    return getAdjacentMonth(yr, mo, 1);
  }, [yr, mo]);

  const weeks1 = useMemo<WeekInfo[]>(() => computeMonthWeeks(yr, mo, todayStr), [yr, mo, todayStr]);
  const weeks2 = useMemo<WeekInfo[]>(() => computeMonthWeeks(yr2, mo2, todayStr), [yr2, mo2, todayStr]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPickingStart(null);
        setHoverDate(null);
        setActiveHoverDay(null);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Compute segments to highlight on calendar
  const segments = useMemo<DateRangeSegment[]>(() => {
    if (pickingStart && hoverDate) {
      const sMin = pickingStart <= hoverDate ? pickingStart : hoverDate;
      const sMax = pickingStart <= hoverDate ? hoverDate : pickingStart;
      return [{ startStr: sMin, endStr: sMax }];
    }
    if (customRange) {
      return [{ startStr: customRange.startStr, endStr: customRange.endStr }];
    }
    return [];
  }, [pickingStart, hoverDate, customRange]);

  const handleDayClick = (dateStr: string) => {
    if (!pickingStart) {
      setPickingStart(dateStr);
      setHoverDate(dateStr);
      updateCustomRange(null);
    } else {
      const minStr = pickingStart <= dateStr ? pickingStart : dateStr;
      const maxStr = pickingStart <= dateStr ? dateStr : pickingStart;
      updateCustomRange({ startStr: minStr, endStr: maxStr });
      setPickingStart(null);
      setHoverDate(null);
    }
  };

  const handleDayHover = (dateStr: string) => {
    setActiveHoverDay(dateStr);
    if (pickingStart) setHoverDate(dateStr);
  };

  const changeMonth = (delta: number) => {
    const nextMo = getAdjacentMonth(yr, mo, delta);
    setActiveMonthStr(nextMo.monthStr);
  };

  const handleSelectTimeView = (tv: '1m' | '2m' | '3m' | 'all') => {
    setTimeView(tv);
    updateCustomRange(null);
    setPickingStart(null);
    setHoverDate(null);
  };

  const handleReset = () => {
    setTimeView('all');
    updateCustomRange(null);
    setPickingStart(null);
    setHoverDate(null);
    setActiveHoverDay(null);
    setActiveMonthStr(todayStr.slice(0, 7));
    setOpen(false);
  };

  // Trigger label text
  const triggerLabel = useMemo(() => {
    if (customRange) {
      return `${formatSessionDate(customRange.startStr)} - ${formatSessionDate(customRange.endStr)}`;
    }
    if (timeView === '1m') return '1 Tháng';
    if (timeView === '2m') return '2 Tháng';
    if (timeView === '3m') return '3 Tháng';
    return 'Tất cả';
  }, [customRange, timeView]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <Button
        variant="white"
        size="sm"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        leftIcon={<Calendar size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />}
        rightIcon={
          <ChevronDown
            size={12}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        }
        title="Chọn khoảng thời gian xem tiến độ"
      >
        <span className="whitespace-nowrap font-extrabold">{triggerLabel}</span>
      </Button>

      {/* Popover Card */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#0c101d] rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.22)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.95)] max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden flex flex-col sm:flex-row select-none animate-mac-dropdown">
          {/* Calendar Section (Month 1 & Month 2 Side-by-Side) */}
          <div
            className="p-2.5 sm:p-3 flex flex-col md:flex-row gap-3.5 md:gap-4 shrink-0"
            onMouseLeave={() => {
              setActiveHoverDay(null);
              if (!pickingStart) setHoverDate(null);
            }}
          >
            {/* Month 1 */}
            <ScheduleDatePickerMonth
              year={yr}
              month={mo}
              weeks={weeks1}
              segments={segments}
              isPicking={!!pickingStart}
              pickingStart={pickingStart}
              hoverDate={hoverDate}
              activeHoverDay={activeHoverDay}
              hoverLayoutId="chart-datepicker-hover-pill"
              onDayClick={handleDayClick}
              onDayHover={handleDayHover}
              showPrev={true}
              showNext={false}
              onPrevMonth={() => changeMonth(-1)}
            />

            <div className="w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

            {/* Month 2 */}
            <ScheduleDatePickerMonth
              year={yr2}
              month={mo2}
              weeks={weeks2}
              segments={segments}
              isPicking={!!pickingStart}
              pickingStart={pickingStart}
              hoverDate={hoverDate}
              activeHoverDay={activeHoverDay}
              hoverLayoutId="chart-datepicker-hover-pill"
              onDayClick={handleDayClick}
              onDayHover={handleDayHover}
              showPrev={false}
              showNext={true}
              onNextMonth={() => changeMonth(1)}
            />
          </div>

          {/* Quick Presets Sidebar */}
          <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 p-2.5 bg-slate-50/80 dark:bg-[#0d1222] shrink-0 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1">
                Khoảng thời gian
              </span>
              <div className="grid grid-cols-2 gap-1">
                {(['1m', '2m', '3m', 'all'] as const).map((tv) => {
                  const label = tv === '1m' ? '1 Tháng' : tv === '2m' ? '2 Tháng' : tv === '3m' ? '3 Tháng' : 'Tất cả';
                  const isSelected = !customRange && timeView === tv;

                  return (
                    <button
                      key={tv}
                      type="button"
                      onClick={() => handleSelectTimeView(tv)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-bold transition text-center cursor-pointer border-0 shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 dark:bg-[#5c36f5] text-white font-extrabold shadow-xs'
                          : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {customRange && (
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                  <div>Đang chọn:</div>
                  <div className="font-extrabold">
                    {formatSessionDate(customRange.startStr)} - {formatSessionDate(customRange.endStr)}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition flex items-center gap-1 cursor-pointer border-0 bg-transparent py-0.5"
              >
                <RotateCcw size={11} />
                <span>Đặt lại</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs hover:shadow-xs transition cursor-pointer border-0"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartDateRangePicker;
