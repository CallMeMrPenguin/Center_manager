import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { DistributionDetailedEvaluation, DistributionBand } from '../utils/distributionAnalytics';

interface DistributionCommentaryCardProps {
  evaluation: DistributionDetailedEvaluation;
  distributionRating: string;
  bands?: DistributionBand[];
}

export const DistributionCommentaryCard: React.FC<DistributionCommentaryCardProps> = ({
  evaluation,
  distributionRating,
  bands,
}) => {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close floating tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveTooltipId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-5 select-none relative font-sans transition-colors"
    >
      {/* 1. SECTION TITLE & RATING BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <h4 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">
          Đánh giá
        </h4>
        <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30">
          {distributionRating}
        </span>
      </div>

      {/* 2. SCORE TIER CARDS (OUTSIDE CARD, NO BULLET DOTS) */}
      {bands && bands.length >= 4 && (
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-500/10 font-bold">
            Yếu &lt;5.0 ({bands[0].pct}%)
          </span>
          <span className="px-3 py-1.5 rounded-xl text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold">
            TB 5.0-6.4 ({bands[1].pct}%)
          </span>
          <span className="px-3 py-1.5 rounded-xl text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 font-bold">
            Khá 6.5-7.9 ({bands[2].pct}%)
          </span>
          <span className="px-3 py-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-bold">
            Giỏi ≥8.0 ({bands[3].pct}%)
          </span>
        </div>
      )}

      {/* 3. POINT-BY-POINT METRICS (NO BULLET DOTS) */}
      <div className="space-y-0.5 divide-y divide-slate-100 dark:divide-white/5">
        {evaluation.metrics.map((item) => {
          const isTooltipActive = activeTooltipId === item.id;

          return (
            <div
              key={item.id}
              className="py-2.5 flex items-start justify-between gap-3 relative group"
            >
              <div className="min-w-0 pr-2">
                <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {item.text}
                </p>
              </div>

              {/* Info Popover Button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTooltipId(isTooltipActive ? null : item.id)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isTooltipActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                  title={`Giải thích chi tiết về ${item.label}`}
                >
                  <Info size={13} />
                </button>

                {/* Floating Popover Card */}
                {isTooltipActive && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 p-3.5 rounded-xl bg-white dark:bg-[#12172b] border border-slate-300 dark:border-[#2c375e] text-xs shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between text-blue-600 dark:text-blue-300 font-bold border-b border-slate-200 dark:border-white/10 pb-1.5">
                      <span className="uppercase text-[10px] tracking-wider">
                        Ý Nghĩa: {item.tooltipTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTooltipId(null)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {item.tooltipDesc}
                    </p>
                    <div className="bg-slate-50 dark:bg-[#090d18] p-2.5 rounded-lg border border-slate-300 dark:border-[#1e2744] space-y-1 font-mono text-[10px]">
                      <div className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {item.tooltipFormula}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 font-sans">
                        {item.tooltipImpact}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. NHẬN XÉT CHUNG & CẦN CỦNG CỐ (OUTSIDE CARD, LARGE TEXT, DISTINCT COLOR) */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            Nhận xét chung
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {evaluation.conclusion.overviewSummary}
          </p>
        </div>

        {evaluation.conclusion.dispersionWarning && (
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              Cần củng cố
            </span>
            <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-snug">
              {evaluation.conclusion.dispersionWarning}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
