import React, { useState } from 'react';
import { BgdDistributionStats } from '../utils/bgdAnalytics';
import { BgdDetailedCommentaryCard } from './BgdDetailedCommentaryCard';
import { format1Dec } from '../../../utils';

interface BgdDistributionPlotProps {
  stats: BgdDistributionStats;
  selectedStudentId?: string;
  selectedClassId?: string;
  isTestMode?: boolean;
}

export const BgdDistributionPlot: React.FC<BgdDistributionPlotProps> = ({
  stats,
  selectedStudentId,
  selectedClassId,
  isTestMode,
}) => {
  const [hoveredBinScore, setHoveredBinScore] = useState<number | null>(null);

  const maxBinCount = Math.max(1, ...stats.scoreBins.map((b) => b.count));
  const hoveredBin = stats.scoreBins.find((b) => b.score === hoveredBinScore);

  return (
    <div className="flex flex-col gap-6 select-none animate-cascade-2">
      {/* 1. TOP SUMMARY BAR & EDUCATIONAL ZONES */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
            PHỔ ĐIỂM HỌC LỰC TOÀN DIỆN (CHUẨN BỘ GIÁO DỤC)
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            21 Thang Điểm (0.0 - 10.0)
          </span>
        </div>

        {/* 4 Academic Tier Badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            Yếu &lt;5.0 ({stats.bands[0].pct}%)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            TB 5.0-6.4 ({stats.bands[1].pct}%)
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            Khá 6.5-7.9 ({stats.bands[2].pct}%)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            Giỏi ≥8.0 ({stats.bands[3].pct}%)
          </span>
        </div>
      </div>

      {/* 2. DENSE HISTOGRAM SCORE DISTRIBUTION CANVAS */}
      <div className="relative rounded-2xl bg-[#080b14]/70 border border-[#182138] p-6 shadow-2xl flex flex-col gap-6">
        {/* SVG Plot Area */}
        <div className="w-full h-80 relative flex items-end gap-1 sm:gap-2 pt-10 pb-6 px-2 sm:px-4">
          {/* Horizontal Grid lines */}
          <div className="absolute inset-x-4 top-10 bottom-8 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-b border-white" />
          </div>

          {/* Dotted Lines for Mean & Median */}
          <div
            className="absolute top-6 bottom-8 w-0.5 border-l-2 border-dashed border-cyan-400/70 z-20 pointer-events-none"
            style={{ left: `calc(1rem + ${(stats.mean / 10) * 100}% * ((100% - 2rem) / 100))` }}
          >
            <span className="absolute -top-5 left-1 text-[10px] font-black text-cyan-400 font-mono whitespace-nowrap">
              Mean: {format1Dec(stats.mean)}
            </span>
          </div>

          <div
            className="absolute top-6 bottom-8 w-0.5 border-l-2 border-amber-400 z-20 pointer-events-none shadow-[0_0_10px_rgba(245,158,11,0.8)]"
            style={{ left: `calc(1rem + ${(stats.median / 10) * 100}% * ((100% - 2rem) / 100))` }}
          >
            <span className="absolute -top-5 right-1 text-[10px] font-black text-amber-400 font-mono whitespace-nowrap">
              Median: {format1Dec(stats.median)}
            </span>
          </div>

          {/* 21 Bars across 0.0 to 10.0 */}
          {stats.scoreBins.map((bin) => {
            const heightPct = bin.count > 0 ? Math.max(8, Math.round((bin.count / maxBinCount) * 85)) : 2;
            const isHovered = hoveredBinScore === bin.score;

            return (
              <div
                key={bin.score}
                onMouseEnter={() => setHoveredBinScore(bin.score)}
                onMouseLeave={() => setHoveredBinScore(null)}
                className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
              >
                {/* Floating Top Number on Hover or if active */}
                {bin.count > 0 && (
                  <div
                    className={`mb-1 flex flex-col items-center transition-all ${
                      isHovered ? 'scale-110 opacity-100' : 'opacity-70 group-hover:opacity-100'
                    }`}
                  >
                    <span className="text-[11px] font-black font-mono text-white">
                      {bin.count}
                    </span>
                  </div>
                )}

                {/* Vertical Bar */}
                <div className="w-full h-full flex items-end">
                  <div
                    className="w-full rounded-t-sm sm:rounded-t-md transition-all duration-300 ease-out relative overflow-hidden"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: bin.count > 0 ? bin.color : 'rgba(255,255,255,0.04)',
                      boxShadow: isHovered && bin.count > 0 ? `0 0 16px ${bin.color}` : 'none',
                      opacity: hoveredBinScore !== null && !isHovered ? 0.4 : 1,
                    }}
                  >
                    {bin.count > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
                    )}
                  </div>
                </div>

                {/* X-axis Tick Label (Shows on integers or highlighted) */}
                <span
                  className={`mt-2 text-[10px] font-mono block ${
                    Number.isInteger(bin.score)
                      ? 'font-bold text-slate-300'
                      : 'text-slate-600 hidden sm:block text-[9px]'
                  }`}
                >
                  {Number.isInteger(bin.score) ? bin.score : ''}
                </span>
              </div>
            );
          })}

          {/* Floating Hover Tooltip Card */}
          {hoveredBin && hoveredBin.count > 0 && (
            <div
              className="absolute z-30 pointer-events-none bg-[#12172b] border border-[#2c375e] p-2.5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs font-sans transition-all duration-75"
              style={{
                left: `calc(1rem + ${(hoveredBin.score / 10) * 100}% * ((100% - 2rem) / 100))`,
                top: '20px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="flex items-center gap-2 border-b border-white/10 pb-1 font-bold text-white">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredBin.color }} />
                <span>Mức điểm: {hoveredBin.label}</span>
              </div>
              <div className="pt-1 text-[11px] space-y-0.5 font-mono">
                <div className="text-slate-200">
                  Số học sinh: <strong className="text-white font-bold">{hoveredBin.count}</strong> em
                </div>
                <div style={{ color: hoveredBin.color }} className="font-bold">
                  Tỷ lệ: {hoveredBin.pct}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. SEAMLESS HORIZONTAL BOX PLOT (BIỂU ĐỒ HỘP BGD) */}
        <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-300">
            <span className="uppercase tracking-wider text-indigo-300">
              BIỂU ĐỒ HỘP & TỨ PHÂN VỊ (BOX PLOT SUMMARY)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Min: {format1Dec(stats.min)}đ - Q1: {format1Dec(stats.q1)}đ - Trung vị: {format1Dec(stats.median)}đ - Q3: {format1Dec(stats.q3)}đ - Max: {format1Dec(stats.max)}đ
            </span>
          </div>

          {/* Graphical Box-and-Whisker Track */}
          <div className="relative w-full h-8 flex items-center px-4 my-1">
            {/* Base axis line 0 - 10 */}
            <div className="absolute left-4 right-4 h-1 bg-[#1a233a] rounded-full" />

            {/* Whisker Line (Min to Max) */}
            <div
              className="absolute h-0.5 bg-indigo-400/60"
              style={{
                left: `calc(1rem + ${(stats.min / 10) * 100}% * ((100% - 2rem) / 100))`,
                width: `calc(${((stats.max - stats.min) / 10) * 100}% * ((100% - 2rem) / 100))`,
              }}
            />

            {/* IQR Box (Q1 to Q3) */}
            <div
              className="absolute h-6 rounded-lg bg-indigo-600/30 border border-indigo-400/80 shadow-[0_0_12px_rgba(99,102,241,0.3)] z-10 flex items-center justify-center"
              style={{
                left: `calc(1rem + ${(stats.q1 / 10) * 100}% * ((100% - 2rem) / 100))`,
                width: `calc(${((stats.q3 - stats.q1) / 10) * 100}% * ((100% - 2rem) / 100))`,
              }}
            >
              <span className="text-[10px] font-black text-indigo-200 font-mono">
                IQR: {format1Dec(stats.iqr)}đ (50% lớp)
              </span>
            </div>

            {/* Median Mark (Center Line) */}
            <div
              className="absolute h-8 w-1 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.9)] z-20"
              style={{
                left: `calc(1rem + ${(stats.median / 10) * 100}% * ((100% - 2rem) / 100))`,
                transform: 'translateX(-50%)',
              }}
              title={`Trung vị (Median): ${format1Dec(stats.median)}đ`}
            />
          </div>
        </div>
      </div>

      {/* 4. COMPREHENSIVE COMMENTARY CARD (CLEAN SINGLE VISUAL BOUNDARY) */}
      <BgdDetailedCommentaryCard
        evaluation={stats.evaluation}
        distributionRating={stats.distributionRating}
      />
    </div>
  );
};
