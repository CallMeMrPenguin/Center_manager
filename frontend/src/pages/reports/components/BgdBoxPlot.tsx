import React from 'react';
import { BgdDistributionStats } from '../utils/bgdAnalytics';
import { format1Dec } from '../../../utils';

interface BgdBoxPlotProps {
  stats: BgdDistributionStats;
}

export const BgdBoxPlot: React.FC<BgdBoxPlotProps> = ({ stats }) => {
  const minPct = Math.max(0, Math.min(100, (stats.min / 10) * 100));
  const maxPct = Math.max(0, Math.min(100, (stats.max / 10) * 100));
  const q1Pct = Math.max(0, Math.min(100, (stats.q1 / 10) * 100));
  const q3Pct = Math.max(0, Math.min(100, (stats.q3 / 10) * 100));
  const medPct = Math.max(0, Math.min(100, (stats.median / 10) * 100));
  const iqrWidthPct = Math.max(2, q3Pct - q1Pct);

  return (
    <div className="rounded-xl bg-[#0a0d1a] border border-[#1c253d] p-4 flex flex-col gap-3.5 select-none">
      {/* 1. Header with Structured Badges (No Pipe / Bullet text) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
            BIỂU ĐỒ HỘP & TỨ PHÂN VỊ (BOX PLOT)
          </span>
        </div>

        {/* 5 Key Percentile Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="bg-[#12182b] border border-[#232f52] px-2 py-0.5 rounded text-slate-300">
            Min: <strong className="text-rose-400 font-bold">{format1Dec(stats.min)}đ</strong>
          </span>
          <span className="bg-[#12182b] border border-[#232f52] px-2 py-0.5 rounded text-slate-300">
            Q1 (25%): <strong className="text-indigo-300 font-bold">{format1Dec(stats.q1)}đ</strong>
          </span>
          <span className="bg-[#12182b] border border-[#232f52] px-2 py-0.5 rounded text-slate-300">
            Trung Vị: <strong className="text-amber-400 font-bold">{format1Dec(stats.median)}đ</strong>
          </span>
          <span className="bg-[#12182b] border border-[#232f52] px-2 py-0.5 rounded text-slate-300">
            Q3 (75%): <strong className="text-cyan-300 font-bold">{format1Dec(stats.q3)}đ</strong>
          </span>
          <span className="bg-[#12182b] border border-[#232f52] px-2 py-0.5 rounded text-slate-300">
            Max: <strong className="text-emerald-400 font-bold">{format1Dec(stats.max)}đ</strong>
          </span>
        </div>
      </div>

      {/* 2. Graphical Box-and-Whisker Track */}
      <div className="relative w-full h-12 flex items-center px-6 my-1">
        {/* Baseline 0-10 Scale */}
        <div className="absolute left-6 right-6 h-1.5 bg-[#141c30] rounded-full" />

        {/* Whisker Line (Min to Max) */}
        <div
          className="absolute h-0.5 bg-indigo-400/70"
          style={{
            left: `calc(1.5rem + ${minPct}% * ((100% - 3rem) / 100))`,
            width: `calc(${Math.max(1, maxPct - minPct)}% * ((100% - 3rem) / 100))`,
          }}
        />

        {/* Min Whisker Cap */}
        <div
          className="absolute h-3.5 w-1 bg-rose-400 rounded-sm z-10"
          style={{
            left: `calc(1.5rem + ${minPct}% * ((100% - 3rem) / 100))`,
            transform: 'translateX(-50%)',
          }}
          title={`Min: ${format1Dec(stats.min)}đ`}
        />

        {/* Max Whisker Cap */}
        <div
          className="absolute h-3.5 w-1 bg-emerald-400 rounded-sm z-10"
          style={{
            left: `calc(1.5rem + ${maxPct}% * ((100% - 3rem) / 100))`,
            transform: 'translateX(-50%)',
          }}
          title={`Max: ${format1Dec(stats.max)}đ`}
        />

        {/* IQR Box (Q1 to Q3) */}
        <div
          className="absolute h-8 rounded-lg bg-gradient-to-r from-indigo-900/60 via-indigo-700/40 to-indigo-900/60 border border-indigo-400/80 shadow-[0_0_14px_rgba(99,102,241,0.35)] z-20 flex items-center justify-center overflow-hidden"
          style={{
            left: `calc(1.5rem + ${q1Pct}% * ((100% - 3rem) / 100))`,
            width: `calc(${iqrWidthPct}% * ((100% - 3rem) / 100))`,
          }}
          title={`Vùng 50% học sinh ở giữa: ${format1Dec(stats.q1)}đ - ${format1Dec(stats.q3)}đ (IQR: ${format1Dec(stats.iqr)}đ)`}
        >
          <span className="text-[10px] font-black text-indigo-200 font-mono whitespace-nowrap px-1">
            IQR: {format1Dec(stats.iqr)}đ
          </span>
        </div>

        {/* Median Vertical Line */}
        <div
          className="absolute h-10 w-1.5 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.9)] z-30 pointer-events-none"
          style={{
            left: `calc(1.5rem + ${medPct}% * ((100% - 3rem) / 100))`,
            transform: 'translateX(-50%)',
          }}
          title={`Trung Vị: ${format1Dec(stats.median)}đ`}
        />
      </div>

      {/* 3. Scale Ticks (0, 2, 4, 6, 8, 10) */}
      <div className="relative w-full flex justify-between px-6 text-[10px] font-mono text-slate-500 font-bold select-none">
        <span>0.0đ</span>
        <span>2.0đ</span>
        <span>4.0đ</span>
        <span>6.0đ</span>
        <span>8.0đ</span>
        <span>10.0đ</span>
      </div>
    </div>
  );
};
