import React from 'react';

interface KPICardsProps {
  stats: {
    c1: string | number;
    c2: string | number;
    hw: string | number;
    mockTest?: string | number;
    overall: string | number;
    attendancePct: number;
    sessionCount: number;
    c1Diff: string;
    c2Diff: string;
    hwDiff: string;
    mockTestDiff?: string;
    overallDiff: string;
    rank: string;
    level: string;
  };
  engine: any;
  hasSelectedStudent: boolean;
}

export const KPICards: React.FC<KPICardsProps> = React.memo(({ stats }) => {
  const hasMockTest = stats.mockTest !== undefined && stats.mockTest !== null && stats.mockTest !== '-';

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${hasMockTest ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-2.5 sm:gap-4 select-none`}>
      {/* 1. TỪ VỰNG */}
      <div className="kpi-card-blue p-3 sm:p-5 flex flex-col justify-between transition-all duration-200 min-h-[80px] sm:min-h-[105px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-1 truncate">
            TỪ VỰNG
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.c1}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-400 truncate">
          <span>{stats.c1Diff} so với kỳ trước</span>
        </div>
      </div>

      {/* 2. NGỮ PHÁP */}
      <div className="kpi-card-cyan p-3 sm:p-5 flex flex-col justify-between transition-all duration-200 min-h-[80px] sm:min-h-[105px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400 block mb-1 truncate">
            NGỮ PHÁP
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.c2}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-cyan-700 dark:text-cyan-400 truncate">
          <span>{stats.c2Diff} so với kỳ trước</span>
        </div>
      </div>

      {/* 3. BTVN */}
      <div className="kpi-card-green p-3 sm:p-5 flex flex-col justify-between transition-all duration-200 min-h-[80px] sm:min-h-[105px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1 truncate">
            BTVN
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.hw}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 truncate">
          <span>{stats.hwDiff} so với kỳ trước</span>
        </div>
      </div>

      {/* 4. LUYỆN ĐỀ */}
      {hasMockTest && (
        <div className="kpi-card-blue p-3 sm:p-5 flex flex-col justify-between transition-all duration-200 min-h-[80px] sm:min-h-[105px]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1 truncate">
              LUYỆN ĐỀ
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.mockTest}</span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold font-mono">/ 10</span>
            </div>
          </div>
          <div className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">
            <span>{stats.mockTestDiff || '+0.0'} so với kỳ trước</span>
          </div>
        </div>
      )}

      {/* 5. TỔNG ĐIỂM */}
      <div className="kpi-card-amber p-3 sm:p-5 flex flex-col justify-between transition-all duration-200 min-h-[80px] sm:min-h-[105px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1 truncate">
            TỔNG ĐIỂM
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{stats.overall}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">
          <span>{stats.overallDiff} so với kỳ trước</span>
        </div>
      </div>
    </div>
  );
});
