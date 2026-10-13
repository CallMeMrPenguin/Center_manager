import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/button';
import { formatSessionDate, getStandardMoetPhases } from '../utils';
import {
  AcademicYearPhasePopover,
  getMonthRange,
} from './AcademicYearPhasePopover';

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
  const [subTab, setSubTab] = useState<'phase' | 'month' | 'custom'>('phase');
  const containerRef = useRef<HTMLDivElement>(null);

  const [tempStart, setTempStart] = useState<string>(customRange?.startStr || '');
  const [tempEnd, setTempEnd] = useState<string>(customRange?.endStr || '');

  useEffect(() => {
    if (customRange) {
      setTempStart(customRange.startStr);
      setTempEnd(customRange.endStr);
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

  // Combined Standard MOET phases (HK I, HK II, sub-phases) + DB custom phases
  const combinedPhases = useMemo(() => {
    const defaultMoet = getStandardMoetPhases(selectedAcademicYear);
    const dbPhases = timePhases || [];
    const merged = defaultMoet.map((m) => {
      const dbMatch = dbPhases.find((p) => p.phase_name === m.phase_name);
      if (dbMatch) {
        return {
          ...m,
          db_id: dbMatch.id,
          from_date: dbMatch.from_date || m.from_date,
          to_date: dbMatch.to_date || m.to_date,
        };
      }
      return m;
    });

    dbPhases.forEach((dbp) => {
      if (!defaultMoet.some((m) => m.phase_name === dbp.phase_name)) {
        merged.push({
          id: String(dbp.id),
          db_id: dbp.id,
          phase_name: dbp.phase_name,
          from_date: dbp.from_date,
          to_date: dbp.to_date,
          is_standard: false,
        });
      }
    });

    return merged;
  }, [selectedAcademicYear, timePhases]);

  // Detect if customRange corresponds to a full calendar month
  const activeMonth = useMemo(() => {
    if (!customRange) return null;
    for (let m = 1; m <= 12; m++) {
      const range = getMonthRange(m, selectedAcademicYear);
      if (range.startStr === customRange.startStr && range.endStr === customRange.endStr) {
        return m;
      }
    }
    return null;
  }, [customRange, selectedAcademicYear]);

  const activePhase = useMemo(
    () => combinedPhases.find((p) => String(p.id) === String(selectedPhaseId)),
    [combinedPhases, selectedPhaseId]
  );

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

  const triggerLabel = useMemo(() => {
    if (activeMonth) {
      return `${selectedAcademicYear} · Tháng ${activeMonth}`;
    }
    if (customRange) {
      return `${selectedAcademicYear} · ${formatSessionDate(customRange.startStr)} - ${formatSessionDate(customRange.endStr)}`;
    }
    if (activePhase) {
      if (activePhase.id.startsWith('moet-full-')) {
        return `${selectedAcademicYear} · Cả năm`;
      }
      return `${selectedAcademicYear} · ${activePhase.phase_name}`;
    }
    return `${selectedAcademicYear} · Cả năm`;
  }, [selectedAcademicYear, activeMonth, customRange, activePhase]);

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
    if (setCustomRange) setCustomRange(null);
    setSelectedPhaseId('');
    setOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <Button
        variant="white"
        size="sm"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        leftIcon={<Calendar size={14} className="text-indigo-500 shrink-0" />}
        rightIcon={
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          />
        }
        title="Chọn năm học, giai đoạn (học kỳ), tháng hoặc khoảng ngày"
        className="shrink-0 shadow-xs hover:shadow-sm"
      >
        <span className="whitespace-nowrap font-extrabold max-w-[220px] truncate">{triggerLabel}</span>
      </Button>

      {/* 2-COLUMN SPLIT POPOVER CARD */}
      {open && (
        <AcademicYearPhasePopover
          effectiveYears={effectiveYears}
          selectedAcademicYear={selectedAcademicYear}
          setSelectedAcademicYear={setSelectedAcademicYear}
          subTab={subTab}
          setSubTab={setSubTab}
          combinedPhases={combinedPhases}
          selectedPhaseId={selectedPhaseId}
          setSelectedPhaseId={setSelectedPhaseId}
          customRange={customRange}
          setCustomRange={setCustomRange}
          activeMonth={activeMonth}
          tempStart={tempStart}
          setTempStart={setTempStart}
          tempEnd={tempEnd}
          setTempEnd={setTempEnd}
          handleApplyCustomDates={handleApplyCustomDates}
          handleClearCustomDates={handleClearCustomDates}
          onOpenPhaseModal={onOpenPhaseModal}
          setOpen={setOpen}
        />
      )}
    </div>
  );
};

export default AcademicYearPhaseSelect;
