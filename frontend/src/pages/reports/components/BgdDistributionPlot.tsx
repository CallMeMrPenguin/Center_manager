import React, { useState } from 'react';
import { Award, BookOpen, AlertCircle, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { BgdDistributionStats } from '../utils/bgdAnalytics';
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
  const [hoveredBandId, setHoveredBandId] = useState<string | null>(null);
  const [distributionViewType, setDistributionViewType] = useState<'4bands' | '10bins'>('4bands');

  const maxBandCount = Math.max(1, ...stats.bands.map(b => b.count));
  const maxBinCount = Math.max(1, ...stats.scoreBins.map(b => b.count));

  return (
    <div className="flex flex-col gap-6 select-none animate-cascade-2">
      {/* 1. TOP STATS HEADER & VIEW TOGGLE */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            HÌNH THỨC HIỂN THỊ PHỔ ĐIỂM
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Chuẩn Bộ Giáo Dục
          </span>
        </div>

        {/* Sliding Pill Selector between 4 Tiers and 10 Bins */}
        <div className="relative flex bg-[#141b32] border border-[#232d4e] p-1 rounded-xl text-xs font-extrabold select-none w-64 shrink-0">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-indigo-600 shadow-[0_0_14px_rgba(99,102,241,0.5)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
            style={{
              left: distributionViewType === '4bands' ? '4px' : 'calc(50% + 1px)',
              width: 'calc(50% - 4px)',
            }}
          />
          <button
            type="button"
            onClick={() => setDistributionViewType('4bands')}
            className={`flex-1 relative z-10 py-1 text-center transition-colors cursor-pointer ${
              distributionViewType === '4bands' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            4 Phân Khúc Học Lực
          </button>
          <button
            type="button"
            onClick={() => setDistributionViewType('10bins')}
            className={`flex-1 relative z-10 py-1 text-center transition-colors cursor-pointer ${
              distributionViewType === '10bins' ? 'text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Phổ Điểm Chi Tiết 10 Thang
          </button>
        </div>
      </div>

      {/* 2. SVG BAR CHART VISUALIZATION CANVAS */}
      <div className="relative rounded-2xl bg-[#080b14]/70 border border-[#182138] p-6 shadow-2xl flex flex-col gap-6">
        {/* SVG Distribution Plot Area */}
        <div className="w-full h-72 relative flex items-end justify-between gap-4 sm:gap-8 pt-8 pb-4 px-2 sm:px-6">
          {distributionViewType === '4bands' ? (
            stats.bands.map((band, idx) => {
              const heightPct = Math.max(8, Math.round((band.count / maxBandCount) * 85));
              const isHovered = hoveredBandId === band.id;

              return (
                <div
                  key={band.id}
                  onMouseEnter={() => setHoveredBandId(band.id)}
                  onMouseLeave={() => setHoveredBandId(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                >
                  {/* Top floating value badge */}
                  <div className="mb-2 flex flex-col items-center transition-transform duration-200 group-hover:-translate-y-1">
                    <span className="text-base sm:text-lg font-black font-mono text-white">
                      {band.count}
                    </span>
                    <span className="text-[11px] font-bold font-mono" style={{ color: band.color }}>
                      {band.pct}%
                    </span>
                  </div>

                  {/* The Vertical Bar */}
                  <div className="w-full max-w-[120px] h-full flex items-end">
                    <div
                      className="w-full rounded-t-xl transition-all duration-500 ease-out relative overflow-hidden"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: band.color,
                        boxShadow: isHovered
                          ? `0 0 24px ${band.color}90`
                          : `0 0 12px ${band.color}40`,
                        opacity: hoveredBandId && !isHovered ? 0.45 : 1,
                      }}
                    >
                      {/* Inner sheen gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/25" />
                    </div>
                  </div>

                  {/* Label below bar */}
                  <div className="mt-3 text-center">
                    <span className="text-xs sm:text-sm font-black text-slate-200 block truncate">
                      {band.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {band.minScore} - {band.maxScore}đ
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            stats.scoreBins.map((bin, idx) => {
              const heightPct = Math.max(4, Math.round((bin.count / maxBinCount) * 85));
              const isHigh = bin.min >= 8;
              const isMid = bin.min >= 5 && bin.min < 8;
              const barColor = isHigh ? '#10b981' : isMid ? '#06b6d4' : '#f43f5e';

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                >
                  <div className="mb-1 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-black font-mono text-white">{bin.count} HS</span>
                    <span className="text-[10px] font-mono text-indigo-300">{bin.pct}%</span>
                  </div>

                  <div className="w-full h-full flex items-end">
                    <div
                      className="w-full rounded-t-md transition-all duration-300 ease-out relative group-hover:brightness-125"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>

                  <span className="mt-2 text-[10px] font-bold text-slate-400 font-mono">
                    {bin.min}đ
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* 3. HORIZONTAL BOX PLOT (BIỂU ĐỒ HỘP BGD) */}
        <div className="bg-[#0e1424] border border-[#1f2b48] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-300">
            <span className="uppercase tracking-wider text-indigo-300">
              BIỂU ĐỒ HỘP & TỨ PHÂN VỊ (BOX PLOT SUMMARY)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Min: {format1Dec(stats.min)}đ | Q1: {format1Dec(stats.q1)}đ | Trung vị: {format1Dec(stats.median)}đ | Q3: {format1Dec(stats.q3)}đ | Max: {format1Dec(stats.max)}đ
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

      {/* 4. DETAILED PEDAGOGICAL COMMENTARY PANEL */}
      <div className="bg-[#0b0f19] border border-[#1b253b] rounded-2xl p-6 shadow-xl space-y-5">
        {/* Title and Rating Headline */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <BookOpen size={16} className="text-indigo-400" />
            <h4 className="text-sm font-black uppercase text-white tracking-wider">
              NHẬN XÉT & ĐÁNH GIÁ SƯ PHẠM CHI TIẾT (CHUẨN BỘ GIÁO DỤC)
            </h4>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {stats.distributionRating}
          </span>
        </div>

        {/* Highlight Headline */}
        <div className="p-3.5 rounded-xl bg-[#12182c] border border-[#232f52] flex items-start gap-3">
          <Award size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-bold text-slate-200 leading-relaxed">
            {stats.commentary.headline}
          </p>
        </div>

        {/* 3 Structured Educational Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dimension 1: Mean vs Median */}
          <div className="bg-[#0d1222] p-4 rounded-xl border border-[#1d2744] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                  Mặt Bằng & Phân Bố
                </span>
                <span className="text-[10px] font-mono text-slate-400">Mean / Median</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {stats.commentary.meanVsMedianInsight}
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-blue-300 font-bold">
              Chênh lệch: {format1Dec(stats.mean - stats.median > 0 ? stats.mean - stats.median : stats.median - stats.mean)}đ
            </div>
          </div>

          {/* Dimension 2: Dispersion (SD & IQR) */}
          <div className="bg-[#0d1222] p-4 rounded-xl border border-[#1d2744] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-400">
                  Độ Phân Hóa Học Lực
                </span>
                <span className="text-[10px] font-mono text-slate-400">SD & IQR</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {stats.commentary.dispersionInsight}
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-purple-300 font-bold">
              {stats.sdLabel}
            </div>
          </div>

          {/* Dimension 3: Quality & Pass Rate */}
          <div className="bg-[#0d1222] p-4 rounded-xl border border-[#1d2744] space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Tỷ Lệ Đạt & Xuất Sắc
                </span>
                <span className="text-[10px] font-mono text-slate-400">≥ 5.0 & ≥ 8.0</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {stats.commentary.passExcellenceInsight}
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-emerald-300 font-bold">
              Đạt chuẩn: {stats.passPct}%
            </div>
          </div>
        </div>

        {/* Actionable Pedagogical Recommendations */}
        <div className="space-y-2.5 pt-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
            KHUYẾN NGHỊ HÀNH ĐỘNG SƯ PHẠM DÀNH CHO GIÁO VIÊN
          </span>
          <div className="space-y-2">
            {stats.commentary.pedagogicalActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 bg-[#0e1424] p-3 rounded-xl border border-[#1f2b48] text-xs text-slate-200"
              >
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
