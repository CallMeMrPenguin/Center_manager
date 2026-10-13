import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, Check, Settings2, CalendarRange, X } from 'lucide-react';
import { Button } from '../../../components/button';
import { CustomDatePicker } from '../../../components/datepicker';
import { formatSessionDate } from '../utils';

interface AcademicYearPhaseSelectProps {
  selectedAcademicYear: string;
  setSelectedAcademicYear: (y: string) => void;
  academicYears: string[];
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  customRange?: { startStr: string; endStr: string } | null;
  setCustomRange?: (r: { startStr: string; endStr: string } | null) => void;
  onOpenPhaseModal?: () => void;
  className?: string;
}

export const AcademicYearPhaseSelect: React.FC<AcademicYearPhaseSelectProps> = ({
  selectedAcademicYear,
  setSelectedAcademicYear,
  academicYears,
  timePhases = [],
  selectedPhaseId,
  setSelectedPhaseId,
  customRange,
  setCustomRange,
  onOpenPhaseModal,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary local state for custom date range picking
  const [tempStart, setTempStart] = useState<string>(customRange?.startStr || '');
  const [tempEnd, setTempEnd] = useState<string>(customRange?.endStr || '');
  const [showDatePicker, setShowDatePicker] = useState(Boolean(customRange));

  useEffect(() => {
    if (customRange) {
      setTempStart(customRange.startStr);
      setTempEnd(customRange.endStr);
      setShowDatePicker(true);
    }
  }, [customRange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Ensure an intuitive list of academic years is always available for the left column
  const effectiveYears = useMemo(() => {
    const list: string[] = [];
    const addYear = (y: string) => {
      if (!y) return;
      const clean = y.replace('–', '-').trim();
      if (!list.includes(clean)) list.push(clean);
    };

    (academicYears || []).forEach(addYear);
    addYear(selectedAcademicYear);

    const baseYear = parseInt((selectedAcademicYear || '2026-2027').split('-')[0], 10) || 2026;
    for (let dy = -1; dy <= 1; dy++) {
      addYear(`${baseYear + dy}-${baseYear + dy + 1}`);
    }

    return list.sort().reverse();
  }, [academicYears, selectedAcademicYear]);

  const activePhase = useMemo(
    () => timePhases.find((p) => String(p.id) === String(selectedPhaseId)),
    [timePhases, selectedPhaseId]
  );

  const triggerLabel = useMemo(() => {
    if (customRange) {
      return `${selectedAcademicYear} · ${formatSessionDate(customRange.startStr)} - ${formatSessionDate(customRange.endStr)}`;
    }
    if (activePhase) {
      return `${selectedAcademicYear} · ${activePhase.phase_name}`;
    }
    return `Năm học ${selectedAcademicYear}`;
  }, [selectedAcademicYear, activePhase, customRange]);

  const handleApplyCustomDates = () => {
    if (tempStart && tempEnd && setCustomRange) {
      const minStr = tempStart <= tempEnd ? tempStart : tempEnd;
      const maxStr = tempStart <= tempEnd ? tempEnd : tempStart;
      setCustomRange({ startStr: minStr, endStr: maxStr });
      setSelectedPhaseId('');
      setOpen(false);
    }
  };

  const handleClearCustomDates = () => {
    setTempStart('');
    setTempEnd('');
    if (setCustomRange) {
      setCustomRange(null);
    }
    setShowDatePicker(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON (Standard Button with neutral shadow and borderless design) */}
      <Button
        variant="white"
        size="sm"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        leftIcon={<Calendar size={14} className="text-indigo-500 dark:text-indigo-400 shrink-0" />}
        rightIcon={
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        }
        title="Chọn năm học và giai đoạn học tập"
        className="shrink-0"
      >
        <span className="whitespace-nowrap font-extrabold max-w-[210px] truncate">{triggerLabel}</span>
      </Button>

      {/* 2-COLUMN SPLIT POPOVER CARD: 1 BÊN NĂM HỌC · 1 BÊN GIAI ĐOẠN & DATEPICKER */}
      {open && (
        <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 z-50 w-[360px] sm:w-[420px] bg-white dark:bg-[#141926] rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.85)] border-0 p-3 select-none animate-mac-dropdown">
          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-white/10 gap-x-3">
            {/* CỘT TRÁI: NĂM HỌC */}
            <div className="pr-1.5 space-y-1">
              <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1 pb-1">
                Năm học
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
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
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-2xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-black'
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

            {/* CỘT PHẢI: GIAI ĐOẠN & DATEPICKER */}
            <div className="pl-1.5 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1 pb-1 flex items-center justify-between">
                  <span>Giai đoạn</span>
                  {customRange && (
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold">Tùy chọn</span>
                  )}
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
                  {/* Option Cả năm */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId('');
                      if (setCustomRange) setCustomRange(null);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-2xs ${
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

                  {/* List Giai đoạn */}
                  {timePhases.map((phase) => {
                    const isSelected = selectedPhaseId === String(phase.id) && !customRange;
                    return (
                      <button
                        key={phase.id}
                        type="button"
                        onClick={() => {
                          setSelectedPhaseId(String(phase.id));
                          if (setCustomRange) setCustomRange(null);
                          setOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-2xs ${
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

                {/* DATEPICKER CHO GIAI ĐOẠN HỌC TẬP */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center gap-1">
                      <CalendarRange size={11} className="text-indigo-500" />
                      <span>Chọn ngày</span>
                    </span>
                    {customRange && (
                      <button
                        type="button"
                        onClick={handleClearCustomDates}
                        className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition cursor-pointer border-0 bg-transparent"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <CustomDatePicker
                      value={tempStart}
                      onChange={(d) => setTempStart(d)}
                      placeholder="Từ ngày"
                      className="w-full text-xs"
                    />
                    <CustomDatePicker
                      value={tempEnd}
                      onChange={(d) => setTempEnd(d)}
                      placeholder="Đến ngày"
                      className="w-full text-xs"
                    />
                  </div>

                  {tempStart && tempEnd && (
                    <Button
                      variant="primary"
                      size="xs"
                      type="button"
                      onClick={handleApplyCustomDates}
                      className="w-full font-black mt-1"
                    >
                      Áp Dụng Khoảng Ngày
                    </Button>
                  )}
                </div>
              </div>

              {/* Chân cột: Nút Cấu hình giai đoạn */}
              {onOpenPhaseModal && (
                <div className="pt-1.5 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenPhaseModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition cursor-pointer border-0 bg-transparent"
                  >
                    <Settings2 size={12} />
                    <span>Cấu hình & tạo mới</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYearPhaseSelect;
