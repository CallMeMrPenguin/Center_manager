import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { DistributionDetailedEvaluation } from '../utils/distributionAnalytics';

interface DistributionCommentaryCardProps {
  evaluation: DistributionDetailedEvaluation;
  distributionRating: string;
}

export const DistributionCommentaryCard: React.FC<DistributionCommentaryCardProps> = ({
  evaluation,
  distributionRating,
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
      className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-5 select-none relative animate-cascade-3 font-sans transition-colors"
    >
      {/* 1. HEADER TITLE & RATING BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
          {evaluation.subjectTitle}
        </h4>
        <span className="px-3 py-1 rounded-lg text-xs font-black bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
          {distributionRating}
        </span>
      </div>

      {/* 2. POINT-BY-POINT METRIC BREAKDOWN (Zero emojis, clean divide-y, glowing indicator dots) */}
      <div className="space-y-0.5 divide-y divide-slate-100 dark:divide-white/5">
        {evaluation.metrics.map((item) => {
          const isTooltipActive = activeTooltipId === item.id;

          return (
            <div
              key={item.id}
              className="py-2.5 flex items-start justify-between gap-3 relative group"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
                {/* Glowing Indicator Dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5 shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                  style={{ backgroundColor: item.color }}
                />
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

      {/* 3. KẾT LUẬN PHÂN TÍCH PHỔ ĐIỂM */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            KẾT LUẬN
          </span>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
          {evaluation.conclusion.overviewSummary}
        </p>

        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed border-l-2 border-indigo-500/80 pl-3.5 py-0.5">
          {evaluation.conclusion.dispersionWarning}
        </p>
      </div>
    </div>
  );
};
