import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { trunc1Dec } from '../../../../utils';
import { useSessionOverview } from './useSessionOverview';
import { BelowThresholdCard, DivergenceCard } from './SessionOverviewCards';

interface SessionOverviewBannerProps {
  attendanceRecords: AttendanceRecord[];
  attendanceDate: string;
  onFilterStudent?: (studentName: string) => void;
}

export const SessionOverviewBanner: React.FC<SessionOverviewBannerProps> = ({
  attendanceRecords,
  attendanceDate,
  onFilterStudent,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    stats,
    belowAvgData,
    divergenceStudents,
    hasAlerts,
    divInput,
    handleDivChange,
    threshC1Input,
    threshC2Input,
    threshHwInput,
    handleC1Change,
    handleC2Change,
    handleHwChange,
  } = useSessionOverview(attendanceRecords);

  return (
    <div className="space-y-3">
      {/* 1. MASTER HEADER STRIP (Clean top bar directly on background) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 select-none">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wider uppercase">
              Tổng Quan Buổi Học
            </h3>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">({attendanceDate})</span>
            {hasAlerts ? (
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-amber-500 text-white shadow-2xs">
                {belowAvgData.belowC1.length +
                  belowAvgData.belowC2.length +
                  belowAvgData.belowHw.length +
                  divergenceStudents.length}{' '}
                Cảnh báo
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-emerald-500 text-white shadow-2xs flex items-center gap-1">
                <CheckCircle2 size={12} /> 100% Đạt Chuẩn
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: CLASS AVERAGE STATS & EXPAND TOGGLE */}
        <div className="flex items-center gap-2">
          {/* Average metrics pills */}
          <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-white/10 px-3.5 py-1.5 rounded-xl shadow-xs text-xs font-bold">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">TB Check 1:</span>
              <span className="text-blue-600 dark:text-blue-400 font-black font-mono">{trunc1Dec(stats.avgC1)}</span>
            </div>
            <span className="w-px h-3 bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">TB Check 2:</span>
              <span className="text-purple-600 dark:text-purple-400 font-black font-mono">{trunc1Dec(stats.avgC2)}</span>
            </div>
            <span className="w-px h-3 bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">TB BTVN:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">{trunc1Dec(stats.avgHw)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#121626] dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer border border-slate-200/80 dark:border-white/10 shadow-xs"
            title={isExpanded ? 'Thu gọn tổng quan' : 'Mở rộng tổng quan'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* 2. 4 CARDS GRID (Directly on background, no nested card) */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* CARD 1: CHECK 1 */}
          <BelowThresholdCard
            title="Check 1"
            theme="blue"
            threshInput={threshC1Input}
            onThreshChange={handleC1Change}
            students={belowAvgData.belowC1}
            onFilterStudent={onFilterStudent}
          />

          {/* CARD 2: CHECK 2 */}
          <BelowThresholdCard
            title="Check 2"
            theme="purple"
            threshInput={threshC2Input}
            onThreshChange={handleC2Change}
            students={belowAvgData.belowC2}
            onFilterStudent={onFilterStudent}
          />

          {/* CARD 3: BTVN */}
          <BelowThresholdCard
            title="BTVN"
            theme="emerald"
            threshInput={threshHwInput}
            onThreshChange={handleHwChange}
            students={belowAvgData.belowHw}
            onFilterStudent={onFilterStudent}
          />

          {/* CARD 4: CẢNH BÁO ĐỘ LỆCH */}
          <DivergenceCard
            threshInput={divInput}
            onThreshChange={handleDivChange}
            students={divergenceStudents}
            onFilterStudent={onFilterStudent}
          />
        </div>
      )}
    </div>
  );
};

