import React from 'react';

interface KPICardsProps {
  stats: {
    c1: string | number;
    c2: string | number;
    hw: string | number;
    overall: string | number;
    attendancePct: number;
    sessionCount: number;
    c1Diff: string;
    c2Diff: string;
    hwDiff: string;
    overallDiff: string;
    rank: string;
    level: string;
  };
  engine: any;
  hasSelectedStudent: boolean;
  isTestMode?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, hasSelectedStudent, isTestMode }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${hasSelectedStudent ? 'animate-cascade-2' : 'animate-cascade-1'}`}>
      {/* 1. CHECK 1 TRUNG BÌNH */}
      <div className="kpi-card-blue p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-1">
            {isTestMode ? 'TỪ VỰNG TRUNG BÌNH' : 'CHECK 1 TRUNG BÌNH'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white font-mono">{stats.c1}</span>
            <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-bold text-blue-400">
          <span>{stats.c1Diff} so với kỳ trước</span>
        </div>
      </div>

      {/* 2. CHECK 2 TRUNG BÌNH */}
      <div className="kpi-card-purple p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
            {isTestMode ? 'NGỮ PHÁP TRUNG BÌNH' : 'CHECK 2 TRUNG BÌNH'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white font-mono">{stats.c2}</span>
            <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-bold text-purple-400">
          <span>{stats.c2Diff} so với kỳ trước</span>
        </div>
      </div>

      {/* 3. HOMEWORK TRUNG BÌNH */}
      <div className="kpi-card-green p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
            HOMEWORK TRUNG BÌNH
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white font-mono">{stats.hw}</span>
            <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-bold text-emerald-400">
          <span>{stats.hwDiff} so với kỳ trước</span>
        </div>
      </div>

      {/* 4. TỔNG ĐIỂM TRUNG BÌNH */}
      <div className="kpi-card-amber p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
            TỔNG ĐIỂM TRUNG BÌNH
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white font-mono">{stats.overall}</span>
            <span className="text-xs text-slate-400 font-bold font-mono">/ 10</span>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-bold text-amber-400">
          <span>{stats.overallDiff} so với kỳ trước</span>
        </div>
      </div>
    </div>
  );
};
