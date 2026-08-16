import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Zap, Users } from 'lucide-react';
import { format1Dec } from '../../../utils';

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
}

export const KPICards: React.FC<KPICardsProps> = ({ stats, engine, hasSelectedStudent }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${hasSelectedStudent ? 'animate-cascade-2' : 'animate-cascade-1'}`}>
      {/* 1. ACADEMIC OVERALL SCORE CARD */}
      <div className="kpi-card-blue p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-1">
            Điểm Học Lực Tổng Hợp
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">{stats.overall}</h3>
            <span className={`text-xs font-mono font-black flex items-center gap-0.5 px-2 py-0.5 rounded-full ${stats.overallDiff.startsWith('+') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              stats.overallDiff.startsWith('-') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-slate-500/20 text-slate-300 border border-slate-500/30'
              }`}>
              {stats.overallDiff.startsWith('+') ? <TrendingUp size={11} /> : stats.overallDiff.startsWith('-') ? <TrendingDown size={11} /> : <Minus size={11} />}
              {stats.overallDiff}
            </span>
          </div>
        </div>
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>C1: <strong className="text-blue-300 font-bold">{stats.c1}</strong></span>
          <span>C2: <strong className="text-purple-300 font-bold">{stats.c2}</strong></span>
          <span>HW: <strong className="text-emerald-300 font-bold">{stats.hw}</strong></span>
        </div>
      </div>

      {/* 2. STABILITY & CONSISTENCY (SD) CARD */}
      <div className="kpi-card-purple p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
            Độ Ổn Định Phong Độ (SD)
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">σ = {engine.std_dev ?? 0.0}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${engine.consistency_label?.includes('Rất ổn định') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              engine.consistency_label?.includes('Biến động') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
              {engine.consistency_label ?? 'Ổn định'}
            </span>
          </div>
        </div>
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-purple-400" /> Chỉ số tin cậy</span>
          <span className="font-mono font-bold text-purple-300">{engine.consistency_score ?? 90}%</span>
        </div>
      </div>

      {/* 3. ATTENDANCE RATE CARD */}
      <div className="kpi-card-green p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
            Tỷ Lệ Chuyên Cần
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">{stats.attendancePct}%</h3>
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {stats.sessionCount} Buổi
            </span>
          </div>
        </div>
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Users size={12} className="text-emerald-400" /> Điểm danh đầy đủ</span>
          <span className="font-mono font-bold text-emerald-300">{stats.attendancePct >= 90 ? 'Tốt' : 'Cần lưu ý'}</span>
        </div>
      </div>

      {/* 4. GROWTH RATE & PERFORMANCE INDEX CARD */}
      <div className="kpi-card-amber p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 min-h-[100px]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
            Đà Tăng Trưởng (Trend)
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-3xl font-black text-white font-mono tracking-tight">
              {Number(engine.trend_slope || 0) > 0 ? `+${format1Dec(Number(engine.trend_slope))}` : format1Dec(Number(engine.trend_slope || 0))}/b
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${engine.trend_label?.includes('Tăng') || engine.trend_label?.includes('cải thiện') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              engine.trend_label?.includes('Giảm') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-slate-500/20 text-slate-300 border border-slate-500/30'
              }`}>
              {engine.trend_label ?? 'Ổn định'}
            </span>
          </div>
        </div>
        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Zap size={12} className="text-amber-400" /> Chỉ số PI</span>
          <span className="font-mono font-bold text-amber-300">{engine.performance_index ?? stats.overall}</span>
        </div>
      </div>
    </div>
  );
};
