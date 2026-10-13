import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, Check, Settings2 } from 'lucide-react';
import { formatSessionDate } from '../utils';

interface AcademicYearPhaseSelectProps {
  selectedAcademicYear: string;
  setSelectedAcademicYear: (y: string) => void;
  academicYears: string[];
  timePhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
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
  onOpenPhaseModal,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const activePhase = useMemo(
    () => timePhases.find((p) => String(p.id) === String(selectedPhaseId)),
    [timePhases, selectedPhaseId]
  );

  const triggerLabel = useMemo(() => {
    if (activePhase) {
      return `${selectedAcademicYear} · ${activePhase.phase_name}`;
    }
    return `Năm học ${selectedAcademicYear}`;
  }, [selectedAcademicYear, activePhase]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#141417] dark:hover:bg-[#1c1c21] text-slate-900 dark:text-white text-xs font-bold transition-all cursor-pointer border-0 shadow-2xs hover:shadow-xs active:scale-[0.98] outline-none shrink-0"
        title="Chọn năm học và giai đoạn học tập"
      >
        <Calendar size={14} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
        <span className="whitespace-nowrap font-extrabold max-w-[190px] sm:max-w-[240px] truncate">
          {triggerLabel}
        </span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Integrated Popover Card */}
      {open && (
        <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 z-50 w-72 sm:w-80 bg-white dark:bg-[#141926] rounded-2xl shadow-xl border-0 p-2.5 space-y-2.5 animate-mac-dropdown select-none">
          {/* 1. Academic Year Switcher */}
          {academicYears.length > 1 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1">
                Năm học
              </span>
              <div className="flex flex-wrap gap-1">
                {academicYears.map((year) => {
                  const isSelected = selectedAcademicYear === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setSelectedAcademicYear(year);
                        setSelectedPhaseId('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border-0 shadow-2xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-extrabold'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Phases of this Academic Year */}
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1">
              Giai đoạn học tập
            </span>

            {/* Whole Year / All Phases Option */}
            <button
              type="button"
              onClick={() => {
                setSelectedPhaseId('');
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-bold transition cursor-pointer border-0 shadow-2xs ${
                !selectedPhaseId
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>Cả năm học (Tất cả giai đoạn)</span>
              {!selectedPhaseId && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
            </button>

            {/* Phase Items List */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
              {timePhases.map((phase) => {
                const isSelected = selectedPhaseId === String(phase.id);
                const from = phase.start_date || phase.from_date;
                const to = phase.end_date || phase.to_date;

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => {
                      setSelectedPhaseId(String(phase.id));
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-bold transition cursor-pointer border-0 shadow-2xs ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col text-left truncate mr-2">
                      <span className="font-extrabold truncate">{phase.phase_name}</span>
                      {from && to && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {formatSessionDate(from)} - {formatSessionDate(to)}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Manage Phases Modal Trigger */}
          {onOpenPhaseModal && (
            <div className="pt-1.5 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenPhaseModal();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition cursor-pointer border-0 bg-transparent"
              >
                <Settings2 size={12} />
                <span>Cấu hình & tạo giai đoạn mới</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicYearPhaseSelect;
