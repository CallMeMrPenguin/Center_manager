import React from 'react';
import { Check, Settings2 } from 'lucide-react';
import { Button } from '../../../components/button';
import { CustomDatePicker } from '../../../components/datepicker';

export const SCHOOL_YEAR_MONTHS = [
  { num: 9, label: 'Tháng 9' },
  { num: 10, label: 'Tháng 10' },
  { num: 11, label: 'Tháng 11' },
  { num: 12, label: 'Tháng 12' },
  { num: 1, label: 'Tháng 1' },
  { num: 2, label: 'Tháng 2' },
  { num: 3, label: 'Tháng 3' },
  { num: 4, label: 'Tháng 4' },
  { num: 5, label: 'Tháng 5' },
  { num: 6, label: 'Tháng 6' },
  { num: 7, label: 'Tháng 7' },
  { num: 8, label: 'Tháng 8' },
];

export const getMonthRange = (monthNum: number, academicYear: string) => {
  const parts = academicYear.split('-');
  const startYear = parseInt(parts[0], 10) || 2026;
  const endYear = parts.length > 1 ? parseInt(parts[1], 10) || startYear + 1 : startYear + 1;
  const year = monthNum >= 8 ? startYear : endYear;
  const mm = String(monthNum).padStart(2, '0');
  const lastDay = new Date(year, monthNum, 0).getDate();
  return {
    startStr: `${year}-${mm}-01`,
    endStr: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
};

interface AcademicYearPhasePopoverProps {
  effectiveYears: string[];
  selectedAcademicYear: string;
  setSelectedAcademicYear: (y: string) => void;
  subTab: 'phase' | 'month' | 'custom';
  setSubTab: (t: 'phase' | 'month' | 'custom') => void;
  combinedPhases: any[];
  selectedPhaseId: string;
  setSelectedPhaseId: (id: string) => void;
  customRange?: { startStr: string; endStr: string } | null;
  setCustomRange?: (r: { startStr: string; endStr: string } | null) => void;
  activeMonth: number | null;
  tempStart: string;
  setTempStart: (s: string) => void;
  tempEnd: string;
  setTempEnd: (s: string) => void;
  handleApplyCustomDates: () => void;
  handleClearCustomDates: () => void;
  onOpenPhaseModal?: () => void;
  setOpen: (o: boolean) => void;
}

export const AcademicYearPhasePopover: React.FC<AcademicYearPhasePopoverProps> = ({
  effectiveYears,
  selectedAcademicYear,
  setSelectedAcademicYear,
  subTab,
  setSubTab,
  combinedPhases,
  selectedPhaseId,
  setSelectedPhaseId,
  customRange,
  setCustomRange,
  activeMonth,
  tempStart,
  setTempStart,
  tempEnd,
  setTempEnd,
  handleApplyCustomDates,
  handleClearCustomDates,
  onOpenPhaseModal,
  setOpen,
}) => {
  return (
    <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 z-50 w-[380px] sm:w-[460px] bg-white dark:bg-[#141926] rounded-2xl shadow-xl dark:shadow-2xl border-0 p-3 select-none animate-mac-dropdown">
      <div className="grid grid-cols-[130px_1fr] divide-x divide-slate-100 dark:divide-white/10 gap-x-3">
        {/* CỘT TRÁI: NĂM HỌC */}
        <div className="pr-1.5 space-y-1">
          <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1 pb-1">
            Năm học
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
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

        {/* CỘT PHẢI: GIAI ĐOẠN / THÁNG / TÙY CHỌN */}
        <div className="pl-1.5 flex flex-col justify-between min-h-[260px]">
          <div>
            {/* 3 SUB-TABS */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-white/5 rounded-xl border-0 mb-2.5">
              <button
                type="button"
                onClick={() => setSubTab('phase')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition border-0 cursor-pointer ${
                  subTab === 'phase'
                    ? 'bg-white dark:bg-[#1f2538] text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Giai đoạn
              </button>
              <button
                type="button"
                onClick={() => setSubTab('month')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition border-0 cursor-pointer ${
                  subTab === 'month'
                    ? 'bg-white dark:bg-[#1f2538] text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tháng
              </button>
              <button
                type="button"
                onClick={() => setSubTab('custom')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition border-0 cursor-pointer ${
                  subTab === 'custom'
                    ? 'bg-white dark:bg-[#1f2538] text-indigo-600 dark:text-indigo-400 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tùy chọn
              </button>
            </div>

            {/* VIEW 1: GIAI ĐOẠN (HỌC KỲ I, HỌC KỲ II, CẢ NĂM, SUB-PHASES) */}
            {subTab === 'phase' && (
              <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
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
            )}

            {/* VIEW 2: THEO THÁNG (12 THÁNG TRONG NĂM HỌC) */}
            {subTab === 'month' && (
              <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                {SCHOOL_YEAR_MONTHS.map((m) => {
                  const isSelected = activeMonth === m.num;
                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => {
                        const range = getMonthRange(m.num, selectedAcademicYear);
                        if (setCustomRange) setCustomRange(range);
                        setSelectedPhaseId('');
                        setOpen(false);
                      }}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold transition cursor-pointer border-0 shadow-2xs text-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-black'
                          : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* VIEW 3: TÙY CHỌN KHOẢNG NGÀY */}
            {subTab === 'custom' && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">Từ ngày</div>
                    <CustomDatePicker
                      value={tempStart}
                      onChange={(d) => setTempStart(d)}
                      placeholder="Từ ngày"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">Đến ngày</div>
                    <CustomDatePicker
                      value={tempEnd}
                      onChange={(d) => setTempEnd(d)}
                      placeholder="Đến ngày"
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={handleApplyCustomDates}
                    disabled={!tempStart || !tempEnd}
                    className="flex-1 font-black shadow-xs hover:shadow-sm"
                  >
                    Áp dụng
                  </Button>
                  {(customRange || tempStart || tempEnd) && (
                    <Button
                      variant="secondary"
                      size="xs"
                      type="button"
                      onClick={handleClearCustomDates}
                      className="font-bold shadow-2xs hover:shadow-xs"
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chân cột: Nút Cấu hình giai đoạn */}
          {onOpenPhaseModal && (
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/10">
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
      </div>
    </div>
  );
};
