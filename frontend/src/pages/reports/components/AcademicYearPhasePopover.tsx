import React, { useState, useMemo } from 'react';
import { Check, Settings2, X } from 'lucide-react';
import { getLocalDateStr } from '../../../utils';
import { formatSessionDate } from '../utils';
import {
  computeMonthWeeks,
  DateRangeSegment,
  getAdjacentMonth,
} from '../../schedule/components/scheduleDatePickerHelper';
import { ScheduleDatePickerMonth } from '../../schedule/components/ScheduleDatePickerMonth';
import { Button } from '../../../components/button';

interface AcademicYearPhasePopoverProps {
  effectiveYears: string[];
  selectedAcademicYear: string;
  setSelectedAcademicYear: (y: string) => void;
  combinedPhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  customRange?: { startStr: string; endStr: string } | null;
  setCustomRange?: (r: { startStr: string; endStr: string } | null) => void;
  onOpenPhaseModal?: () => void;
  setOpen: (o: boolean) => void;
}

export const AcademicYearPhasePopover: React.FC<AcademicYearPhasePopoverProps> = ({
  effectiveYears,
  selectedAcademicYear,
  setSelectedAcademicYear,
  combinedPhases,
  selectedPhaseId,
  setSelectedPhaseId,
  customRange,
  setCustomRange,
  onOpenPhaseModal,
  setOpen,
}) => {
  const today = useMemo(() => getLocalDateStr(), []);

  // Calendar year and month for the embedded ScheduleDatePickerMonth
  const [calYear, setCalYear] = useState<number>(() => {
    if (customRange?.startStr) {
      return parseInt(customRange.startStr.split('-')[0], 10) || 2026;
    }
    const startYear = parseInt((selectedAcademicYear || '2026-2027').split('-')[0], 10) || 2026;
    return startYear;
  });

  const [calMonth, setCalMonth] = useState<number>(() => {
    if (customRange?.startStr) {
      return parseInt(customRange.startStr.split('-')[1], 10) || 9;
    }
    return 9;
  });

  // Range picking states matching ScheduleDatePicker
  const [pickingStart, setPickingStart] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [activeHoverDay, setActiveHoverDay] = useState<string | null>(null);

  const weeks = useMemo(
    () => computeMonthWeeks(calYear, calMonth, today),
    [calYear, calMonth, today]
  );

  const segments = useMemo<DateRangeSegment[]>(() => {
    if (pickingStart && hoverDate) {
      const minStr = pickingStart <= hoverDate ? pickingStart : hoverDate;
      const maxStr = pickingStart <= hoverDate ? hoverDate : pickingStart;
      return [{ startStr: minStr, endStr: maxStr }];
    }
    if (pickingStart) {
      return [{ startStr: pickingStart, endStr: pickingStart }];
    }
    if (customRange) {
      return [{ startStr: customRange.startStr, endStr: customRange.endStr }];
    }
    return [];
  }, [pickingStart, hoverDate, customRange]);

  const handleDayClick = (dateStr: string) => {
    if (!pickingStart) {
      setPickingStart(dateStr);
      setHoverDate(null);
    } else {
      const minStr = dateStr <= pickingStart ? dateStr : pickingStart;
      const maxStr = dateStr <= pickingStart ? pickingStart : dateStr;
      setPickingStart(null);
      setHoverDate(null);
      if (setCustomRange) {
        setCustomRange({ startStr: minStr, endStr: maxStr });
      }
      setSelectedPhaseId('');
      setOpen(false);
    }
  };

  const handleDayHover = (dateStr: string) => {
    setActiveHoverDay(dateStr);
    if (pickingStart) {
      setHoverDate(dateStr);
    }
  };

  const changeCalMonth = (delta: number) => {
    const adj = getAdjacentMonth(calYear, calMonth, delta);
    setCalYear(adj.yr);
    setCalMonth(adj.mo);
  };

  const handleClearCustomRange = () => {
    setPickingStart(null);
    setHoverDate(null);
    if (setCustomRange) setCustomRange(null);
    setSelectedPhaseId('');
  };

  return (
    <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 z-50 bg-white dark:bg-[#141926] rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.9)] border-0 p-3 select-none animate-mac-dropdown max-w-[95vw] overflow-x-auto">
      <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/10 gap-3">
        {/* 1. CỘT NĂM HỌC */}
        <div className="w-full sm:w-28 shrink-0 space-y-1.5 pr-0 sm:pr-1">
          <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1 pb-0.5">
            Năm học
          </div>
          <div className="space-y-1 max-h-68 overflow-y-auto pr-0.5 scrollbar-thin">
            {effectiveYears.map((year) => {
              const isSelected = selectedAcademicYear.replace('–', '-') === year;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setSelectedAcademicYear(year);
                    setSelectedPhaseId('');
                    if (setCustomRange) setCustomRange(null);
                    const [sy] = year.split('-').map(Number);
                    if (sy) {
                      setCalYear(sy);
                      setCalMonth(9);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-black shadow-[0_2px_6px_rgba(79,70,229,0.35)]'
                      : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate">{year}</span>
                  {isSelected && <Check size={13} className="text-white shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. CỘT GIAI ĐOẠN */}
        <div className="w-full sm:w-44 shrink-0 flex flex-col justify-between pt-2 sm:pt-0 px-0 sm:px-2">
          <div>
            <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1 pb-1">
              Giai đoạn
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-0.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  setSelectedPhaseId('');
                  if (setCustomRange) setCustomRange(null);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${
                  !selectedPhaseId && !customRange
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Cả năm</span>
                {!selectedPhaseId && !customRange && (
                  <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </button>

              {combinedPhases.map((phase) => {
                if (phase.id.startsWith('moet-full-')) return null;
                const isSelected = selectedPhaseId === String(phase.id) && !customRange;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId(String(phase.id));
                      if (setCustomRange) setCustomRange(null);
                      if (phase.from_date) {
                        const [py, pm] = phase.from_date.split('-').map(Number);
                        if (py && pm) {
                          setCalYear(py);
                          setCalMonth(pm);
                        }
                      }
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate mr-1">{phase.phase_name}</span>
                    {isSelected && (
                      <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {onOpenPhaseModal && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 mt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenPhaseModal();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition cursor-pointer border-0 bg-transparent"
              >
                <Settings2 size={12} />
                <span>Cấu hình giai đoạn</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. CỘT DATE PICKER NHƯ TRONG LỊCH HỌC */}
        <div className="w-full sm:w-68 shrink-0 pt-2 sm:pt-0 pl-0 sm:pl-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                Chọn ngày
              </span>
              {customRange && (
                <button
                  type="button"
                  onClick={handleClearCustomRange}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition cursor-pointer border-0 bg-transparent flex items-center gap-0.5"
                >
                  <X size={10} />
                  <span>Xóa</span>
                </button>
              )}
            </div>

            <div
              onMouseLeave={() => {
                setActiveHoverDay(null);
                if (!pickingStart) setHoverDate(null);
              }}
            >
              <ScheduleDatePickerMonth
                year={calYear}
                month={calMonth}
                weeks={weeks}
                segments={segments}
                isPicking={!!pickingStart}
                pickingStart={pickingStart}
                hoverDate={hoverDate}
                activeHoverDay={activeHoverDay}
                hoverLayoutId="report-datepicker-hover-pill"
                onDayClick={handleDayClick}
                onDayHover={handleDayHover}
                showPrev={true}
                showNext={true}
                onPrevMonth={() => changeCalMonth(-1)}
                onNextMonth={() => changeCalMonth(1)}
              />
            </div>
          </div>

          {customRange && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 px-1">
              <span>Đang chọn:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black">
                {formatSessionDate(customRange.startStr)} → {formatSessionDate(customRange.endStr)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicYearPhasePopover;
