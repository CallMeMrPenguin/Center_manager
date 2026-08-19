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
  isTestMode?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = React.memo(({ stats, isTestMode }) => {
  const hasMockTest = stats.mockTest !== undefined && stats.mockTest !== null && stats.mockTest !== '-';

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 ${
        hasMockTest ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
      } bg-[#0c0f1e] border border-[#1e2746] rounded-xl text-center items-center relative shadow-md divide-y sm:divide-y-0 sm:divide-x divide-[#1e2746]`}
    >
      {/* 1. CHECK 1 TRUNG BÌNH */}
      <div className="relative p-3.5 sm:p-4 animate-cascade-1 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-1">
          {isTestMode ? 'TỪ VỰNG TRUNG BÌNH' : 'CHECK 1 TRUNG BÌNH'}
        </span>
        <div className="flex items-baseline gap-1 my-0.5">
          <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.c1}</span>
          <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
        </div>
        <span className="text-[10px] font-bold text-blue-400 block mt-1">
          {stats.c1Diff} so với kỳ trước
        </span>
      </div>

      {/* 2. CHECK 2 TRUNG BÌNH */}
      <div className="relative p-3.5 sm:p-4 animate-cascade-2 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
          {isTestMode ? 'NGỮ PHÁP TRUNG BÌNH' : 'CHECK 2 TRUNG BÌNH'}
        </span>
        <div className="flex items-baseline gap-1 my-0.5">
          <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.c2}</span>
          <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
        </div>
        <span className="text-[10px] font-bold text-purple-400 block mt-1">
          {stats.c2Diff} so với kỳ trước
        </span>
      </div>

      {/* 3. HOMEWORK TRUNG BÌNH */}
      <div className="relative p-3.5 sm:p-4 animate-cascade-3 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
          HOMEWORK TRUNG BÌNH
        </span>
        <div className="flex items-baseline gap-1 my-0.5">
          <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.hw}</span>
          <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-400 block mt-1">
          {stats.hwDiff} so với kỳ trước
        </span>
      </div>

      {/* 4. LUYỆN ĐỀ (GIỮA/CUỐI KỲ) */}
      {hasMockTest && (
        <div className="relative p-3.5 sm:p-4 animate-cascade-4 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
            LUYỆN ĐỀ (GIỮA / CUỐI KỲ)
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.mockTest}</span>
            <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
          </div>
          <span className="text-[10px] font-bold text-amber-400 block mt-1">
            {stats.mockTestDiff || '+0.0'} so với kỳ trước
          </span>
        </div>
      )}

      {/* 5. TỔNG ĐIỂM TRUNG BÌNH */}
      <div className={`relative p-3.5 sm:p-4 ${hasMockTest ? 'animate-cascade-5' : 'animate-cascade-4'} flex flex-col items-center justify-center`}>
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
          TỔNG ĐIỂM TRUNG BÌNH
        </span>
        <div className="flex items-baseline gap-1 my-0.5">
          <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{stats.overall}</span>
          <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400 block mt-1">
          {stats.overallDiff} so với kỳ trước
        </span>
      </div>
    </div>
  );
});
